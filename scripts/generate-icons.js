const path = require('path');
const sharp = require('sharp');

const sizes = [32, 36, 48, 72, 96, 144, 180, 192, 512];
const source = path.join(__dirname, '..', 'public', 'soundice-icon.svg');
const outDir = path.join(__dirname, '..', 'public', 'icons');

(async () => {
  for (const size of sizes) {
    await sharp(source, { density: (72 * size) / 64 })
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`icon-${size}.png`);
  }
})();
