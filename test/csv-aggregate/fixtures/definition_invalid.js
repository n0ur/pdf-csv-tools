const categories = [
  { label: "Salary", keywords: ["Gehalt", "Salary", "income"] },
  { label: "Travel", keywords: ["boats", "cars", "flight"] },
  { label: "Other expenses", keywords: [] },
];

export const config = {
  format: {
    headers: ["label", "value"],
  },
  operations: [
    {
      name: "aggregate_date_range",
      parse: {
        headers: ["Date Range", undefined, undefined],
      },
      args: {
        field: "Date Range",
        parseFn: "parse_date_nonexistent", // non existent parse fn
        formatFn: "format_date_range",
      },
    },
    {
      name: "aggregate_by_buckets",
      parse: {
        headers: [undefined, "description", "amount"],
      },
      args: {
        field: "amount",
        parseFn: "parse_eu_num",
        formatFn: "format_to_fixed",
        groupBy: { field: "description", buckets: categories },
      },
    },
  ],
};
