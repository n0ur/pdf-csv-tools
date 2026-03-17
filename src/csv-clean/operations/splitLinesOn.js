import { Transform } from "node:stream";

export const splitLinesOn = ({ match, splitField, newField }) => {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk[splitField] === undefined) {
        return callback(new Error(`Missing ${splitField} property on object`));
      }
      const value = chunk[splitField].match(match)?.[0] ?? "";
      this.push({
        ...chunk,
        [splitField]: chunk[splitField].replace(value, "").trim(),
        [newField]: value,
      });
      callback();
    },
  });
};
