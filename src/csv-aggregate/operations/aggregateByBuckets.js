import { Transform } from "node:stream";

const defaultLabel = "N/A";

export function aggregateByBuckets(operation) {
  const buckets = operation.groupBy.buckets;

  const defaultBucket =
    buckets.filter((c) => c.keywords.length === 0)[0]?.label ?? defaultLabel;
  const searchMap = reverseMap(buckets);

  const groupByMatchFn = (chunk) => {
    for (const [k, v] of searchMap) {
      if (chunk.toLowerCase().includes(k.toLowerCase())) {
        return v;
      }
    }
    return defaultBucket;
  };

  return sumGroupByBucketsTransform({
    ...operation,
    groupByMatchFn,
  });
}

const sumGroupByBucketsTransform = ({
  field,
  parseFn,
  formatFn,
  groupBy,
  format,
  groupByMatchFn,
}) => {
  const bucketMap = new Map();
  for (const bucket of groupBy.buckets) {
    bucketMap.set(bucket.label, 0);
  }

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk[groupBy.field] === undefined || chunk[field] === undefined) {
        return callback(
          new Error(
            `Missing ${groupBy.field} and/or ${field} property on object`,
          ),
        );
      }

      const bucket = groupByMatchFn(chunk[groupBy.field]);
      const sum = bucketMap.get(bucket);
      if (sum === undefined) {
        return callback(
          new Error(`Missing bucket for ${chunk[groupBy.field]}`),
        );
      }
      const value = parseFn(chunk[field]);
      bucketMap.set(bucket, sum + value);

      callback();
    },
    flush(cb) {
      for (const [k, v] of bucketMap) {
        this.push({
          [format.headers[0]]: k,
          [format.headers[1]]: formatFn(v),
        });
      }
      cb();
    },
  });
};

function reverseMap(categories) {
  const reverseMap = new Map();
  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      reverseMap.set(keyword, cat.label);
    }
  }

  return reverseMap;
}
