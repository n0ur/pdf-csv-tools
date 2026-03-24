export function formatDate(date) {
  if (isNaN(date.getTime())) {
    throw new Error(`Could not format date: ${date}`);
  }
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}.${m}.${y}`;
}

export function formatToFixed(n) {
  if (isNaN(n)) {
    throw new Error(`Could not format number: ${n}`);
  }
  return n.toFixed(2);
}

export function formatDateRange({ oldest, newest }) {
  return formatDate(oldest) + " - " + formatDate(newest);
}

export const formattersMap = {
  format_date: formatDate,
  format_to_fixed: formatToFixed,
  format_date_range: formatDateRange,
};
