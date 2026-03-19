import { createReadStream } from "node:fs";
import { pipeline, Transform } from "node:stream";
import path from "node:path";
import csv from "fast-csv";

function reverseMap(categories) {
  const reverseMap = new Map();
  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      reverseMap.set(keyword, cat.label);
    }
  }

  return reverseMap;
}

const totalDateRange = (field) => {
  let dateRange = {
    oldest: null,
    newest: null,
  };

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk[field] === undefined) {
        return callback(new Error(`Missing ${field} property on object`));
      }

      const date = parsePartialDate(chunk.date, 2016);
      if (dateRange.oldest === null) {
        dateRange.oldest = date;
        dateRange.newest = date;
      }
      if (date < dateRange.oldest) {
        dateRange.oldest = date;
      } else if (date > dateRange.newest) {
        dateRange.newest = date;
      }

      this.push(chunk);
      callback();
    },
    flush(cb) {
      this.push({
        description: "date_range",
        amount:
          formatDate(dateRange.oldest) + " - " + formatDate(dateRange.newest),
      });
      cb();
    },
  });
};

// group by category
// select sum(amount) from x group by "field"
export const sumGroupByCategories = ({
  groupByField,
  sumField,
  categories,
  defaultCategory,
  searchMap,
  parseNumFn,
}) => {
  const map = new Map();
  for (const key of categories) {
    map.set(key, 0);
  }

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk[groupByField] === undefined || chunk[sumField] === undefined) {
        return callback(
          new Error(
            `Missing ${groupByField} and/or ${sumField} property on object`,
          ),
        );
      }

      // sum the amount
      const category =
        findMatchingCat(searchMap, chunk[groupByField]) ?? defaultCategory;
      const sum = map.get(category);

      const value = parseNumFn(chunk[sumField]);
      map.set(category, sum + value);

      callback();
    },
    flush(cb) {
      for (const [k, v] of map) {
        this.push({
          category: k,
          value: v.toFixed(2),
        });
      }
      this.push("\n");
      cb();
    },
  });
};

function findMatchingCat(searchMap, data) {
  for (const [k, v] of searchMap) {
    if (data.toLowerCase().includes(k.toLowerCase())) {
      return v;
    }
  }
}

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

const categories = [
  { label: "Rent", keywords: ["Miete", "Rent"] },
  { label: "Salary", keywords: ["Gehalt", "Salary"] },
  { label: "Insurance", keywords: ["Versicherung"] },
  { label: "Travel", keywords: ["Flight"] },
  { label: "Expenses", keywords: [] },
];

function groupByCategories({ categories, groupByField, sumField, parseNumFn }) {
  return sumGroupByCategories({
    groupByField,
    sumField,
    parseNumFn,
    categories: categories.map((c) => c.label),
    defaultCategory:
      categories.filter((c) => c.keywords.length === 0)[0]?.label ?? "N/A",
    searchMap: reverseMap(categories),
  });
}

const aggregatePipeline = () => {
  const dateTransform = totalDateRange("date");
  const groupByTransform = groupByCategories({
    categories,
    groupByField: "description",
    sumField: "amount",
    parseNumFn: parseEUNum,
  });

  // TODO: fix by fork -> merge streams
  return pipeline(
    createReadStream(
      path.join(import.meta.dirname, "../../../data/example.csv"),
    ),
    csv.parse({ headers: ["date", "description", "amount"] }),
    dateTransform,
    groupByTransform,
    csv.format({ headers: ["category", "value"], writeHeaders: false }),
    process.stdout,
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Finished");
    },
  );
};

aggregatePipeline();
