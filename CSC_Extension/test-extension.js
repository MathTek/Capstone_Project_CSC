// Simple test script to verify extension functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing CSC Extension...');

const distPath = path.join(__dirname, 'dist');
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'background.js',
  'content.js'
];

console.log('Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`✗ ${file} missing`);
  }
});

// Check manifest.json structure
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(distPath, 'manifest.json'), 'utf8'));
  console.log('\nManifest validation:');
  console.log(`✓ Manifest version: ${manifest.manifest_version}`);
  console.log(`✓ Extension name: ${manifest.name}`);
  console.log(`✓ Popup HTML: ${manifest.action.default_popup}`);
  console.log(`✓ Background script: ${manifest.background.service_worker}`);
  console.log(`✓ Content scripts: ${manifest.content_scripts.length} configured`);
} catch (error) {
  console.log('✗ Error reading manifest:', error.message);
}

console.log('\nExtension build verification complete!');
