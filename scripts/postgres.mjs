import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { arch, platform } from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, '.postgres-data');
const LOG_FILE = path.join(ROOT_DIR, '.postgres', 'postgres.log');
const STATE_FILE = path.join(ROOT_DIR, '.postgres', 'state.json');

const DB_USER = process.env.POSTGRES_USER || 'user';
const DB_PASSWORD = process.env.POSTGRES_PASSWORD || 'password';
const DB_NAME = process.env.POSTGRES_DB || 'suz';
const DB_PORT = Number(process.env.POSTGRES_PORT || 5432);

const postgresOptions = {
  databaseDir: DATA_DIR,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error(message),
};

function getEmbeddedPostgres() {
  return new EmbeddedPostgres(postgresOptions);
}

async function loadState() {
  try {
    const raw = await readFile(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveState(state) {
  await mkdir(path.dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function runCommand(command, args, { waitForExit = true } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      detached: !waitForExit,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    if (!waitForExit) {
      child.unref();
      resolve({ stdout, stderr });
      return;
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr.trim() || stdout.trim() || `Command failed with code ${code}`));
      }
    });
  });
}

async function resolveBinaries() {
  const system = platform();
  const cpu = arch();

  if (system === 'win32' && cpu === 'x64') {
    return import('@embedded-postgres/windows-x64');
  }
  if (system === 'darwin' && cpu === 'arm64') {
    return import('@embedded-postgres/darwin-arm64');
  }
  if (system === 'darwin' && cpu === 'x64') {
    return import('@embedded-postgres/darwin-x64');
  }
  if (system === 'linux' && cpu === 'x64') {
    return import('@embedded-postgres/linux-x64');
  }
  if (system === 'linux' && cpu === 'arm64') {
    return import('@embedded-postgres/linux-arm64');
  }

  throw new Error(`Unsupported platform for embedded PostgreSQL: ${system}/${cpu}`);
}

function isInitialised() {
  return existsSync(path.join(DATA_DIR, 'PG_VERSION'));
}

async function waitForDatabase(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const client = new pg.Client({
        user: DB_USER,
        password: DB_PASSWORD,
        host: 'localhost',
        port: DB_PORT,
        database: 'postgres',
      });
      await client.connect();
      await client.end();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new Error(`PostgreSQL did not become ready on port ${DB_PORT}.`);
}

async function ensureApplicationDatabase() {
  const client = new pg.Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: 'localhost',
    port: DB_PORT,
    database: 'postgres',
  });

  await client.connect();

  const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (existing.rowCount === 0) {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`Created database "${DB_NAME}".`);
  }

  await client.end();
}

async function isRunning() {
  try {
    await waitForDatabase(1);
    return true;
  } catch {
    return false;
  }
}

async function startPostgres() {
  if (await isRunning()) {
    console.log(`PostgreSQL is already running on port ${DB_PORT}.`);
    await ensureApplicationDatabase();
    return;
  }

  const embedded = getEmbeddedPostgres();

  if (!isInitialised()) {
    console.log('Initialising PostgreSQL data directory (first run may take a minute)...');
    await embedded.initialise();
  }

  const { pg_ctl } = await resolveBinaries();
  await mkdir(path.dirname(LOG_FILE), { recursive: true });

  console.log(`Starting PostgreSQL on port ${DB_PORT}...`);
  await runCommand(pg_ctl, ['start', '-D', DATA_DIR, '-l', LOG_FILE, '-o', `-p ${DB_PORT}`], {
    waitForExit: false,
  });

  await waitForDatabase();
  await ensureApplicationDatabase();

  await saveState({
    dataDir: DATA_DIR,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
    startedAt: new Date().toISOString(),
  });

  console.log('PostgreSQL is ready.');
  console.log(
    `Connection URL: postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}`,
  );
}

async function stopPostgres() {
  if (!isInitialised()) {
    console.log('PostgreSQL has not been initialised yet.');
    return;
  }

  if (!(await isRunning())) {
    console.log('PostgreSQL is not running.');
    return;
  }

  const { pg_ctl } = await resolveBinaries();

  console.log('Stopping PostgreSQL...');
  await runCommand(pg_ctl, ['stop', '-D', DATA_DIR, '-m', 'fast']);
  console.log('PostgreSQL stopped.');
}

async function showStatus() {
  const running = await isRunning();
  console.log(`PostgreSQL: ${running ? 'running' : 'stopped'}`);
  console.log(`Port: ${DB_PORT}`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`Data directory: ${DATA_DIR}`);

  const state = await loadState();
  if (state?.startedAt) {
    console.log(`Last started: ${state.startedAt}`);
  }
}

const command = process.argv[2] || 'start';

try {
  if (command === 'start') {
    await startPostgres();
  } else if (command === 'stop') {
    await stopPostgres();
  } else if (command === 'status') {
    await showStatus();
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Usage: node scripts/postgres.mjs [start|stop|status]');
    process.exit(1);
  }
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
