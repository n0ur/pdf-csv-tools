import { parse } from "@fast-csv/parse";
import { test, describe, afterEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { createReadStream, existsSync, rmSync } from "node:fs";
import { aggregate } from "../../src/csv-aggregate/index.js";
import { ZodError } from "zod";

const readCsvFile = async (file, headers) => {
  const rows = await new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(file)
      .pipe(parse({ headers }))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
  return rows;
};

describe("csvAggregate", () => {
  const outputDir = join(import.meta.dirname, "./fixtures/output");

  afterEach(() => {
    if (existsSync(outputDir)) {
      console.log("Deleting folder");
      rmSync(outputDir, { force: true, recursive: true });
    }
  });

  test("throws error when definition file doesn't exist", async () => {
    const file = join(import.meta.dirname, "./fixtures/sample.csv");
    await assert.rejects(
      aggregate([file], {
        definition: "./nonexistent.js",
        output: outputDir,
        concurrency: "1",
      }),
      /file doesn't exist/,
    );
  });

  test("throws error when definition schema is invalid", async () => {
    const file = join(import.meta.dirname, "./fixtures/sample.csv");
    const definition = join(
      import.meta.dirname,
      "./fixtures/definition_invalid.js",
    );
    await assert.rejects(
      aggregate([file], { definition, output: outputDir, concurrency: "1" }),
      ZodError,
    );
  });

  test("throws error when input file doesn't exist", async () => {
    const definition = join(import.meta.dirname, "./fixtures/definition.js");
    await assert.rejects(
      aggregate(["./nonexistent.csv"], {
        definition,
        output: outputDir,
        concurrency: "1",
      }),
      /no such file or directory/,
    );
  });

  test("processes multiple files", async () => {
    const file1 = join(import.meta.dirname, "./fixtures/sample.csv");
    const file2 = join(import.meta.dirname, "./fixtures/sample_2.csv");
    const out1 = join(import.meta.dirname, "./fixtures/output/sample.csv");
    const out2 = join(import.meta.dirname, "./fixtures/output/sample_2.csv");
    const definition = join(import.meta.dirname, "./fixtures/definition.js");

    await aggregate([file1, file2], {
      definition,
      output: outputDir,
      concurrency: "2",
    });
    assert(existsSync(out1));
    assert(existsSync(out2));
  });

  test("test the aggregate operation from start to end", async () => {
    // arrange
    const definition = join(import.meta.dirname, "./fixtures/definition.js");
    const files = [
      join(import.meta.dirname, "./fixtures/sample.csv"),
      join(import.meta.dirname, "./fixtures/sample_2.csv"),
    ];
    const outputFiles = [
      join(import.meta.dirname, "./fixtures/output/sample.csv"),
      join(import.meta.dirname, "./fixtures/output/sample_2.csv"),
      join(import.meta.dirname, "./fixtures/output/summary.csv"),
    ];

    // act
    await aggregate(files, {
      output: outputDir,
      definition,
      concurrency: "5",
    });

    // assert
    for (const file of outputFiles) {
      assert(existsSync(file));
    }

    const file1 = await readCsvFile(outputFiles[0], ["label", "value"]);
    assert.deepStrictEqual(file1, [
      {
        label: "Date Range",
        value: "01.01.15 - 30.04.15",
      },
      {
        label: "Salary",
        value: "0.00",
      },
      {
        label: "Travel",
        value: "-1301.15",
      },
      {
        label: "Other expenses",
        value: "-345.00",
      },
    ]);

    const file2 = await readCsvFile(outputFiles[1], ["label", "value"]);
    assert.deepStrictEqual(file2, [
      {
        label: "Date Range",
        value: "15.01.15 - 30.04.15",
      },
      {
        label: "Salary",
        value: "0.00",
      },
      {
        label: "Travel",
        value: "-1260.75",
      },
      {
        label: "Other expenses",
        value: "-390.00",
      },
    ]);

    const file3 = await readCsvFile(outputFiles[2], [
      "label",
      "file1",
      "file2",
    ]);
    assert.deepStrictEqual(file3, [
      {
        label: "Date Range",
        file1: "01.01.15 - 30.04.15",
        file2: "15.01.15 - 30.04.15",
      },
      {
        label: "Salary",
        file1: "0.00",
        file2: "0.00",
      },
      {
        label: "Travel",
        file1: "-1301.15",
        file2: "-1260.75",
      },
      {
        label: "Other expenses",
        file1: "-345.00",
        file2: "-390.00",
      },
    ]);
  });
});
