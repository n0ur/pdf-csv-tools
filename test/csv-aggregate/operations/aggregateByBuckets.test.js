import { Readable } from "node:stream";
import { test, describe } from "node:test";
import assert from "node:assert";
import { aggregateByBuckets } from "../../../src/csv-aggregate/operations/index.js";
import { parseEUNum } from "../../../src/csv-aggregate/parsers.js";
import { formatToFixed } from "../../../src/csv-aggregate/formatters.js";

describe("aggregateByBuckets", () => {
  test("groups data by buckets", async () => {
    const transform = aggregateByBuckets({
      format: {
        headers: ["label", "value"],
      },
      field: "amount",
      parseFn: parseEUNum,
      formatFn: formatToFixed,
      groupBy: {
        field: "description",
        buckets: [
          { label: "transportation", keywords: ["car", "boat"] },
          { label: "default", keywords: [] },
        ],
      },
    });

    const data = [
      {
        description: "cars trip",
        amount: "30,02-",
      },
      {
        description: "restaurant",
        amount: "60,00-",
      },
      {
        description: "boat trip",
        amount: "70,40-",
      },
    ];

    const result = await Readable.from(data).compose(transform).toArray();

    assert.deepStrictEqual(result, [
      { label: "transportation", value: "-100.42" },
      { label: "default", value: "-60.00" },
    ]);
  });
});
