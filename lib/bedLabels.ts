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
  if (!value) return "Bed";
  let str = String(value).trim();

  // Strip leading "Bed" or "bed" or "b" prefixes
  while (/^bed\b[\s-_]*/i.test(str)) {
    str = str.replace(/^bed\b[\s-_]*/i, "").trim();
  }
  str = str.replace(/^b[\s-_]+(?=[a-z0-9])/i, "").trim();

  // Pattern 1: Number with letter suffix (e.g. "101-A", "101 A", "101A", "101_B", "101-b")
  const numLetterMatch = str.match(/^(\d+)[\s-_]*([a-zA-Z]+)$/);
  if (numLetterMatch) {
    return `Bed ${numLetterMatch[1]} ${numLetterMatch[2].toUpperCase()}`;
  }

  // Pattern 2: Letter with number (e.g. "A-101", "A 101")
  const letterNumMatch = str.match(/^([a-zA-Z]+)[\s-_]*(\d+)$/);
  if (letterNumMatch) {
    return `Bed ${letterNumMatch[2]} ${letterNumMatch[1].toUpperCase()}`;
  }

  // Pattern 3: Pure number (e.g. "101", "1")
  const numMatch = str.match(/^(\d+)$/);
  if (numMatch) {
    return `Bed ${numMatch[1]}`;
  }

  // Pattern 4: Custom label
  return str ? `Bed ${str.toUpperCase()}` : "Bed";
}

export function canonicalBedLabelKey(value: string | null | undefined) {
  return normalizeBedLabel(value).toLowerCase().replace(/\s+/g, " ");
}

export function compareBedRecordsAscending<T extends BedLabelRecord>(
  left: T,
  right: T,
) {
  const leftLabel = normalizeBedLabel(left.bed_number);
  const rightLabel = normalizeBedLabel(right.bed_number);

  const labelComparison = leftLabel.localeCompare(rightLabel, undefined, {
    numeric: true,
    sensitivity: "base",
  });
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
  roomNumber?: string | null,
) {
  const usedKeys = new Set(historicalBedNumbers.map(canonicalBedLabelKey));

  // Extract room prefix if available
  let prefix = roomNumber ? String(roomNumber).trim() : "";
  if (!prefix && historicalBedNumbers.length > 0) {
    for (const raw of historicalBedNumbers) {
      const match = String(raw).match(/^(\d+)/);
      if (match) {
        prefix = match[1];
        break;
      }
    }
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const labels: string[] = [];

  if (prefix) {
    for (
      let i = 0;
      i < letters.length && labels.length < Math.max(0, count);
      i++
    ) {
      const candidate = `${prefix} ${letters[i]}`;
      const candidateKey = canonicalBedLabelKey(candidate);
      if (!usedKeys.has(candidateKey)) {
        labels.push(candidate);
        usedKeys.add(candidateKey);
      }
    }
  }

  let nextNumber = 1;
  while (labels.length < Math.max(0, count)) {
    const candidate = prefix ? `${prefix} ${nextNumber}` : `Bed ${nextNumber}`;
    const candidateKey = canonicalBedLabelKey(candidate);
    if (!usedKeys.has(candidateKey)) {
      labels.push(candidate);
      usedKeys.add(candidateKey);
    }
    nextNumber += 1;
  }

  return labels;
}
