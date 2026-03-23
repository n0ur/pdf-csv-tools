import * as csv from "fast-csv";
import path from "node:path";
import { mkdirSyncIfNotExists, runTasks } from "../utils.js";
import { aggregatePipeline } from "./aggregatePipeline.js";
import { existsSync } from "node:fs";
import { aggregateDefSchema } from "./aggregateDefSchema.js";
import { combinePipeline } from "./combinePipeline.js";

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

  const summaryRows = await combinePipeline({
    parseHeaders: parsedConfig.format.headers,
    outputFiles,
  });
  csv.writeToPath(path.join(outputDir, SUMMARY_FILENAME), summaryRows);
}
