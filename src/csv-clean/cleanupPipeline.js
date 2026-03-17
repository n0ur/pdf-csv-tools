import * as csv from "fast-csv";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { compose } from "node:stream";
import { operationsMap } from "./operations/index.js";

export function cleanupPipeline(config, inputFile, outputFile) {
  const { parse, format, operations } = config;
  const ops = generateOperations(operations);
  return pipeline(
    createReadStream(inputFile),
    csv.parse({
      ...parse,
      ignoreEmpty: true,
    }),
    ops,
    csv.format({
      ...format,
      writeHeaders: false,
      quoteColumns: true,
    }),
    createWriteStream(outputFile),
  );
}

function generateOperations(operations) {
  const ops = [];
  for (const op of operations) {
    const { name, args } = op;

    if (operationsMap[name] === undefined) {
      throw new Error(
        `Failed to create operation from config: Operation not found ${name}`,
      );
    }

    ops.push(operationsMap[name].call(undefined, args));
  }
  return compose(...ops);
}
