import { Transform } from "node:stream";

export const appendToField = ({ field, value }) => {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk[field] === undefined) {
        return callback(new Error(`Missing ${field} property on object`));
      }
      this.push({
        ...chunk,
        [field]: `${chunk[field]}${value}`.trim(),
      });
      callback();
    },
  });
};
