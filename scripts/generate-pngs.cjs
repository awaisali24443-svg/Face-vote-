const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal pure-Node PNG generator
function createPNG(width, height, drawFn) {
  // RGBA buffer
  const rowStride = width * 4;
  const rawData = Buffer.alloc((rowStride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowStride + 1);
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crcVal = crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // CRC32 table & calc
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ -1) >>> 0;
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw FaceVote Brand Icon (Deep Emerald + Gold + Tech Crescent)
function drawBrandIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background: Rich Deep Emerald Gradient
  const grad = y / h;
  let r = Math.floor(2 + grad * 4);
  let g = Math.floor(44 + grad * 50);
  let b = Math.floor(34 + grad * 36);
  let a = 255;

  // Outer border / corner rounding for standard icons
  if (!isMaskable) {
    const cornerRadius = w * 0.22;
    const clampedX = Math.max(cornerRadius, Math.min(w - cornerRadius, x));
    const clampedY = Math.max(cornerRadius, Math.min(h - cornerRadius, y));
    const cdx = x - clampedX;
    const cdy = y - clampedY;
    if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }
  }

  // Tech Ring
  const ringRadius = w * 0.38;
  const ringThick = w * 0.015;
  if (Math.abs(dist - ringRadius) < ringThick) {
    return [52, 211, 153, 220]; // Emerald glow ring
  }

  // Crescent
  const crescentCx = cx + w * 0.05;
  const crescentCy = cy - w * 0.02;
  const cDist1 = Math.sqrt((x - crescentCx) ** 2 + (y - crescentCy) ** 2);
  const cDist2 = Math.sqrt((x - (crescentCx + w * 0.08)) ** 2 + (y - (crescentCy - w * 0.04)) ** 2);

  if (cDist1 < w * 0.20 && cDist2 > w * 0.16) {
    return [255, 255, 255, 250]; // Pure white crescent
  }

  // Star
  const starCx = cx + w * 0.14;
  const starCy = cy - w * 0.12;
  const sDist = Math.sqrt((x - starCx) ** 2 + (y - starCy) ** 2);
  if (sDist < w * 0.06) {
    return [253, 224, 71, 255]; // Gold star
  }

  // Glowing Checkmark
  // Checkmark line 1: (cx - 0.15*w, cy + 0.05*w) to (cx - 0.02*w, cy + 0.18*w)
  // Checkmark line 2: (cx - 0.02*w, cy + 0.18*w) to (cx + 0.22*w, cy - 0.08*w)
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2);
  }

  const d1 = distToSegment(x, y, cx - w * 0.14, cy + w * 0.04, cx - w * 0.02, cy + w * 0.16);
  const d2 = distToSegment(x, y, cx - w * 0.02, cy + w * 0.16, cx + w * 0.18, cy - w * 0.08);
  const checkDist = Math.min(d1, d2);
  const checkThick = w * 0.028;

  if (checkDist < checkThick) {
    return [52, 211, 153, 255]; // Emerald check
  } else if (checkDist < checkThick + w * 0.02) {
    return [16, 185, 129, 160]; // Emerald glow
  }

  return [r, g, b, a];
}

const publicDir = path.join(__dirname, '..', 'public');

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));
console.log('Created pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));
console.log('Created pwa-512x512.png');

// 3. pwa-maskable-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawBrandIcon(x, y, w, h, true)));
console.log('Created pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawBrandIcon(x, y, w, h, false)));
console.log('Created apple-touch-icon.png');
