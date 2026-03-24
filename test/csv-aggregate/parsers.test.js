import { test, describe } from "node:test";
import assert from "node:assert";
import { parseEUNum, parseDate } from "./../../src/csv-aggregate/parsers.js";

describe("parseEUNum", () => {
  const successCases = [
    { input: "900,70", expected: 900.7 },
    { input: "900,70-", expected: -900.7 },
    { input: "3.233,00", expected: 3233.0 },
    { input: "3.233,00-", expected: -3233.0 },
    { input: "0,00", expected: 0.0 },
    { input: " 900,70 ", expected: 900.7 },
    { input: "100", expected: 100 },
  ];
  const failureCases = ["", "abc", "NaN", "--100", null, undefined];
  successCases.forEach(({ input, expected }) => {
    test(`parses "${input}" to ${expected}`, () => {
      assert.strictEqual(parseEUNum(input), expected);
    });
  });
  failureCases.forEach((input) => {
    test(`throws on invalid input: ${input}`, () => {
      assert.throws(() => parseEUNum(input), "Could not parse EU number");
    });
  });
});

describe("parseDate", () => {
  const successCases = [
    { input: "01.01.2026", expected: new Date(2026, 0, 1) },
    { input: "31.12.1999", expected: new Date(1999, 11, 31) },
    { input: "28.02.2026", expected: new Date(2026, 1, 28) },
  ];
  const failureCases = ["", "abc", "01-01-2026", "2024-01-01", null, undefined];
  successCases.forEach(({ input, expected }) => {
    test(`parses "${input}"`, () => {
      assert.strictEqual(
        parseDate(input).toISOString(),
        expected.toISOString(),
      );
    });
  });
  failureCases.forEach((input) => {
    test(`throws on invalid input: ${input}`, () => {
      assert.throws(() => parseDate(input), "Could not parse date");
    });
  });
});
