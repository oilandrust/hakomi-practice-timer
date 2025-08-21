#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Get current git info
  const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  
  // Create .env file with git info
  const envContent = `VITE_COMMIT_HASH=${commitHash}\n`;
  
  const envPath = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envPath, envContent);
  
  console.log(`✅ Git commit hash injected: ${commitHash}`);
} catch (error) {
  console.error('❌ Failed to inject git info:', error.message);
  process.exit(1);
}
