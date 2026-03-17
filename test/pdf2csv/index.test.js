import { parse } from "@fast-csv/parse";
import { test, describe, afterEach } from "node:test";
import assert from "node:assert";
import { join } from "node:path";
import { createReadStream, existsSync, rmSync } from "node:fs";
import { convertFiles } from "../../src/pdf2csv/index.js";
import { spawnSync } from "node:child_process";

const hasTabula = spawnSync("tabula-java", ["--version"]).error === undefined;

describe("pdf2csv", () => {
  const outputDir = join(import.meta.dirname, "./fixtures/output");

  afterEach(() => {
    if (existsSync(outputDir)) {
      rmSync(outputDir, { force: true, recursive: true });
    }
  });

  test(
    "throws error when input file doesn't exist",
    { skip: !hasTabula },
    async () => {
      await assert.rejects(
        convertFiles(["./nonexistent.pdf"], {
          output: outputDir,
          concurrency: "1",
        }),
        /File does not exist/,
      );
    },
  );

  test("processes multiple files", { skip: !hasTabula }, async () => {
    const file1 = join(import.meta.dirname, "./fixtures/sample.pdf");
    const file2 = join(import.meta.dirname, "./fixtures/sample_2.pdf");
    const out1 = join(import.meta.dirname, "./fixtures/output/sample.csv");
    const out2 = join(import.meta.dirname, "./fixtures/output/sample_2.csv");

    await convertFiles([file1, file2], { output: outputDir, concurrency: "2" });
    assert(existsSync(out1));
    assert(existsSync(out2));
  });

  test(
    "test the convert operation from start to end",
    { skip: !hasTabula },
    async () => {
      // act
      await convertFiles([join(import.meta.dirname, "./fixtures/sample.pdf")], {
        output: outputDir,
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
          .pipe(parse({ headers: ["description", undefined, "amount"] }))
          .on("data", (row) => rows.push(row))
          .on("end", () => resolve(rows))
          .on("error", reject);
      });

      // Assert
      assert.deepStrictEqual(rows, [
        { description: "", amount: "Sheet1" },
        { description: "Bank Statement at Bank XYZ", amount: "" },
        { description: "01.01.2026 Rent to XYZ", amount: "-900,70" },
        { description: "Page 2/3", amount: "" },
        { description: "04.01.2026 Insurance", amount: "-50,00" },
        { description: "28.01.2026 Salary", amount: "+100,00" },
        { description: "CUSTOMER INFO XYZ", amount: "" },
        { description: "NAME, ADDRESS, PHONEXYZ", amount: "" },
        { description: "", amount: "Page 1" },
      ]);
    },
  );
});
