import { Transform } from "node:stream";

export const skipLinesFrom = (filterValues) => {
  let matchFound = false;
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const data = Object.values(chunk).join(" ");
      if (matchFound) {
        return callback();
      }
      if (filterValues.some((f) => data.includes(f))) {
        matchFound = true;
        return callback();
      }
      this.push(chunk);
      callback();
    },
  });
};
