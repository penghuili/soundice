const { execFileSync } = require('child_process');

require('dotenv').config();

const bucketUrl = process.env.S3_URL;
const bucketName = bucketUrl?.replace(/^s3:\/\//, '');
const timestamp = process.env.TIMESTAMP;

if (!bucketName || !timestamp) {
  throw new Error('S3_URL and TIMESTAMP must be configured before deploying.');
}

buildApp();
deployApp();

function run(command, args, options = {}) {
  return execFileSync(command, args, { stdio: 'inherit', ...options });
}

function buildApp() {
  console.log('Building the app...');
  if (process.platform === 'win32') {
    run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run build']);
  } else {
    run('npm', ['run', 'build']);
  }
}

function deployApp() {
  console.log(`Deploying app to ${bucketUrl} ...`);
  run('aws', [
    's3',
    'sync',
    `dist/${timestamp}`,
    `${bucketUrl}/${timestamp}`,
    '--cache-control',
    'max-age=31536000,public',
  ]);

  run('aws', [
    's3',
    'sync',
    'dist/icons',
    `${bucketUrl}/icons`,
    '--delete',
    '--cache-control',
    'max-age=0,no-cache',
  ]);

  for (const file of ['favicon.ico', 'manifest.json', 'soundice-icon.svg', 'soundice-mark.svg', 'sw.js']) {
    run('aws', [
      's3',
      'cp',
      `dist/${file}`,
      `${bucketUrl}/${file}`,
      '--cache-control',
      'max-age=0,no-cache',
    ]);
  }

  run('aws', [
    's3',
    'cp',
    'dist/index.html',
    `${bucketUrl}/index.html`,
    '--cache-control',
    'max-age=0,no-store',
  ]);
  deleteOldVersions();
  console.log(`Deploy app to ${bucketUrl} completed.`);
}

function deleteOldVersions() {
  const output = execFileSync(
    'aws',
    [
      's3api',
      'list-objects-v2',
      '--bucket',
      bucketName,
      '--delimiter',
      '/',
      '--query',
      'CommonPrefixes[].Prefix',
      '--output',
      'json',
    ],
    { encoding: 'utf8' }
  );
  const versions = JSON.parse(output)
    .map(prefix => prefix.replace(/\/$/, ''))
    .filter(prefix => /^\d{14}$/.test(prefix))
    .sort();

  for (const version of versions.slice(0, -10)) {
    console.log(`Deleting old version: ${version}`);
    run('aws', ['s3', 'rm', `${bucketUrl}/${version}`, '--recursive']);
  }
}
