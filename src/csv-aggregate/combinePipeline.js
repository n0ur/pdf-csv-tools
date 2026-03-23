import * as csv from "fast-csv";
import { createReadStream } from "node:fs";
import { pipeline, Transform } from "node:stream";

export async function combinePipeline({ parseHeaders, outputFiles }) {
  const [label, value] = parseHeaders;
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

  return [...map].map((values) => values.flat());
}
