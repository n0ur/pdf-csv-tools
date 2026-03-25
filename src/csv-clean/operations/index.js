import { mergeLines } from "./mergeLines.js";
import { skipLinesFrom } from "./skipLinesFrom.js";
import { skipLinesIncluding } from "./skipLinesIncluding.js";
import { splitLinesOn } from "./splitLinesOn.js";
import { appendToField } from "./appendToField.js";

export const operationsMap = {
  skip_lines_from: skipLinesFrom,
  skip_lines_including: skipLinesIncluding,
  merge_lines: mergeLines,
  split_lines_on: splitLinesOn,
  append_to_field: appendToField,
};

export {
  mergeLines,
  skipLinesFrom,
  skipLinesIncluding,
  splitLinesOn,
  appendToField,
};
