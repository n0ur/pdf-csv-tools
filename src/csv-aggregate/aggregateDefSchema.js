import { z } from "zod";
import { parsersMap } from "./parsers.js";
import { formattersMap } from "./formatters.js";

const parserSchema = z.enum(Object.keys(parsersMap));

const formatterSchema = z.enum(Object.keys(formattersMap));

const headersSchema = z.object({
  headers: z.array(z.union([z.string(), z.undefined()])),
});

const bucketsSchema = z.array(
  z.object({
    label: z.string(),
    keywords: z.array(z.string()),
  }),
);

const operationsSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("sum_group_by_buckets"),
    parse: headersSchema,
    args: z.object({
      field: z.string(),
      parseFn: parserSchema,
      formatFn: formatterSchema,
      groupBy: z.object({
        field: z.string(),
        buckets: bucketsSchema,
      }),
    }),
  }),
  z.object({
    name: z.literal("date_range"),
    parse: headersSchema,
    args: z.object({
      field: z.string(),
      parseFn: parserSchema,
      formatFn: formatterSchema,
    }),
  }),
]);

export const aggregateDefSchema = z.object({
  format: headersSchema,
  operations: z.array(operationsSchema),
});
