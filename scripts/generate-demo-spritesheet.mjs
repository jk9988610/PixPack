import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/demo/spritesheet.png');

const FRAME_W = 16;
const FRAME_H = 16;
const FRAME_COUNT = 10;
const width = FRAME_W * FRAME_COUNT;
const height = FRAME_H;

const CHAR_TO_BONE = {
  '.': null,
  h: 'head',
  b: 'body',
  a: 'arm',
  f: 'leg_f',
  r: 'leg_b',
};

const DEFAULT_SKIN = {
  head: [254, 202, 87, 255],
  body: [233, 69, 96, 255],
  arm: [254, 202, 87, 255],
  leg_f: [0, 102, 255, 255],
  leg_b: [0, 68, 187, 255],
};

const FRAME_TEMPLATES = [
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n....f...........\n...bb...b.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....f..r........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....r...........\n....f...........\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....f..r........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n....f...........\n...bb...b.......\n...bb..bb.......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hh.........\n....hhhh........\n...bbbbbb.......\n...bbbbbb.......\n...bb..bb.......\n....r..f........\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
];

function parseTemplate(text) {
  const bones = [];
  for (const row of text.trim().split('\n')) {
    for (const ch of row) {
      bones.push(CHAR_TO_BONE[ch] ?? null);
    }
  }
  return bones;
}

const SKELETON_FRAMES = FRAME_TEMPLATES.map(parseTemplate);

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
    const frame = Math.floor(x / FRAME_W);
    const localX = x % FRAME_W;
    const bone = SKELETON_FRAMES[frame]?.[localX + y * FRAME_W];
    const rgba = bone ? DEFAULT_SKIN[bone] : [0, 0, 0, 0];
    const i = rowStart + 1 + x * 4;
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
console.log('Wrote', outPath, png.length, 'bytes');
