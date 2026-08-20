import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/demo/spritesheet.png');

const FRAME_W = 9;
const FRAME_H = 9;
const FRAMES_PER_DIRECTION = 2;
const DIRECTION_COUNT = 4;
const width = FRAME_W * FRAMES_PER_DIRECTION;
const height = FRAME_H * DIRECTION_COUNT;

const COLORS = {
  '.': [0, 0, 0, 0],
  h: [254, 202, 87, 255],
  b: [233, 69, 96, 255],
  f: [0, 102, 255, 255],
};

const SHEET_TEMPLATES = [
  [`..hhh....\n..hhhh...\n..bbbb...\n...bb....\n...f.....`, `..hhh....\n..hhhh...\n..bbbb...\n...bb....\n..f......`],
  [`..bbb....\n..bbbb...\n..bbbb...\n...bb....\n...f.....`, `..bbb....\n..bbbb...\n..bbbb...\n...bb....\n..f......`],
  [`...hhh...\n..hhhhh..\n..bbbbb..\n...bbb...\n....f....`, `...hhh...\n..hhhhh..\n..bbbbb..\n...bbb...\n...f.....`],
  [`...hhh...\n..hhhhh..\n..bbbbb..\n...bbb...\n.....f...`, `...hhh...\n..hhhhh..\n..bbbbb..\n...bbb...\n......f..`],
];

function parseFrame(text) {
  const pixels = [];
  for (const row of text.trim().split('\n')) {
    for (const ch of row.padEnd(FRAME_W, '.').slice(0, FRAME_W)) {
      pixels.push(COLORS[ch] ?? COLORS['.']);
    }
  }
  while (pixels.length < FRAME_W * FRAME_H) pixels.push(COLORS['.']);
  return pixels;
}

function flipFrame(pixels) {
  const out = [];
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = FRAME_W - 1; x >= 0; x--) {
      out.push(pixels[y * FRAME_W + x] ?? COLORS['.']);
    }
  }
  return out;
}

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
for (let sheetY = 0; sheetY < height; sheetY++) {
  const rowStart = sheetY * (width * 4 + 1);
  raw[rowStart] = 0;
  const direction = Math.floor(sheetY / FRAME_H);
  const localY = sheetY % FRAME_H;
  for (let sheetX = 0; sheetX < width; sheetX++) {
    const frameIndex = Math.floor(sheetX / FRAME_W);
    const localX = sheetX % FRAME_W;
    let pixels = parseFrame(SHEET_TEMPLATES[direction]?.[0] ?? '');
    if (frameIndex === 1) pixels = [...pixels];
    if (direction === 3) pixels = flipFrame(parseFrame(SHEET_TEMPLATES[2]?.[frameIndex] ?? ''));
    const rgba = pixels[localY * FRAME_W + localX] ?? COLORS['.'];
    const i = rowStart + 1 + sheetX * 4;
    raw[i] = rgba[0];
    raw[i + 1] = rgba[1];
    raw[i + 2] = rgba[2];
    raw[i + 3] = rgba[3];
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
console.log('Wrote', outPath, png.length, 'bytes', `(${width}x${height})`);
