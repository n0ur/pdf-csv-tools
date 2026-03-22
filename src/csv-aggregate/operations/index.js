import { sumGroupByBuckets } from "./sumGroupByBuckets.js";
import { dateRange } from "./dateRange.js";

export const operationsMap = {
  sum_group_by_buckets: sumGroupByBuckets,
  date_range: dateRange,
};

export { sumGroupByBuckets, dateRange };
