import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function timestampPlugin(env) {
  const assetDir = `${env.TIMESTAMP}/`;
  const version = env.VITE_VERSION || env.VERSION || 'dev';

  return {
    name: 'timestamp-plugin',
    config(config) {
      config.build = config.build || {};
      config.build.assetsDir = assetDir;
    },
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        if (fileName !== 'index.html' && !fileName.startsWith(assetDir)) {
          const newFileName = assetDir + fileName;
          bundle[newFileName] = bundle[fileName];
          delete bundle[fileName];
        }
      }
    },
    writeBundle(options) {
      // Always publish a no-cache version probe for the in-app update button.
      const outDir = options.dir || 'dist';
      writeFileSync(resolve(outDir, 'version.json'), `${JSON.stringify({ version })}\n`);
    },
  };
}
