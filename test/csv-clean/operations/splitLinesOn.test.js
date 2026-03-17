import { Readable } from "node:stream";
import { test, describe } from "node:test";
import assert from "node:assert";
import { splitLinesOn } from "../../../src/csv-clean/operations/index.js";

describe("splitLinesOn", () => {
  test("splits lines", async () => {
    const customFilter = splitLinesOn({
      match: /\d{2}.\d{2}/,
      splitField: "description",
      newField: "date",
    });

    const data = [
      {
        description: "22.02 line 1, 22.02",
      },
      {
        description: "line 2",
      },
      {
        description: "23.02 line 3",
      },
    ];
    const result = await Readable.from(data).compose(customFilter).toArray();

    assert.deepStrictEqual(result, [
      {
        description: "line 1, 22.02",
        date: "22.02",
      },
      {
        description: "line 2",
        date: "",
      },
      {
        description: "line 3",
        date: "23.02",
      },
    ]);
  });
});
