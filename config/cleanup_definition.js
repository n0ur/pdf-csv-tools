export const config = {
  parse: {
    // column names for the file to read or parse
    // undefined means skip this column and don't parse it
    headers: ["field1", undefined, "field2"],
  },
  format: {
    // column names for the file to write or format
    // Note: Column names will not written to file,
    //       they are used to reference in the operations below
    headers: ["field1", "field2", "field3"],
  },
  // Operations are run in the order they are defined
  operations: [
    {
      name: "skip_lines_from",
      args: ["Text 1"],
    },
    // ...
  ],
};
