import { Transform } from "node:stream";

export const mergeLines = ({ mergeField, emptyField }) => {
  let line = null;
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk[mergeField] === undefined || chunk[emptyField] === undefined) {
        return callback(
          new Error(
            `Missing ${mergeField} and/or ${emptyField} property on object`,
          ),
        );
      }
      if (chunk[emptyField].trim()) {
        if (line !== null) {
          this.push(line);
        }
        line = chunk;
      } else {
        if (line !== null) {
          line[mergeField] += ` ${chunk[mergeField]}`;
        }
      }
      callback();
    },
    flush(callback) {
      if (line !== null) {
        this.push(line);
      }
      callback();
    },
  });
};
