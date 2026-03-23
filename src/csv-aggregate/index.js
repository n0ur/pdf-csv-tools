import * as csv from "fast-csv";
import path from "node:path";
import { mkdirSyncIfNotExists, runTasks } from "../utils.js";
import { aggregatePipeline } from "./aggregatePipeline.js";
import { createReadStream, existsSync } from "node:fs";
import { aggregateDefSchema } from "./aggregateDefSchema.js";
import { Transform, pipeline } from "node:stream";

const SUMMARY_FILENAME = "summary.csv";

export async function csvAggregate(...args) {
  try {
    await aggregate(...args);
    console.log("Finished all files");
  } catch (e) {
    console.error(e);
  }
}

export async function aggregate(files, { output, definition, concurrency }) {
  const definitionFile = path.resolve(definition);
  if (!existsSync(definitionFile)) {
    throw new Error(`Aggregate definition file doesn't exist: ${definition}`);
  }
  const config = (await import(definitionFile))?.config;
  const parsedConfig = aggregateDefSchema.parse(config);

  const outputDir = path.resolve(output);
  mkdirSyncIfNotExists(outputDir);

  const outputFiles = [];
  const tasks = files.map((file) => {
    return () => {
      const filePath = path.resolve(file);
      const outputFile = path.join(outputDir, path.basename(filePath));
      outputFiles.push(outputFile);
      console.log("Processing file", file);
      return aggregatePipeline(parsedConfig, file, outputFile);
    };
  });
  await runTasks(tasks, parseInt(concurrency, 10));
  await combine({
    outputFiles,
    outputDir,
    parseHeaders: parsedConfig.format.headers,
  });
}

export async function combine({ outputFiles, outputDir, parseHeaders }) {
  const label = parseHeaders[0];
  const value = parseHeaders[1];
  const map = new Map();

  for await (const file of outputFiles) {
    await new Promise((resolve, reject) => {
      const combineStream = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          const item = map.get(chunk[label]);
          if (item) {
            item.push(chunk[value]);
          } else {
            map.set(chunk[label], [chunk[value]]);
          }
          callback();
        },
      });

      pipeline(
        createReadStream(file),
        csv.parse({ headers: parseHeaders }),
        combineStream,
        (err) => {
          if (err) {
            reject(err);
          }
          resolve();
        },
      );
    });
  }

  csv.writeToPath(
    path.join(outputDir, SUMMARY_FILENAME),
    [...map].map((values) => values.flat()),
  );
}
