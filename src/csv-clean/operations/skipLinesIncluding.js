import { Transform } from "node:stream";

export const skipLinesIncluding = (filterValues) => {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const data = Object.values(chunk).join(" ");
      if (filterValues.some((f) => data.includes(f))) {
        return callback();
      }
      this.push(chunk);
      callback();
    },
  });
};
