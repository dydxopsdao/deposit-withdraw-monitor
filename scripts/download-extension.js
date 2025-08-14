import { fetchExtensionZip } from 'chrome-extension-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Extract } from 'unzipper';

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get extension name and ID from command line arguments
const extensionName = process.argv[2];
const extensionId = process.argv[3];

if (!extensionId || !extensionName) {
  console.error('❌ Please provide both extension name and ID as arguments');
  console.error('Usage: node download-extension.js <extension-name> <extension-id>');
  process.exit(1);
}

// Construct the Chrome Web Store URL from the extension ID
const webstoreUrl = `https://chrome.google.com/webstore/detail/${extensionName}/${extensionId}`;

// Set output directory as absolute path
const outputDir = path.join(__dirname, '..', 'extensions', extensionName);

async function extractZip(zipPath, extractDir) {
  console.log('📦 Extracting ZIP file...');
  
  // Create extraction directory
  fs.mkdirSync(extractDir, { recursive: true });
  
  // Extract ZIP file
  await new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(Extract({ path: extractDir }))
      .on('close', () => {
        console.log('✅ ZIP extraction completed');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ ZIP extraction failed:', err.message);
        reject(err);
      });
  });
}

async function downloadExtension() {
  try {
    console.log(`🔄 Downloading extension: ${extensionName} (ID: ${extensionId})`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🔗 Web Store URL: ${webstoreUrl}`);
    
    const { crxPath, zipPath } = await fetchExtensionZip(webstoreUrl, {
      // one could provide a custom chrome version here
      // chromeVersion: '133.0',
      outputDir: outputDir
    });
    
    console.log('📦 Files downloaded');
    console.log(`📦 CRX: ${crxPath}`);
    console.log(`🗜️ ZIP: ${zipPath}`);
    
    // Extract the ZIP file
    await extractZip(zipPath, outputDir);
    
    // Clean up the CRX and ZIP files
    console.log('🧹 Cleaning up download files...');
    if (fs.existsSync(crxPath)) {
      fs.unlinkSync(crxPath);
      console.log('✅ CRX file removed');
    }
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      console.log('✅ ZIP file removed');
    }
    
    console.log(`✅ Extension downloaded and extracted successfully!`);
    console.log(`📁 Extension extracted to: ${outputDir} | 📝 Name: ${extensionName} | 🆔 ID: ${extensionId}`);
    
  } catch (error) {
    console.error('❌ Error downloading extension:', error.message);
    console.error(`💡 Tip: Check if the extension ID '${extensionId}' is correct and publicly available`);
    process.exit(1);
  }
}

downloadExtension();
