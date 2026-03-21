import { createReadStream, createWriteStream } from "node:fs";
import { pipeline, Transform } from "node:stream";
import path from "node:path";
import csv from "fast-csv";
import { EOL } from "node:os";

function reverseMap(categories) {
  const reverseMap = new Map();
  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      reverseMap.set(keyword, cat.label);
    }
  }

  return reverseMap;
}

// 3.233,00-
function parseEUNum(str) {
  const formatted = str.trim().replace(/[.]/g, "").replace(",", ".");
  const isNegative = formatted.endsWith("-") || formatted.startsWith("-");
  const parsed = parseFloat(formatted) * (isNegative ? -1 : 1);
  if (Number.isNaN(parsed)) {
    throw new Error(`Cound not parse EU number: ${str}`);
  }
  return parsed;
}

// date: DD.MM
function parsePartialDate(str, year) {
  const [d, m] = str.split(".");
  const date = new Date(year, +m - 1, +d);
  return date;
}

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${d}.${m}.${y}`;
}

export const sumGroupByBucketsTransform = ({
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

function makeSumGroupByBuckets(operation) {
  const buckets = operation.groupBy.buckets;

  const defaultBucket =
    buckets.filter((c) => c.keywords.length === 0)[0]?.label ?? "N/A";
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

const dateRangeTransform = ({ field, parseFn, formatFn, format }) => {
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
};

const aggregatePipeline = async (operations) => {
  const writeStream = createWriteStream("./write.csv");

  let openChannels = operations.length;
  for await (const operation of operations) {
    const transform = operationToTransform(operation);
    await new Promise((resolve, reject) => {
      const formatStream = csv
        .format({
          headers: operation.args.format.headers,
          writeHeaders: false,
          quoteColumns: true,
        })
        .on("data", (data) => {
          writeStream.write(data);
        })
        .on("finish", () => {
          writeStream.write(EOL);
          if (--openChannels === 0) {
            writeStream.end();
          }
          resolve();
        });

      pipeline(
        createReadStream(
          path.join(import.meta.dirname, "../../../data/example.csv"),
        ),
        csv.parse({ headers: operation.parse.headers }),
        transform,
        formatStream,
        (err) => {
          if (err) {
            reject(err);
          }
        },
      );
    });
  }
};

const operationsMap = {
  sum_group_by_buckets: makeSumGroupByBuckets,
  date_range: dateRangeTransform,
};

function operationToTransform(op) {
  if (operationsMap[op.name] === undefined) {
    throw new Error(
      `Failed to create operation from config: Operation not found ${op.name}`,
    );
  }
  return operationsMap[op.name](op.args);
}

const categories = [
  { label: "Rent", keywords: ["Miete", "Rent"] },
  { label: "Salary", keywords: ["Gehalt", "Salary"] },
  { label: "Insurance", keywords: ["Versicherung"] },
  { label: "Travel", keywords: ["Flight"] },
  { label: "Expenses", keywords: [] },
];

const operations = [
  // select sum(amount) from x group by description
  {
    name: "sum_group_by_buckets",
    parse: {
      headers: [undefined, "description", "amount"],
    },
    args: {
      field: "amount",
      parseFn: parseEUNum,
      formatFn: (v) => v.toFixed(2),
      groupBy: { field: "description", buckets: categories },
      // TODO: move this above
      format: {
        headers: ["label", "value"],
      },
    },
  },
  // select date_range(date) from x
  {
    name: "date_range",
    parse: {
      headers: ["date", undefined, undefined],
    },
    args: {
      field: "date",
      parseFn: (chunk) => parsePartialDate(chunk, 2016),
      formatFn: (range) => {
        return formatDate(range.oldest) + " - " + formatDate(range.newest);
      },
      // TODO: move this above
      format: {
        headers: ["label", "value"],
      },
    },
  },
];

aggregatePipeline(operations);
