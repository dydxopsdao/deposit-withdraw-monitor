import path from "path";
import fs from "fs";
import { logger } from "../logger/logging-utils";
import extract from 'extract-zip';


export async function processTraceFile(tracePath: string) {
  logger.info("Processing trace file", { tracePath });

  const data = fs.readFileSync(tracePath);
  await extract(tracePath, { dir: path.dirname(tracePath) });

  // Remove the zip file after extraction
  fs.unlinkSync(tracePath);

  logger.info("Trace file processed");
}