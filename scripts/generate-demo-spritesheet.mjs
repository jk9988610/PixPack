import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/demo/spritesheet.png');

const width = 320;
const height = 32;
const frameW = 32;

const palette = [
  [0, 0, 0, 0],
  [233, 69, 96, 255],
  [255, 255, 255, 255],
  [26, 26, 46, 255],
  [125, 237, 159, 255],
];

function crc32(data) {
  let c = 0xffffffff;
  for (const byte of data) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y++) {
  const rowStart = y * (width * 4 + 1);
  raw[rowStart] = 0;
  for (let x = 0; x < width; x++) {
    const frame = Math.floor(x / frameW);
    const localX = x % frameW;
    const body = localX > 8 && localX < 24 && y > 8 && y < 28;
    const head = localX > 11 && localX < 21 && y > 2 && y < 12;
    const leg = (localX === 12 + (frame % 3)) || (localX === 19 - (frame % 2)) && y > 24;
    let idx = 0;
    if (body) idx = 1;
    else if (head) idx = 2;
    else if (leg) idx = 4;
    else if (localX === 0 || localX === 31 || y === 0 || y === 31) idx = 3;
    const [r, g, b, a] = palette[idx] ?? palette[0];
    const i = rowStart + 1 + x * 4;
    raw[i] = r;
    raw[i + 1] = g;
    raw[i + 2] = b;
    raw[i + 3] = a;
  }
}

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, png);
console.log('Wrote', outPath, png.length, 'bytes');
