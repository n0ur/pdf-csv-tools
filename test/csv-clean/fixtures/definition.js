export const config = {
  parse: {
    headers: ["description", "amount"],
  },
  format: {
    headers: ["date", "description", "amount"],
  },
  operations: [
    {
      name: "skip_lines_from",
      args: ["Account Information"],
    },
    {
      name: "skip_lines_including",
      args: ["StatementPage"],
    },
    {
      name: "merge_lines",
      args: {
        mergeField: "description",
        emptyField: "amount",
      },
    },
    {
      name: "split_lines_on",
      args: {
        match: "\\d{2}.\\d{2}",
        splitField: "description",
        newField: "date",
      },
    },
  ],
};
