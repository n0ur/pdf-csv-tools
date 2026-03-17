import path from "node:path";
import { mkdirSyncIfNotExists, runTasks } from "../utils.js";
import { cleanupPipeline } from "./cleanupPipeline.js";
import { existsSync } from "node:fs";
import { cleanupDefSchema } from "./cleanupDefSchema.js";

export async function csvClean(...args) {
  try {
    await cleanup(...args);
    console.log("Finished all files");
  } catch (e) {
    console.error(e);
  }
}

export async function cleanup(files, { output, definition, concurrency }) {
  const definitionFile = path.resolve(definition);
  if (!existsSync(definitionFile)) {
    throw new Error(`Cleanup definition file doesn't exist: ${definition}`);
  }
  const config = (await import(definitionFile))?.config;
  const parsedConfig = cleanupDefSchema.parse(config);

  const outputDir = path.resolve(output);
  mkdirSyncIfNotExists(outputDir);

  const tasks = files.map((file) => {
    return () => {
      const filePath = path.resolve(file);
      const outputFile = path.join(outputDir, path.basename(filePath));
      console.log("Processing file", file);
      return cleanupPipeline(parsedConfig, file, outputFile);
    };
  });
  await runTasks(tasks, parseInt(concurrency, 10));
}
