import { fetchExtensionZip } from 'chrome-extension-fetch';
import path from 'path';
import fs from 'fs';
import { Extract } from 'unzipper';


// Get extension name and ID from command line arguments
const extensionName = process.argv[2];
const extensionId = process.argv[3];
const isMetaMask = extensionName?.toLowerCase() === 'metamask';
const METAMASK_VERSION = '13.16.1';

if (!extensionName) {
  console.error('❌ Please provide the extension name as the first argument');
  console.error('Usage: node download-extension.js <extension-name> [extension-id]');
  process.exit(1);
}

if (!isMetaMask && !extensionId) {
  console.error('❌ Please provide both extension name and ID as arguments');
  console.error('Usage: node download-extension.js <extension-name> <extension-id>');
  process.exit(1);
}

// Set output directory relative to project root (i.e. where `npm run` would be called)
const outputDir = path.join(process.cwd(), 'extensions', extensionName);

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
    if (isMetaMask) {
      const metaMaskUrl = `https://github.com/MetaMask/metamask-extension/releases/download/v${METAMASK_VERSION}/metamask-chrome-${METAMASK_VERSION}.zip`;
      const zipPath = path.join(outputDir, `metamask-${METAMASK_VERSION}.zip`);

      console.log(`🔄 Downloading MetaMask extension version ${METAMASK_VERSION}`);
      console.log(`📁 Output directory: ${outputDir}`);
      console.log(`🔗 GitHub URL: ${metaMaskUrl}`);

      fs.mkdirSync(outputDir, { recursive: true });

      const response = await fetch(metaMaskUrl, {
        headers: {
          'User-Agent': 'deposit-withdraw-monitor-extension-downloader'
        }
      });

      if (!response.ok) {
        throw new Error(`MetaMask download failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));
      console.log(`🗜️ ZIP: ${zipPath}`);

      await extractZip(zipPath, outputDir);

      console.log('🧹 Cleaning up download files...');
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
        console.log('✅ ZIP file removed');
      }

      console.log('✅ MetaMask extension downloaded and extracted successfully!');
      console.log(`📁 Extension extracted to: ${outputDir} | 📝 Name: ${extensionName} | 🆔 ID: ${extensionId ?? 'N/A'} | 🧾 Version: ${METAMASK_VERSION}`);
      return;
    }

    const webstoreUrl = `https://chrome.google.com/webstore/detail/${extensionName}/${extensionId}`;

    console.log(`🔄 Downloading extension: ${extensionName} (ID: ${extensionId})`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`🔗 Web Store URL: ${webstoreUrl}`);

    const { crxPath, zipPath } = await fetchExtensionZip(webstoreUrl, {
      // one could provide a custom chrome version here
      chromeVersion: '133.0',
      outputDir: outputDir
    });

    console.log('📦 Files downloaded');
    console.log(`📦 CRX: ${crxPath}`);
    console.log(`🗜️ ZIP: ${zipPath}`);

    await extractZip(zipPath, outputDir);

    console.log('🧹 Cleaning up download files...');
    if (fs.existsSync(crxPath)) {
      fs.unlinkSync(crxPath);
      console.log('✅ CRX file removed');
    }
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      console.log('✅ ZIP file removed');
    }

    console.log('✅ Extension downloaded and extracted successfully!');
    console.log(`📁 Extension extracted to: ${outputDir} | 📝 Name: ${extensionName} | 🆔 ID: ${extensionId}`);
  } catch (error) {
    console.error('❌ Error downloading extension:', error.message);
    if (isMetaMask) {
      console.error(`💡 Tip: Check that MetaMask version ${METAMASK_VERSION} exists on GitHub releases`);
    } else {
      console.error(`💡 Tip: Check if the extension ID '${extensionId}' is correct and publicly available`);
    }
    process.exit(1);
  }
}

downloadExtension();
