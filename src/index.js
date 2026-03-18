#!/usr/bin/env node
import { Command } from "commander";
import { pdf2csv } from "./pdf2csv/index.js";
import { csvClean } from "./csv-clean/index.js";
import { csvAggregate } from "./csv-aggregate/index.js";

const DEFAULT_CONCURRENCY = "5";

const program = new Command();

program
  .command("pdf2csv")
  .description("Convert PDF files to CSV")
  .argument("<files...>", "PDF files to convert")
  .requiredOption("-o, --output <dir>", "Output directory")
  .option(
    "-c, --concurrency <n>",
    "# of processes to run concurrently",
    DEFAULT_CONCURRENCY,
  )
  .action(pdf2csv);

program
  .command("csv-clean")
  .description("Clean up CSV files based on definitions")
  .argument("<files...>", "CSV files to clean up")
  .requiredOption("-o, --output <dir>", "Output directory")
  .requiredOption(
    "-d, --definition <file>",
    "cleanup definition file, check the template: config/cleanup_def_template.js",
  )
  .option(
    "-c, --concurrency <n>",
    "# of processes to run concurrently",
    DEFAULT_CONCURRENCY,
  )
  .action(csvClean);

program
  .command("csv-aggregate")
  .description("Aggregate CSV files based on definitions")
  .argument("<files...>", "CSV files to aggregate")
  .requiredOption("-o, --output <dir>", "Output directory")
  .requiredOption(
    "-d, --definition <file>",
    "aggregate definition file, check the template: config/aggregate_def_template.js",
  )
  .option(
    "-c, --concurrency <n>",
    "# of processes to run concurrently",
    DEFAULT_CONCURRENCY,
  )
  .action(csvAggregate);

program.parse();
