function partsFor(date: Date, timeZone: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" as const } : {}),
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
}

export function safeTimeZone(value: string | null | undefined) {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value;
  } catch {
    return "UTC";
  }
}

export function localDateKey(date: Date, timeZone: string) {
  const parts = partsFor(date, safeTimeZone(timeZone));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function startOfLocalDay(date: Date, timeZone: string) {
  const zone = safeTimeZone(timeZone);
  const target = partsFor(date, zone);
  const targetMillis = Date.UTC(Number(target.year), Number(target.month) - 1, Number(target.day));
  let candidate = new Date(targetMillis);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = partsFor(candidate, zone, true);
    const observedMillis = Date.UTC(Number(observed.year), Number(observed.month) - 1, Number(observed.day), Number(observed.hour), Number(observed.minute), Number(observed.second));
    candidate = new Date(candidate.getTime() + targetMillis - observedMillis);
  }
  return candidate;
}
