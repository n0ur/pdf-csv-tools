import { Transform } from "node:stream";

export function dateRange({ field, parseFn, formatFn, format }) {
  let range = {
    oldest: null,
    newest: null,
  };

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk[field] === undefined) {
        return callback(new Error(`Missing ${field} property on object`));
      }

      const date = parseFn(chunk[field]);
      if (range.oldest === null) {
        range.oldest = date;
        range.newest = date;
      }
      if (date < range.oldest) {
        range.oldest = date;
      } else if (date > range.newest) {
        range.newest = date;
      }

      callback();
    },
    flush(cb) {
      this.push({
        [format.headers[0]]: field,
        [format.headers[1]]: formatFn(range),
      });
      cb();
    },
  });
}
