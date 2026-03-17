import path from "node:path";
import { spawn } from "node:child_process";
import { mkdirSyncIfNotExists, runTasks } from "../utils.js";

export async function pdf2csv(...args) {
  try {
    await convertFiles(...args);
  } catch (e) {
    console.error(e);
  }
}

export async function convertFiles(files, { output, concurrency }) {
  mkdirSyncIfNotExists(path.resolve(output));

  const tasks = files.map((file) => {
    return () => {
      const csvFilename = path.basename(file, ".pdf") + ".csv";
      return convertFileToCsv(file, path.join(output, csvFilename));
    };
  });
  await runTasks(tasks, parseInt(concurrency, 10));
}

async function convertFileToCsv(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    console.log("Processing", inputFile);

    const tabula = spawn("tabula-java", [
      inputFile,
      "-page",
      "all",
      "-t",
      "-o",
      outputFile,
    ]);
    tabula.stdout.on("data", (data) => {
      console.log(data.toString());
    });
    tabula.stderr.on("data", (data) => {
      reject(data.toString());
    });
    tabula.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exited with error code: ${code}`));
      }
    });
  });
}
