import { aggregateByBuckets } from "./aggregateByBuckets.js";
import { aggregateDateRange } from "./aggregateDateRange.js";

export const operationsMap = {
  aggregate_by_buckets: aggregateByBuckets,
  aggregate_date_range: aggregateDateRange,
};

export { aggregateByBuckets, aggregateDateRange };
