import fs from "fs";
import { logger } from "../logger/logging-utils";
import JSZip from "jszip";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


export async function uploadTraceToS3(tracePath: string, routeId: string, timestamp: string) {
  if (!process.env.AWS_TRACES_BUCKET_NAME) {
    logger.info("AWS_TRACES_BUCKET_NAME is not set, skipping upload to S3");
    return;
  }

  if (!process.env.AWS_REGION) {
    logger.info("AWS_REGION is not set, skipping upload to S3");
    return;
  }

  logger.info("Uploading trace files to S3", { tracePath });

  // Read the zip
  const data = fs.readFileSync(tracePath);
  const zip = await JSZip.loadAsync(data);
  const files = Object.keys(zip.files);

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
  });

  async function upload(key, fileContent) {
    const uploadParams = {
      Bucket: process.env.AWS_TRACES_BUCKET_NAME,
      Key: key,
      Body: fileContent,
    };
    await s3.send(new PutObjectCommand(uploadParams));
  }

  // Upload each trace file to S3 under a common directory
  let i = 0;
  for (const file of files) {
    if (i % 20 === 0) {
      logger.info(`Progress: ${Math.round(i / files.length * 100)}%...`);
    }
    i++;

    if (!zip.files[file].dir) { // Skip directories
      const key = `${routeId}/${timestamp}/${file}`;
      const fileContent = await zip.files[file].async("nodebuffer");
      await upload(key, fileContent);
    }
  }

  logger.info("Uploading trace zip file");
  const key = `${routeId}/${timestamp}/trace.zip`;
  await upload(key, data);

  logger.info("Trace files uploaded to S3");
}
