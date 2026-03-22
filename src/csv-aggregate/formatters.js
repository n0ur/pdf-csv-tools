export function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}.${m}.${y}`;
}

export function formatToFixed(n) {
  return n.toFixed(2);
}

export function formatRange({ oldest, newest }) {
  return formatDate(oldest) + " - " + formatDate(newest);
}

export const formattersMap = {
  format_date: formatDate,
  format_to_fixed: formatToFixed,
  format_range: formatRange,
};
