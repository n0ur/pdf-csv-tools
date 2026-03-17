export const config = {
  parse: {
    headers: ["description", "amount"],
  },
  operations: [
    {
      name: "invalid_operation",
      args: ["Account Information"],
    },
    {
      name: "merge_lines",
      args: {
        mergeField: "description",
        emptyField: "amount",
        nonExistentField: "test",
      },
    },
  ],
};
