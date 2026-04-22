import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(__dirname, '..', 'server', '.env');

function getCurrentUrl() {
  try {
    if (!existsSync(ENV_FILE)) return null;
    const env = readFileSync(ENV_FILE, 'utf8');
    const match = env.match(/SPOTIFY_REDIRECT_URI=(https:\/\/[^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

console.log('Starting ngrok tunnel...');
const ngrok = spawn('ngrok', ['http', '8888'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
});

let urlFound = false;

ngrok.stdout.on('data', (data) => {
  const output = data.toString();
  const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.dev/);
  const url = urlMatch ? urlMatch[0] : null;

  if (url && !urlFound) {
    urlFound = true;
    const currentUrl = getCurrentUrl();
    if (currentUrl !== url) {
      console.log(`\nNew ngrok URL: ${url}`);
      console.log(`\n⚠️  Update Spotify Dashboard redirect URI to:`);
      console.log(`   ${url}/callback`);
      console.log(`\nPress Ctrl+C to stop, then run:\n   npm run dev\n`);
    } else {
      console.log(`\nngrok ready: ${url}`);
    }
  }
  process.stdout.write(data);
});

ngrok.stderr.on('data', (data) => {
  process.stderr.write(data);
});

ngrok.on('close', (code) => {
  console.log(`ngrok exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  ngrok.kill();
  process.exit();
});