import { test, describe } from "node:test";
import assert from "node:assert";
import {
  formatDate,
  formatToFixed,
  formatDateRange,
} from "../../src/csv-aggregate/formatters.js";

describe("formatDate", () => {
  const successCases = [
    { input: new Date(2026, 0, 1), expected: "01.01.26" },
    { input: new Date(2026, 11, 31), expected: "31.12.26" },
    { input: new Date(1999, 0, 1), expected: "01.01.99" },
    { input: new Date(2026, 5, 9), expected: "09.06.26" },
  ];
  const failureCases = [new Date("abc"), null, undefined, "not a date"];
  successCases.forEach(({ input, expected }) => {
    test(`formats ${input.toISOString()} to "${expected}"`, () => {
      assert.strictEqual(formatDate(input), expected);
    });
  });
  failureCases.forEach((input) => {
    test(`throws on ${input}`, () => {
      assert.throws(() => formatDate(input), "Could not format date");
    });
  });
});
describe("formatToFixed", () => {
  const successCases = [
    { input: 100, expected: "100.00" },
    { input: 0, expected: "0.00" },
    { input: -50.5, expected: "-50.50" },
    { input: 0.1 + 0.2, expected: "0.30" }, // floating point
    { input: 900.7, expected: "900.70" },
  ];
  const failureCases = ["100", null, undefined, NaN];
  successCases.forEach(({ input, expected }) => {
    test(`formats ${input} to "${expected}"`, () => {
      assert.strictEqual(formatToFixed(input), expected);
    });
  });
  failureCases.forEach((input) => {
    test(`throws on ${input}`, () => {
      assert.throws(() => formatToFixed(input), "Could not format number");
    });
  });
});
describe("formatDateRange", () => {
  const successCases = [
    {
      input: { oldest: new Date(2026, 0, 1), newest: new Date(2026, 0, 31) },
      expected: "01.01.26 - 31.01.26",
    },
    {
      input: { oldest: new Date(2026, 1, 28), newest: new Date(2026, 2, 15) },
      expected: "28.02.26 - 15.03.26",
    },
    {
      input: { oldest: new Date(2026, 5, 9), newest: new Date(2026, 5, 9) },
      expected: "09.06.26 - 09.06.26",
    },
  ];
  const failureCases = [
    { oldest: null, newest: null },
    { oldest: "abc", newest: "xyz" },
  ];
  successCases.forEach(({ input, expected }) => {
    test(`formats range to "${expected}"`, () => {
      assert.strictEqual(formatDateRange(input), expected);
    });
  });
  failureCases.forEach((input) => {
    test(`throws on ${input.oldest}`, () => {
      assert.throws(() => formatDateRange(input));
    });
  });
});
