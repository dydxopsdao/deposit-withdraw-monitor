import path from "path";
import fs from "fs";
import { logger } from "../logger/logging-utils";
import JSZip from "jszip";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


export async function processTraceFile(tracePath: string, routeId: string, timestamp: string) {
  // Unzip the trace file
  logger.info("Unzipping trace file", { tracePath });
  const data = fs.readFileSync(tracePath);
  const zip = await JSZip.loadAsync(data);
  const files = Object.keys(zip.files);

  if (!process.env.AWS_TRACES_BUCKET_NAME) {
    logger.info("AWS_TRACES_BUCKET_NAME is not set, skipping upload to S3");
    return;
  }

  if (!process.env.AWS_REGION) {
    logger.info("AWS_REGION is not set, skipping upload to S3");
    return;
  }

  // Upload the trace file to S3
  logger.info("Uploading trace file to S3", { tracePath });

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
  });

  // Append the zip file itself to the list of files, so that we upload it as well
  files.push("trace.zip");

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

  logger.info("Trace file processed");
}