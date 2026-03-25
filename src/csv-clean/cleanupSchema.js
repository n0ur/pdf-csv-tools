import { z } from "zod";

const operationsSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("skip_lines_from"), args: z.array(z.string()) }),
  z.object({
    name: z.literal("skip_lines_including"),
    args: z.array(z.string()),
  }),
  z.object({
    name: z.literal("merge_lines"),
    args: z.object({
      mergeField: z.string(),
      emptyField: z.string(),
    }),
  }),
  z.object({
    name: z.literal("split_lines_on"),
    args: z.object({
      match: z
        .string()
        .regex(/[a-z0-9]+/)
        .transform((str) => new RegExp(str)),
      splitField: z.string(),
      newField: z.string(),
    }),
  }),
  z.object({
    name: z.literal("append_to_field"),
    args: z.object({
      field: z.string(),
      value: z.string(),
    }),
  }),
]);

export const cleanupSchema = z.object({
  parse: z.object({
    headers: z.array(z.union([z.string(), z.undefined()])),
  }),
  format: z.object({
    headers: z.array(z.union([z.string(), z.undefined()])),
  }),
  operations: z.array(operationsSchema),
});
