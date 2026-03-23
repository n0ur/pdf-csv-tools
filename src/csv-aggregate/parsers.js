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

// date: DD.MM.YYYY
export function parseDate(str) {
  const [d, m, y] = str.split(".");
  return new Date(+y, +m - 1, +d);
}

export const parsersMap = {
  parse_eu_num: parseEUNum,
  parse_date: parseDate,
};
