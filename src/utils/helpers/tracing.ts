import path from "path";
import fs from "fs";
import { logger } from "../logger/logging-utils";
import JSZip from "jszip";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


export async function processTraceFile(tracePath: string, routeId: string, timestamp: string) {
  logger.info("Processing trace file", { tracePath });

  // Unzip the trace file
  const data = fs.readFileSync(tracePath);
  const zip = await JSZip.loadAsync(data);
  const files = Object.keys(zip.files);

  // Upload the trace file to S3
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
  });

  // Upload each trace file to S3 under a common directory
  for (const file of files) {
    if (!zip.files[file].dir) { // Skip directories - we assume the only file is the trace file
      const fileContent = await zip.files[file].async("nodebuffer");
      const uploadParams = {
        Bucket: process.env.AWS_TRACES_BUCKET_NAME,
        Key: `${routeId}/${timestamp}/${file}`,
        Body: fileContent,
      };
      await s3.send(new PutObjectCommand(uploadParams));
    }
  }

  // Remove the zip file after extraction
  fs.unlinkSync(tracePath);

  logger.info("Trace file processed");
}