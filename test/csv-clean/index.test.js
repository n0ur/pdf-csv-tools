import { parse } from "@fast-csv/parse";
import { test, describe, afterEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { createReadStream, existsSync, rmSync } from "node:fs";
import { cleanup } from "../../src/csv-clean/index.js";
import { ZodError } from "zod";

describe("csvClean", () => {
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
      cleanup([file], {
        definition: "./nonexistent.js",
        output: outputDir,
        concurrency: "1",
      }),
      /file doesn't exist/,
    );
  });

  test("throws error when input file doesn't exist", async () => {
    const definition = join(import.meta.dirname, "./fixtures/definition.js");
    await assert.rejects(
      cleanup(["./nonexistent.csv"], {
        definition,
        output: outputDir,
        concurrency: "1",
      }),
      /no such file or directory/,
    );
  });

  test("throws error when definition schema is invalid", async () => {
    const file = join(import.meta.dirname, "./fixtures/sample.csv");
    const definition = join(
      import.meta.dirname,
      "./fixtures/definition_invalid.js",
    );
    await assert.rejects(
      cleanup([file], { definition, output: outputDir, concurrency: "1" }),
      ZodError,
    );
  });

  test("processes multiple files", async () => {
    const file1 = join(import.meta.dirname, "./fixtures/sample.csv");
    const file2 = join(import.meta.dirname, "./fixtures/sample_2.csv");
    const out1 = join(import.meta.dirname, "./fixtures/output/sample.csv");
    const out2 = join(import.meta.dirname, "./fixtures/output/sample_2.csv");
    const definition = join(import.meta.dirname, "./fixtures/definition.js");

    await cleanup([file1, file2], {
      definition,
      output: outputDir,
      concurrency: "2",
    });
    assert(existsSync(out1));
    assert(existsSync(out2));
  });

  test("test the cleanup operation from start to end", async () => {
    // arrange
    const definition = join(import.meta.dirname, "./fixtures/definition.js");

    // act
    await cleanup([join(import.meta.dirname, "./fixtures/sample.csv")], {
      output: outputDir,
      definition,
      concurrency: "5",
    });

    // assert
    const outputFile = join(
      import.meta.dirname,
      "./fixtures/output/sample.csv",
    );
    assert(existsSync(outputFile));

    const rows = await new Promise((resolve, reject) => {
      const rows = [];
      createReadStream(outputFile)
        .pipe(parse({ headers: ["date", "description", "amount"] }))
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", reject);
    });

    // Assert
    assert.deepStrictEqual(rows, [
      { date: "01.01", description: "Rent to XYZ details", amount: "-900,70" },
      {
        date: "04.01",
        description: "Insurance Other details",
        amount: "-50,00",
      },
    ]);
  });
});
