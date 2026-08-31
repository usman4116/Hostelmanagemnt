export type BedLabelRecord = {
  id?: string | null;
  bed_number: string;
  created_at?: string | null;
};

export function parseBedNumber(value: string | null | undefined) {
  const matches = String(value ?? "").match(/\d+/g);
  if (!matches?.length) return null;

  const parsed = Number(matches[matches.length - 1]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeBedLabel(value: string | null | undefined) {
  const number = parseBedNumber(value);
  if (number !== null) return `Bed ${number}`;

  let remainder = String(value ?? "").trim();
  while (/^bed\b/i.test(remainder)) {
    remainder = remainder.replace(/^bed\b\s*/i, "").trim();
  }
  remainder = remainder.replace(/^b\s*/i, "").trim();

  return remainder ? `Bed ${remainder}` : "Bed";
}

export function canonicalBedLabelKey(value: string | null | undefined) {
  const number = parseBedNumber(value);
  return number === null
    ? `label:${normalizeBedLabel(value).toLowerCase()}`
    : `number:${number}`;
}

export function compareBedRecordsAscending<T extends BedLabelRecord>(
  left: T,
  right: T,
) {
  const leftNumber = parseBedNumber(left.bed_number);
  const rightNumber = parseBedNumber(right.bed_number);

  if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }
  if (leftNumber !== null && rightNumber === null) return -1;
  if (leftNumber === null && rightNumber !== null) return 1;

  const labelComparison = normalizeBedLabel(left.bed_number).localeCompare(
    normalizeBedLabel(right.bed_number),
    undefined,
    { numeric: true, sensitivity: "base" },
  );
  if (labelComparison !== 0) return labelComparison;

  const createdComparison = String(left.created_at ?? "").localeCompare(
    String(right.created_at ?? ""),
  );
  if (createdComparison !== 0) return createdComparison;
  return String(left.id ?? "").localeCompare(String(right.id ?? ""));
}

export function getNextCanonicalBedLabels(
  count: number,
  historicalBedNumbers: string[],
) {
  const usedNumbers = new Set(
    historicalBedNumbers
      .map(parseBedNumber)
      .filter((number): number is number => number !== null),
  );
  let nextNumber = Math.max(0, ...usedNumbers) + 1;
  const labels: string[] = [];

  while (labels.length < Math.max(0, count)) {
    if (!usedNumbers.has(nextNumber)) {
      labels.push(`Bed ${nextNumber}`);
      usedNumbers.add(nextNumber);
    }
    nextNumber += 1;
  }

  return labels;
}
