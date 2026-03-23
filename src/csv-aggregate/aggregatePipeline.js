import * as csv from "fast-csv";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { operationsMap } from "./operations/index.js";
import { EOL } from "node:os";
import { parsersMap } from "./parsers.js";
import { formattersMap } from "./formatters.js";

export async function aggregatePipeline(config, inputFile, outputFile) {
  const { format, operations } = config;

  const writeStream = createWriteStream(outputFile);

  let openChannels = operations.length;
  for await (const operation of operations) {
    await new Promise((resolve, reject) => {
      const transform = operationToTransform({ ...operation, format });
      const formatStream = csv
        .format({
          headers: format.headers,
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
  const args = {
    ...op.args,
    format: { ...op.format },
  };
  if (operationsMap[op.name] === undefined) {
    throw new Error(
      `Failed to create operation from config: Operation not found ${op.name}`,
    );
  }
  for (const argument in op.args) {
    if (argument === "parseFn") {
      args[argument] = parsersMap[op.args[argument]];
    }
    if (argument === "formatFn") {
      args[argument] = formattersMap[op.args[argument]];
    }
  }
  return operationsMap[op.name](args);
}
