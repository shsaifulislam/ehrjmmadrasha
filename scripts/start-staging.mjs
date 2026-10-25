import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const envStagingPath = path.join(projectRoot, '.env.staging');

if (!fs.existsSync(envStagingPath)) {
  console.error('[Staging Launcher] ERROR: .env.staging not found. Run credential provisioning first.');
  process.exit(1);
}

const envContent = fs.readFileSync(envStagingPath, 'utf8');
const stagingEnv = { ...process.env };

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    stagingEnv[key] = val;
  }
}

stagingEnv.USE_POSTGRES_STAGING = 'true';
stagingEnv.DATABASE_PROVIDER = 'postgresql';
stagingEnv.PORT = '3001';
stagingEnv.NEXT_DIST_DIR = '.next_staging';
stagingEnv.NEXT_PUBLIC_APP_ENV = 'staging';
stagingEnv.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';

console.log('[Staging Launcher] Starting Next.js Staging ERP Server on port 3001 with PostgreSQL...');

const isWindows = process.platform === 'win32';
const nextCmd = isWindows ? 'npx.cmd' : 'npx';

const child = spawn(nextCmd, ['next', 'dev', '-p', '3001'], {
  cwd: projectRoot,
  env: stagingEnv,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('[Staging Launcher] Failed to start process:', err);
});

child.on('exit', (code) => {
  console.log(`[Staging Launcher] Process exited with code ${code}`);
});
