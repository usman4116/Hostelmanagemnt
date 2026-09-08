import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage } from "@/lib/supabaseErrors";
import {
  canonicalBedLabelKey,
  compareBedRecordsAscending,
  getNextCanonicalBedLabels,
  normalizeBedLabel,
} from "@/lib/bedLabels";
import {
  ALLOCATABLE_BED_STATUSES,
  BED_STATUS,
  isOperationalBedStatus,
} from "@/lib/statuses";

const OPERATIONAL_ADMISSION_STATUSES = ["Active", "Pending"] as const;

type BedRow = {
  id: string;
  room_id: string;
  bed_number: string;
  status: string | null;
  created_at: string | null;
};

export type BedStatusChange = {
  id: string;
  previousStatus: string;
};

export type BedCapacityChanges = {
  statusChanges: BedStatusChange[];
  createdBedIds: string[];
};

export type BedCapacityResult = BedCapacityChanges & {
  requested: number;
  created: number;
  restored: number;
  deactivated: number;
  error: string | null;
};

export type BedProvisionResult = {
  requested: number;
  created: number;
  restored: number;
  errors: string[];
};

function emptyResult(): BedCapacityResult {
  return {
    requested: 0,
    created: 0,
    restored: 0,
    deactivated: 0,
    statusChanges: [],
    createdBedIds: [],
    error: null,
  };
}

export function getMissingBedNumbers(
  capacity: number,
  existingBedNumbers: string[],
  roomNumber?: string | null,
) {
  const missingCount = Math.max(capacity - existingBedNumbers.length, 0);
  return getNextCanonicalBedLabels(missingCount, existingBedNumbers, roomNumber);
}

async function getRoomBeds(roomId: string) {
  const [roomResult, bedResult] = await Promise.all([
    supabase.from("rooms").select("id, room_number").eq("id", roomId).maybeSingle(),
    supabase
      .from("beds")
      .select("id, room_id, bed_number, status, created_at")
      .eq("room_id", roomId),
  ]);

  const error = roomResult.error || bedResult.error;
  if (error || !roomResult.data) {
    return {
      room: null,
      beds: [] as BedRow[],
      error: getSupabaseErrorMessage(
        error,
        "Room and bed capacity could not be verified. Please refresh and try again.",
      ),
    };
  }

  return {
    room: roomResult.data as { id: string; room_number: string },
    beds: (bedResult.data ?? []) as BedRow[],
    error: null,
  };
}

async function operationalAdmissionForBed(bedId: string) {
  const { data, error } = await supabase
    .from("admissions")
    .select("id, status")
    .eq("bed_id", bedId)
    .in("status", [...OPERATIONAL_ADMISSION_STATUSES])
    .limit(1)
    .maybeSingle();

  return { admission: data, error };
}

async function validateSurplusBed(bed: BedRow) {
  const { data: currentBed, error: bedError } = await supabase
    .from("beds")
    .select("id, room_id, bed_number, status")
    .eq("id", bed.id)
    .eq("room_id", bed.room_id)
    .maybeSingle();

  if (bedError || !currentBed) {
    return "Room capacity could not be reduced because a surplus bed could not be verified. Please refresh and try again.";
  }

  const { admission, error: admissionError } =
    await operationalAdmissionForBed(bed.id);
  if (admissionError) {
    return `Room capacity could not be reduced because ${normalizeBedLabel(bed.bed_number)} allocation could not be verified. Please refresh and try again.`;
  }

  if (currentBed.status === BED_STATUS.OCCUPIED || admission) {
    return `Room capacity cannot be reduced because ${normalizeBedLabel(bed.bed_number)} currently has an active allocation. Complete, cancel, or move the admission first.`;
  }

  if (!ALLOCATABLE_BED_STATUSES.some((status) => status === currentBed.status)) {
    return `Room capacity could not be reduced because ${normalizeBedLabel(bed.bed_number)} is no longer vacant. Please refresh and try again.`;
  }

  return null;
}

export async function rollbackRoomBedChanges(
  changes: BedCapacityChanges,
) {
  const errors: string[] = [];

  for (const change of [...changes.statusChanges].reverse()) {
    const { error } = await supabase
      .from("beds")
      .update({ status: change.previousStatus })
      .eq("id", change.id);
    if (error) errors.push(change.id);
  }

  for (const bedId of changes.createdBedIds) {
    const { error } = await supabase
      .from("beds")
      .update({ status: BED_STATUS.INACTIVE })
      .eq("id", bedId);
    if (error) errors.push(bedId);
  }

  return errors.length === 0;
}

export async function prepareRoomBedCapacity({
  roomId,
  capacity,
  allowIncrease = true,
}: {
  roomId: string;
  capacity: number;
  allowIncrease?: boolean;
}): Promise<BedCapacityResult> {
  const result = emptyResult();
  const current = await getRoomBeds(roomId);
  if (current.error) return { ...result, error: current.error };

  const activeBeds = current.beds
    .filter((bed) => isOperationalBedStatus(bed.status))
    .sort(compareBedRecordsAscending);

  if (activeBeds.length > capacity) {
    const surplusBeds = activeBeds
      .slice()
      .sort((left, right) => compareBedRecordsAscending(right, left))
      .slice(0, activeBeds.length - capacity);
    result.requested = surplusBeds.length;

    for (const bed of surplusBeds) {
      const validationError = await validateSurplusBed(bed);
      if (validationError) return { ...result, error: validationError };
    }

    for (const bed of surplusBeds) {
      const validationError = await validateSurplusBed(bed);
      if (validationError) {
        const rolledBack = await rollbackRoomBedChanges(result);
        return {
          ...result,
          error: rolledBack
            ? validationError
            : `${validationError} A previous bed status could not be restored; refresh and review this room.`,
        };
      }

      const { data, error } = await supabase
        .from("beds")
        .update({ status: BED_STATUS.INACTIVE })
        .eq("id", bed.id)
        .eq("room_id", roomId)
        .in("status", [...ALLOCATABLE_BED_STATUSES])
        .select("id")
        .maybeSingle();

      if (error || !data) {
        const rolledBack = await rollbackRoomBedChanges(result);
        return {
          ...result,
          error: rolledBack
            ? `Room capacity was not changed because ${normalizeBedLabel(bed.bed_number)} could not be made Inactive.`
            : `Room capacity was not changed, and a previous bed status could not be restored. Refresh and review this room.`,
        };
      }

      result.statusChanges.push({
        id: bed.id,
        previousStatus: bed.status ?? BED_STATUS.VACANT,
      });
      result.deactivated += 1;

      const postUpdateAdmission = await operationalAdmissionForBed(bed.id);
      if (postUpdateAdmission.error || postUpdateAdmission.admission) {
        const rolledBack = await rollbackRoomBedChanges(result);
        return {
          ...result,
          error: rolledBack
            ? `Room capacity cannot be reduced because ${normalizeBedLabel(bed.bed_number)} received an active allocation while the room was being updated. No capacity change was kept.`
            : `Room capacity was not changed after ${normalizeBedLabel(bed.bed_number)} received an active allocation, and a previous bed status could not be restored. Refresh and review this room.`,
        };
      }
    }

    return result;
  }

  if (!allowIncrease || activeBeds.length === capacity) return result;

  const inactiveBeds = current.beds
    .filter((bed) => bed.status === BED_STATUS.INACTIVE)
    .sort(compareBedRecordsAscending);
  result.requested = capacity - activeBeds.length;
  const activatedLabels = new Set(
    activeBeds.map((bed) => canonicalBedLabelKey(bed.bed_number)),
  );

  for (const bed of inactiveBeds) {
    if (activeBeds.length + result.restored >= capacity) break;
    const canonicalKey = canonicalBedLabelKey(bed.bed_number);
    if (activatedLabels.has(canonicalKey)) continue;

    const operationalAdmission = await operationalAdmissionForBed(bed.id);
    if (operationalAdmission.error) {
      const rolledBack = await rollbackRoomBedChanges(result);
      return {
        ...result,
        error: rolledBack
          ? `Room capacity was not changed because ${normalizeBedLabel(bed.bed_number)} allocation could not be verified.`
          : "Room capacity was not changed, and a restored bed could not be returned to Inactive. Refresh and review this room.",
      };
    }
    if (operationalAdmission.admission) continue;

    const { data, error } = await supabase
      .from("beds")
      .update({ status: BED_STATUS.VACANT })
      .eq("id", bed.id)
      .eq("room_id", roomId)
      .eq("status", BED_STATUS.INACTIVE)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      const rolledBack = await rollbackRoomBedChanges(result);
      return {
        ...result,
        error: rolledBack
          ? `Room capacity was not changed because ${normalizeBedLabel(bed.bed_number)} could not be restored.`
          : "Room capacity was not changed, and a restored bed could not be returned to Inactive. Refresh and review this room.",
      };
    }

    result.statusChanges.push({ id: bed.id, previousStatus: BED_STATUS.INACTIVE });
    result.restored += 1;
    activatedLabels.add(canonicalKey);
  }

  const activeAfterRestore = activeBeds.length + result.restored;
  const missingBedNumbers = getNextCanonicalBedLabels(
    capacity - activeAfterRestore,
    current.beds.map((bed) => bed.bed_number),
    current.room?.room_number,
  );

  for (const bedNumber of missingBedNumbers) {
    const { data, error } = await supabase
      .from("beds")
      .insert({
        room_id: roomId,
        bed_number: bedNumber,
        status: BED_STATUS.VACANT,
      })
      .select("id")
      .single();

    if (error || !data) {
      const rolledBack = await rollbackRoomBedChanges(result);
      return {
        ...result,
        error: rolledBack
          ? `Room capacity was not changed because ${bedNumber} could not be created.`
          : "Room capacity was not changed, and an earlier bed change could not be restored. Refresh and review this room.",
      };
    }

    result.createdBedIds.push(String(data.id));
    result.created += 1;
  }

  return result;
}

export async function provisionRoomBeds({
  roomId,
  capacity,
}: {
  roomId: string;
  capacity: number;
  existingBedNumbers?: string[];
}): Promise<BedProvisionResult> {
  const result = await prepareRoomBedCapacity({ roomId, capacity });
  return {
    requested: result.requested,
    created: result.error ? 0 : result.created,
    restored: result.error ? 0 : result.restored,
    errors: result.error ? [result.error] : [],
  };
}

export async function addSingleBed({
  roomId,
  bedNumber,
  mattressCondition,
  mattressCover,
}: {
  roomId: string;
  bedNumber?: string;
  mattressCondition?: string | null;
  mattressCover?: string | null;
}): Promise<{
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bed?: any;
  newCapacity?: number;
  error?: string;
}> {
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, room_number, capacity, total_beds, status")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError || !room) {
    return { success: false, error: "The room could not be found." };
  }

  if (room.status === "Inactive") {
    return { success: false, error: "Cannot add beds to an Inactive room." };
  }

  const { data: existingBeds, error: bedListError } = await supabase
    .from("beds")
    .select("id, bed_number, status")
    .eq("room_id", roomId);

  if (bedListError) {
    return { success: false, error: "Unable to verify existing beds in this room." };
  }

  const existingBedNumbers = (existingBeds ?? []).map((b) => b.bed_number);
  const finalBedNumber = bedNumber?.trim()
    ? normalizeBedLabel(bedNumber.trim())
    : normalizeBedLabel(
        getNextCanonicalBedLabels(1, existingBedNumbers, room.room_number)[0] ||
          `${room.room_number} A`,
      );

  const canonicalKey = canonicalBedLabelKey(finalBedNumber);
  if (
    (existingBeds ?? []).some(
      (b) => canonicalBedLabelKey(b.bed_number) === canonicalKey,
    )
  ) {
    return {
      success: false,
      error: `A bed with number "${finalBedNumber}" already exists in Room ${room.room_number}.`,
    };
  }

  const { data: newBed, error: insertError } = await supabase
    .from("beds")
    .insert({
      room_id: roomId,
      bed_number: finalBedNumber,
      status: BED_STATUS.VACANT,
      mattress_condition: mattressCondition?.trim() || null,
      mattress_cover: mattressCover?.trim() || null,
    })
    .select("*")
    .single();

  if (insertError || !newBed) {
    return {
      success: false,
      error: getSupabaseErrorMessage(insertError, "The bed could not be created."),
    };
  }

  const currentOperationalCount =
    (existingBeds ?? []).filter((b) => isOperationalBedStatus(b.status)).length + 1;

  const currentCap = Number(room.capacity) || Number(room.total_beds) || 1;
  let newCapacity = currentCap;
  if (currentOperationalCount > currentCap) {
    newCapacity = currentOperationalCount;
    await supabase
      .from("rooms")
      .update({
        capacity: newCapacity,
        total_beds: newCapacity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);
  }

  return { success: true, bed: newBed, newCapacity };
}

export async function removeSingleBed({
  bedId,
  roomId,
}: {
  bedId: string;
  roomId?: string;
}): Promise<{ success: boolean; newCapacity?: number; error?: string }> {
  const { data: bed, error: bedError } = await supabase
    .from("beds")
    .select("id, room_id, bed_number, status")
    .eq("id", bedId)
    .maybeSingle();

  if (bedError || !bed) {
    return { success: false, error: "The bed could not be found." };
  }

  const effectiveRoomId = roomId || bed.room_id;

  if (bed.status === BED_STATUS.OCCUPIED) {
    return {
      success: false,
      error: `Cannot remove ${normalizeBedLabel(bed.bed_number)} because it is currently Occupied.`,
    };
  }

  const { data: activeAdm, error: admError } = await supabase
    .from("admissions")
    .select("id")
    .eq("bed_id", bedId)
    .in("status", ["Active", "Pending"])
    .limit(1)
    .maybeSingle();

  if (admError) {
    return { success: false, error: "Could not verify bed assignments." };
  }

  if (activeAdm) {
    return {
      success: false,
      error: `Cannot remove ${normalizeBedLabel(bed.bed_number)} because an active resident is allocated to it.`,
    };
  }

  const { error: deleteError } = await supabase
    .from("beds")
    .delete()
    .eq("id", bedId)
    .neq("status", BED_STATUS.OCCUPIED);

  if (deleteError) {
    const { error: inactiveError } = await supabase
      .from("beds")
      .update({
        status: BED_STATUS.INACTIVE,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bedId);

    if (inactiveError) {
      return {
        success: false,
        error: getSupabaseErrorMessage(deleteError, "The bed could not be removed."),
      };
    }
  }

  if (effectiveRoomId) {
    const { data: remainingBeds } = await supabase
      .from("beds")
      .select("id, status")
      .eq("room_id", effectiveRoomId);

    const remainingOperationalCount = (remainingBeds ?? []).filter(
      (b) => b.id !== bedId && isOperationalBedStatus(b.status),
    ).length;

    const { data: currentRoom } = await supabase
      .from("rooms")
      .select("id, capacity, total_beds")
      .eq("id", effectiveRoomId)
      .maybeSingle();

    if (currentRoom) {
      const currentCap =
        Number(currentRoom.capacity) || Number(currentRoom.total_beds) || 1;
      const newCapacity = Math.max(1, remainingOperationalCount);
      if (newCapacity < currentCap) {
        await supabase
          .from("rooms")
          .update({
            capacity: newCapacity,
            total_beds: newCapacity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", effectiveRoomId);
      }
      return { success: true, newCapacity };
    }
  }

  return { success: true };
}
