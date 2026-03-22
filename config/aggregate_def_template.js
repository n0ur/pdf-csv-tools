export const config = {
  format: {
    // column names for the file to write or format
    // Note: Column names will not written to file,
    //       they are used to reference in the operations below
    headers: ["field1", "field2"],
  },
  operations: [
    // similar to: select sum(field2) from x group by field3
    {
      name: "sum_group_by_buckets",
      parse: {
        headers: [undefined, "field2", "field3"],
      },
      args: {
        // the "sum" field args
        field: "field2",
        parseFn: "parse_eu_num",
        formatFn: "format_to_fixed",
        // the "groupBy" field args
        groupBy: {
          field: "field3",
          buckets: [
            { label: "bucket 1", keywords: ["synonym1", "synonym2"] },
            // a bucket with empty keywords is a catch-all for all rows that don't
            // fit in any of the buckets listed above.
            // If removed, a default bucket with the label "N/A" will be created
            { label: "default", keywords: [] },
          ],
        },
      },
    },
    // similar to: select date_range(date) from x
    {
      name: "date_range",
      parse: {
        headers: ["field1", undefined, undefined],
      },
      args: {
        field: "field1",
        parseFn: "parse_partial_date",
        formatFn: "format_date_range",
      },
    },
  ],
};
