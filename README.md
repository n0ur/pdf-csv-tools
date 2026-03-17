# PDF/CSV tools

A collection of CLI tools for PDF/CSV files.

#### pdf2csv

Converts PDF files to CSV using tabula-java, to run it:

```
npm run pdf2csv -- *.pdf -o csv/

-o: Output directory (if it doesn't exist, the script will attempt to create it)
-c: Max number of concurrent processes to run (optional, default is 5)
```

This simply runs the following command on all the pdf files:

```bash
tabula-java file.pdf -page all -t -o output.csv
```

#### csv-clean

Cleans up CSV files based on user defined rules, to run it:

```
npm run csv-clean -- *.csv -o clean/ -d cleanup_def.js

-o: Output directory (if it doesn't exist, the script will attempt to create it)
-d: Path to the cleanup definition file
-c: Max number of concurrent processes to run (optional, default is 5)
```

## csv-clean

### Example

After a PDF is converted to CSV, it might look like this:

|                        |      |         |
| ---------------------- | ---- | ------- |
| Bank Statement at Bank | XYZ  |         |
| 01.01.2026 Rent to XYZ |      | -900,70 |
| Page                   | 1/10 |         |
| 04.01.2026 Insurance   |      | -50,00  |
| 28.01.2026 Salary      |      | +100,00 |
| CUSTOMER INFO          | XYZ  |         |
| NAME, ADDRESS, PHONE   | XYZ  |         |

We can define rules to clean it up to this:

| Date       | Description | Amount  |
| ---------- | ----------- | ------- |
| 01.01.2026 | Rent to XYZ | -900,70 |
| 04.01.2026 | Insurance   | -50,00  |
| 28.01.2026 | Salary      | +100,00 |

This operation takes a cleanup definition file and applies it to the csv files. It uses `fast-csv` for parsing and writing the updated clean versions. The original files are not modified, new ones are created in the given output directory.

### Definition file

The definition file follows a strict schema. To customize it, copy the template file in `config/cleanup_def_template.js` and edit it. Here are the supported options:

```js
{
  parse: {
    // column names for the file to read or parse
    // undefined means skip this column and don't parse it
    headers: ["field1", undefined, "field2"]
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
      args: [
        "Text 1",
      ],
    },
    // ...
  ],
};
```

### Supported operations

#### skip_lines_including

If a line matches any of the values, it will be removed.

Example:

```js
{
  name: "skip_lines_including",
  args: [
    "StatementPage",
    "Account number",
  ],
}
```

After applying the operation:

```diff
01.01.2026 Rent to XYZ, ,"-900,70"
- StatementPage, 1,
04.01.2026 Insurance, ,"-50,00"
- Account number, XYZ,
```

#### skip_lines_from

All lines matching and coming after any of the values will be removed.

Example:

```js
{
  name: "skip_lines_from",
  args: [
    "CUSTOMER INFORMATION"
  ],
}
```

After applying the operation:

```diff
01.01.2026 Rent to XYZ, ,"-900,70"
04.01.2026 Insurance, ,"-50,00"
- CUSTOMER INFORMATION, ,
- Name, ID, ,
- Address, ,
```

#### merge_lines

The merging behavior is as follows:
all rows that have an empty `emptyField`, will be merged into the previous row's `mergeField`.

For this operation to work, make sure the `headers` are set properly in the config. This example would need `parse.headers` to include "description" and "amount".

```js
{
  name: "merge_lines",
  args: {
    mergeField: "description",
    emptyField: "amount",
  }
}
```

After applying the operation:

```diff
01.01.2026 Info ,
- 01.01.2026 Rent to XYZ, ,"-900,70"
- details, ,
- 04.01.2026 Insurance, ,"-50,00"
- Other details, ,
+ 01.01.2026 Rent to XYZ details, ,"-900,70"
+ 04.01.2026 Insurance Other details, ,"-50,00"
```

#### split_lines_on

Splits a field in a line based on regex.

For this operation to work, make sure the `headers` are set properly in the config. This example would need `parse.headers` to include "description",
and `format.headers` to include "date".

```js
{
    operation: "split_lines_on",
    args: {
        match: "\\d{2}.\\d{2}",
        splitField: "description",
        newField: "date"
    }
},
```

After applying the operation:

```diff
- 01.01 Rent to XYZ, "-900,70"
- 04.01 Insurance, "-50,00"
+ 01.01, Rent to XYZ, "-900,70"
+ 04.01, Insurance, "-50,00"
```

### Extend the operations

Extending the cleanup operations is simple, make sure to:

- Define a new operation as a Transform stream in `src/csv-clean/operations`.
- Add the entry to `src/csv-clean/index.js`.
- Define the schema operation in `src/csv-clean/cleanupDefSchema.js`.
- Add tests.

## Install and run

- The convert operation requires tabula-java (version > 1.0.5)

- Run `npm install`
