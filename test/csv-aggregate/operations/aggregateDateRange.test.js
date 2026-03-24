import { Readable } from "node:stream";
import { test, describe } from "node:test";
import assert from "node:assert";
import { aggregateDateRange } from "../../../src/csv-aggregate/operations/index.js";
import { parseDate } from "../../../src/csv-aggregate/parsers.js";
import { formatDateRange } from "../../../src/csv-aggregate/formatters.js";

describe("aggregateDateRange", () => {
  test("groups rows by date range", async () => {
    const transform = aggregateDateRange({
      field: "date",
      parseFn: parseDate,
      formatFn: formatDateRange,
      format: {
        headers: ["label", "value"],
      },
    });

    const data = [
      {
        date: "12.04.2019",
      },
      {
        date: "01.04.2019",
      },
      {
        date: "12.05.2019",
      },
    ];
    const result = await Readable.from(data).compose(transform).toArray();

    assert.deepStrictEqual(result, [
      {
        label: "date",
        value: "01.04.19 - 12.05.19",
      },
    ]);
  });
});
