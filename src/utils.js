import { existsSync, mkdirSync } from "node:fs";

export function mkdirSyncIfNotExists(dir) {
  if (!existsSync(dir)) {
    console.log("Creating directory: ", dir);
    mkdirSync(dir);
  }
}

export function runTasks(tasks, maxConcurrency) {
  return new Promise((resolve, reject) => {
    let running = 0;
    let failedError;

    function execute() {
      const hasFailed = typeof failedError !== "undefined";

      if (tasks.length === 0 && running === 0) {
        if (hasFailed) {
          return reject(failedError);
        }
        return resolve();
      }

      // don't add new tasks
      if (hasFailed) {
        return;
      }

      while (tasks.length > 0 && running < maxConcurrency) {
        const task = tasks.shift();
        running++;
        task()
          .then(() => {
            running--;
          })
          .catch((err) => {
            if (!hasFailed) {
              failedError = err;
            }
            running--;
          })
          .then(execute);
      }
    }

    execute();
  });
}
