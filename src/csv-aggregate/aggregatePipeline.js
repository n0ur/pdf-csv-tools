import * as csv from "fast-csv";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { operationsMap } from "./operations/index.js";
import { EOL } from "node:os";

export async function aggregatePipeline(config, inputFile, outputFile) {
  const { format, operations } = config;

  const writeStream = createWriteStream(outputFile);

  let openChannels = operations.length;
  for await (const operation of operations) {
    const transform = operationToTransform({ ...operation, format });
    await new Promise((resolve, reject) => {
      const formatStream = csv
        .format({
          headers: operation.args.format.headers,
          writeHeaders: false,
          quoteColumns: true,
        })
        .on("data", (data) => {
          writeStream.write(data);
        })
        .on("finish", () => {
          writeStream.write(EOL);
          if (--openChannels === 0) {
            writeStream.end();
          }
          resolve();
        });

      pipeline(
        createReadStream(inputFile),
        csv.parse({ headers: operation.parse.headers }),
        transform,
        formatStream,
        (err) => {
          if (err) {
            reject(err);
          }
        },
      );
    });
  }
}

function operationToTransform(op) {
  if (operationsMap[op.name] === undefined) {
    throw new Error(
      `Failed to create operation from config: Operation not found ${op.name}`,
    );
  }
  return operationsMap[op.name](op.args);
}
