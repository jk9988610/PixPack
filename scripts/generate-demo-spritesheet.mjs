import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/demo/spritesheet.png');

const FRAME_W = 16;
const FRAME_H = 16;
const FRAMES_PER_DIRECTION = 10;
const DIRECTION_COUNT = 8;
const width = FRAME_W * FRAMES_PER_DIRECTION;
const height = FRAME_H * DIRECTION_COUNT;

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

const SIDE_TEMPLATES = [
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

const FRONT_TEMPLATES = [
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....f....r......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....r....f......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....ff..rr......\n................\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....f....r......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
  `................\n.....hhhh.......\n....bbbbbb......\n....bbbbbb......\n.....bbbb.......\n....bb..bb......\n....r....f......\n....bb..bb......\n................\n................\n................\n................\n................\n................\n................\n................`,
];

const BACK_TEMPLATES = FRONT_TEMPLATES.map((t) => t.replace(/h/g, 'b').replace(/\.{5}hhhh/g, '.....bbbb'));

const DIAG_SE_TEMPLATES = SIDE_TEMPLATES.map((tpl, i) => {
  if (i < 4) return tpl;
  return tpl.replace('....f...........', '.....f..........').replace('....r...........', '.....r..........');
});

function parseTemplate(text) {
  const bones = [];
  for (const row of text.trim().split('\n')) {
    for (const ch of row) {
      bones.push(CHAR_TO_BONE[ch] ?? null);
    }
  }
  return bones;
}

function flipHorizontal(bones) {
  const out = [];
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = FRAME_W - 1; x >= 0; x--) {
      out.push(bones[y * FRAME_W + x] ?? null);
    }
  }
  return out;
}

const SIDE_FRAMES = SIDE_TEMPLATES.map(parseTemplate);
const FRONT_FRAMES = FRONT_TEMPLATES.map(parseTemplate);
const BACK_FRAMES = BACK_TEMPLATES.map(parseTemplate);
const DIAG_SE_FRAMES = DIAG_SE_TEMPLATES.map(parseTemplate);
const DIAG_NE_FRAMES = DIAG_SE_FRAMES.map(flipHorizontal);

function baseBonesForDirection(direction, frame) {
  switch (direction) {
    case 0:
      return FRONT_FRAMES[frame] ?? [];
    case 1:
      return flipHorizontal(DIAG_SE_FRAMES[frame] ?? []);
    case 2:
      return flipHorizontal(SIDE_FRAMES[frame] ?? []);
    case 3:
      return flipHorizontal(DIAG_NE_FRAMES[frame] ?? []);
    case 4:
      return BACK_FRAMES[frame] ?? [];
    case 5:
      return DIAG_NE_FRAMES[frame] ?? [];
    case 6:
      return SIDE_FRAMES[frame] ?? [];
    case 7:
      return DIAG_SE_FRAMES[frame] ?? [];
    default:
      return [];
  }
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
    const frame = Math.floor(sheetX / FRAME_W);
    const localX = sheetX % FRAME_W;
    const bone = baseBonesForDirection(direction, frame)?.[localY * FRAME_W + localX];
    const rgba = bone ? DEFAULT_SKIN[bone] : [0, 0, 0, 0];
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
