// 3.233,00-
export function parseEUNum(str) {
  const formatted = str.trim().replace(/[.]/g, "").replace(",", ".");
  const isNegative = formatted.endsWith("-") || formatted.startsWith("-");
  const parsed = parseFloat(formatted) * (isNegative ? -1 : 1);
  if (Number.isNaN(parsed)) {
    throw new Error(`Cound not parse EU number: ${str}`);
  }
  return parsed;
}

// date: DD.MM
export function parsePartialDate(str, year) {
  const [d, m] = str.split(".");
  const date = new Date(year, +m - 1, +d);
  return date;
}

export const parsersMap = {
  parse_eu_num: parseEUNum,
  parse_partial_date: parsePartialDate,
};
