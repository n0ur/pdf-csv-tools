import { Readable } from "node:stream";
import { test, describe } from "node:test";
import assert from "node:assert";
import { appendToField } from "../../../src/csv-clean/operations/index.js";

describe("appendToField", () => {
  test("appends a value to a field", async () => {
    const customFilter = appendToField({
      field: "date",
      value: "2024",
    });

    const data = [
      {
        date: "22.02.",
      },
      {
        date: "26.02.",
      },
    ];
    const result = await Readable.from(data).compose(customFilter).toArray();

    assert.deepStrictEqual(result, [
      {
        date: "22.02.2024",
      },
      {
        date: "26.02.2024",
      },
    ]);
  });
});
