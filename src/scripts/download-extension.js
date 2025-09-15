import { fetchExtensionZip } from 'chrome-extension-fetch';
import path from 'path';
import fs from 'fs';
import { Extract } from 'unzipper';
import { logger } from '../utils/logger/logging-utils';

// Get extension name and ID from command line arguments
const extensionName = process.argv[2];
const extensionId = process.argv[3];

if (!extensionId || !extensionName) {
  logger.error('❌ Please provide both extension name and ID as arguments');
  logger.error('Usage: node download-extension.js <extension-name> <extension-id>');
  process.exit(1);
}

// Construct the Chrome Web Store URL from the extension ID
const webstoreUrl = `https://chrome.google.com/webstore/detail/${extensionName}/${extensionId}`;

// Set output directory relative to project root (i.e. where `npm run` would be called)
const outputDir = path.join(process.cwd(), 'extensions', extensionName);

async function extractZip(zipPath, extractDir) {
  logger.info('📦 Extracting ZIP file...');

  // Create extraction directory
  fs.mkdirSync(extractDir, { recursive: true });

  // Extract ZIP file
  await new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(Extract({ path: extractDir }))
      .on('close', () => {
        logger.info('✅ ZIP extraction completed');
        resolve();
      })
      .on('error', (err) => {
        logger.error('❌ ZIP extraction failed:', err.message);
        reject(err);
      });
  });
}

async function downloadExtension() {
  try {
    logger.info(`🔄 Downloading extension: ${extensionName} (ID: ${extensionId})`);
    logger.info(`📁 Output directory: ${outputDir}`);
    logger.info(`🔗 Web Store URL: ${webstoreUrl}`);

    const { crxPath, zipPath } = await fetchExtensionZip(webstoreUrl, {
      // one could provide a custom chrome version here
      chromeVersion: '133.0',
      outputDir: outputDir,
    });

    logger.info('📦 Files downloaded');
    logger.info(`📦 CRX: ${crxPath}`);
    logger.info(`🗜️ ZIP: ${zipPath}`);

    // Extract the ZIP file
    await extractZip(zipPath, outputDir);

    // Clean up the CRX and ZIP files
    logger.info('🧹 Cleaning up download files...');
    if (fs.existsSync(crxPath)) {
      fs.unlinkSync(crxPath);
      logger.info('✅ CRX file removed');
    }
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      logger.info('✅ ZIP file removed');
    }

    logger.info(`✅ Extension downloaded and extracted successfully!`);
    logger.info(`📁 Extension extracted to: ${outputDir} | 📝 Name: ${extensionName} | 🆔 ID: ${extensionId}`);
  } catch (error) {
    logger.error('❌ Error downloading extension:', error.message);
    logger.error(`💡 Tip: Check if the extension ID '${extensionId}' is correct and publicly available`);
    process.exit(1);
  }
}

downloadExtension();
