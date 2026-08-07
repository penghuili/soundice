const { execFileSync } = require('child_process');

const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || 'soundice';
const databaseName = process.env.CLOUDFLARE_D1_DATABASE || 'soundice';
const redirectUrl = process.env.VITE_REDIRECT_URL || `https://${projectName}.pages.dev`;

function run(command, args, options = {}) {
  return execFileSync(command, args, { stdio: 'inherit', ...options });
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log('Building the app for Cloudflare Pages...');
const buildEnv = { ...process.env, VITE_REDIRECT_URL: redirectUrl };
if (process.platform === 'win32') {
  run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run build'], { env: buildEnv });
} else {
  run('npm', ['run', 'build'], { env: buildEnv });
}

console.log(`Applying D1 schema to ${databaseName}...`);
run(npx, ['wrangler', 'd1', 'execute', databaseName, '--remote', '--file=db/schema.sql']);

console.log(`Deploying ${projectName} to Cloudflare Pages...`);
run(npx, ['wrangler', 'pages', 'deploy', 'dist', '--project-name', projectName]);
console.log(`Cloudflare deployment completed: https://${projectName}.pages.dev`);
