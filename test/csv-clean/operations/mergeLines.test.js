import { Readable } from "node:stream";
import { test, describe } from "node:test";
import assert from "node:assert";
import { mergeLines } from "../../../src/csv-clean/operations/index.js";

describe("mergeLines", () => {
  test("merges lines based on a line match", async () => {
    const customFilter = mergeLines({
      mergeField: "description",
      emptyField: "amount",
    });

    const data = [
      {
        description: "line 1",
        amount: "22",
      },
      {
        description: "line 2",
        amount: "",
      },
      {
        description: "line 3",
        amount: "23",
      },
      {
        description: "line 4",
        amount: "24",
      },
    ];

    const result = await Readable.from(data).pipe(customFilter).toArray();

    assert.deepStrictEqual(result, [
      {
        description: "line 1 line 2",
        amount: "22",
      },
      {
        description: "line 3",
        amount: "23",
      },
      {
        description: "line 4",
        amount: "24",
      },
    ]);
  });
});
