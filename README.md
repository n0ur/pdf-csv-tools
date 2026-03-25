# PDF/CSV tools

A collection of CLI tools for PDF/CSV files: convert, clean, aggregate.

#### pdf2csv

Converts PDF files to CSV using tabula-java.

```
npm run pdf2csv -- *.pdf --output csv/ --concurrency 5
```

This simply runs the following command on all the pdf files:

```bash
tabula-java file.pdf -page all -t -o output.csv
```

#### csv-clean

Cleans up CSV files based on user defined rules in a definition file.

```
npm run csv-clean -- *.csv \
    --output clean/ \
    --definition config/cleanup_definition.js \
    --concurrency 5
```

#### csv-aggregate

Aggregates CSV files based on user defined rules in a definition file.

```
npm run csv-aggregate -- *.csv \
    --output aggregate/ \
    --definition config/aggregate_definition.js \
    --concurrency 5
```

## csv-clean

This operation takes a cleanup definition file and applies it to the csv files. It uses `fast-csv` for parsing and writing the updated clean versions. The original files are not modified, new ones are created in the given output directory.

### Example

<div style="display:flex;">
<div style="margin-right: 30px">
Before (possibly after a pdf conversion):

|                        |      |         |
| ---------------------- | ---- | ------- |
| Bank Statement at Bank | XYZ  |         |
| 01.01.2026 Rent to XYZ |      | -900,70 |
| Page                   | 1/10 |         |
| 04.01.2026 Insurance   |      | -50,00  |
| 28.01.2026 Salary      |      | +100,00 |
| CUSTOMER INFO          | XYZ  |         |
| NAME, ADDRESS, PHONE   | XYZ  |         |

</div>

<div>
After cleanup:

| Date       | Description | Amount  |
| ---------- | ----------- | ------- |
| 01.01.2026 | Rent to XYZ | -900,70 |
| 04.01.2026 | Insurance   | -50,00  |
| 28.01.2026 | Salary      | +100,00 |

</div>
</div>

### Definition file

See `config/cleanup_definition.js`

### Supported operations

#### skip_lines_including

Case-sensitive, string matching using `includes()`

<div style="display:flex;">
<div style="margin-right: 30px; width: 50%">

```js
{
  name: "skip_lines_including",
  args: [
    "StatementPage",
    "Account number",
  ],
}
```

</div>

<div>

```diff
01.01.2026 Rent to XYZ, ,"-900,70"
- StatementPage, 1,
04.01.2026 Insurance, ,"-50,00"
- Account number, XYZ,
```

</div>
</div>

#### skip_lines_from

Case-sensitive, string matching using `includes()`

<div style="display:flex;">
<div style="margin-right: 30px; width: 50%">

```js
{
  name: "skip_lines_from",
  args: [
    "CUSTOMER INFORMATION"
  ],
}
```

</div>

<div>

```diff
01.01.2026 Rent to XYZ, ,"-900,70"
04.01.2026 Insurance, ,"-50,00"
- CUSTOMER INFORMATION, ,
- Name, ID, ,
- Address, ,
- ....
```

</div>
</div>

#### merge_lines

All rows that have an empty `emptyField`, will be merged into the previous row's `mergeField`.
This example requries `parse.headers` in the definition file to include "description" and "amount".

<div style="display:flex;">
<div style="margin-right: 30px; width: 50%">

```js
{
  name: "merge_lines",
  args: {
    mergeField: "description",
    emptyField: "amount",
  }
}
```

</div>

<div>

```diff
- Rent to XYZ, "-900,70"
- details,
- Insurance, "-50,00"
- Other details,
+ Rent to XYZ details, "-900,70"
+ Insurance Other details, "-50,00"
```

</div>
</div>

#### split_lines_on

Splits a field in a line based on regex.

For this operation to work, make sure the `headers` are set properly in the config. This example would need `parse.headers` to include "description",
and `format.headers` to include "date".

<div style="display:flex;">
<div style="margin-right: 30px; width: 50%">

```js
{
    name: "split_lines_on",
    args: {
        match: "\\d{2}.\\d{2}",
        splitField: "description",
        newField: "date"
    }
},
```

</div>

<div>

```diff
- 01.01 Rent to XYZ, "-900,70"
- 04.01 Insurance, "-50,00"
+ 01.01, Rent to XYZ, "-900,70"
+ 04.01, Insurance, "-50,00"
```

</div>
</div>

#### append_to_field

Appends a value to a field.

This example needs `format.headers` to include "date".

<div style="display:flex;">
<div style="margin-right: 30px; width: 50%">

```js
{
    name: "append_to_field",
    args: {
        field: "date",
        value: "2026"
    }
},
```

</div>

<div>

```diff
- 01.01., Rent to XYZ, "-900,70"
- 04.01., Insurance, "-50,00"
+ 01.01.2026, Rent to XYZ, "-900,70"
+ 04.01.2026, Insurance, "-50,00"
```

</div>
</div>

### Extend the operations

- Define a new operation as a Transform stream in `src/csv-clean/operations`.
- Extend the schema in `src/csv-clean/cleanupSchema.js`.
- Add tests.

## csv-aggregate

This operation aggregates lines in a CSV files as defined in the definition file, it also combines the aggregated data of all files into one summary file. It uses `fast-csv` for parsing and writing the updated clean versions. The original files are not modified, new ones are created in the given output directory.

### Example

Given CSV files with this format:

<div style="display:flex;">
<div style="margin-right: 30px; width: 50%">
File 1:

| Date     | Description | Amount   |
| -------- | ----------- | -------- |
| 01.01.26 | Rent XYZ    | -900,70  |
| 04.01.26 | Insurance   | -50,00   |
| 28.01.26 | Salary      | +1000,00 |
| 28.01.26 | Coffee      | -10,00   |
| 31.01.26 | Tea         | -30,00   |

</div>

<div>
File 2:

| Date     | Description | Amount   |
| -------- | ----------- | -------- |
| 01.02.26 | Rent XYZ    | -900,70  |
| 15.02.26 | Supermarket | -60,00   |
| 16.02.26 | Flight to X | -70,00   |
| 17.02.26 | Coffee      | -10,00   |
| 28.02.26 | Salary      | +1000,00 |

</div>
</div>

The script will first aggregate each file independently; rows are grouped by categories defined in the definition file, and the date range is calculated and added as an extra row. This example defines 3 categories (Rent, Salary, Other Expenses).

<div style="display:flex;">
<div style="margin-right: 30px; width: 50%">

File 1:

| Label          | Value               |
| -------------- | ------------------- |
| Date Range     | 01.01.26 - 31.01.26 |
| Rent           | -900,70             |
| Salary         | +1000,00            |
| Other Expenses | -90,00              |

</div>

<div style="margin-right: 30px">

File 2:

| Label          | Value               |
| -------------- | ------------------- |
| Date Range     | 01.02.26 - 28.02.26 |
| Rent           | -900,70             |
| Salary         | +1000,00            |
| Other Expenses | -140,00             |

</div>
</div>

All files are also combined in one summary file:

| Label          |                     |                     |
| -------------- | ------------------- | ------------------- |
| Date Range     | 01.01.26 - 31.01.26 | 01.02.26 - 28.02.26 |
| Rent           | -900,70             | -900,70             |
| Salary         | +1000,00            | +1000,00            |
| Other Expenses | -90,00              | -140,00             |

### Definition file

See `config/aggregate_definition.js`

### Supported operations

Note: Custom parsers and formatters are defined and used in the definition file.

#### aggregate_by_buckets

```js
{
    name: "aggregate_by_buckets",
    parse: {
        headers: ["description", "amount"],
    },
    args: {
        field: "amount",
        parseFn: "parse_eu_num",
        formatFn: "format_to_fixed",
        groupBy: {
            field: "description",
            buckets: [
                { label: "travel", keywords: ["flight", "car", "boat"] },
                { label: "default", keywords: [] }
            ]
        }
    }
},
```

```diff
- Rent to XYZ, "900,00-"
- Flight to X, "50,00-"
- And a boat trip, "50,00-"
- Food, "100,00-"
+ travel, "-100.00"
+ default, "-1000.00"
```

#### aggregate_date_range

```js
{
    name: "aggregate_date_range",
    parse: {
        headers: ["date"],
    },
    args: {
        field: "date",
        parseFn: "parse_date",
        formatFn: "format_date_range",
    }
},
```

```diff
- 01.01.2026, Rent to XYZ, "900,00-"
- 13.01.2026, Flight to X, "50,00-"
- 20.01.2026, And a boat trip, "50,00-"
- 31.01.2026, Food, "100,00-"
+ date, "01.01.2026 - 31.01.2026"
```

### Extend the operations

- Define a new operation as a Transform stream in `src/csv-aggregate/operations`.
- Extend the schema `src/csv-aggregate/aggregateSchema.js`.
- Add tests.

Extend parsers in `src/csv-aggregate/parsers.js` and formatters in `src/csv-aggregate/formatters.js`

## Install and run

- The convert operation requires tabula-java (version > 1.0.5)

- Run `npm install`
