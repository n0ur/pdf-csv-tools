import { Readable } from "node:stream";
import { test, describe } from "node:test";
import assert from "node:assert";
import { skipLinesFrom } from "../../../src/csv-clean/operations/index.js";

describe("skipLinesFrom", () => {
  test("removes lines on and after matched value", async () => {
    const customFilter = skipLinesFrom(["2"]);

    const data = ["line 1", "line 2", "line 3"];

    const result = await Readable.from(data).compose(customFilter).toArray();

    assert.deepStrictEqual(result, ["line 1"]);
  });
});
