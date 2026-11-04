const fs = require('fs');
const zlib = require('zlib');

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function createPulsePng(size) {
  const width = size;
  const height = size;

  const segments = [
    [0.12, 0.50, 0.30, 0.50],
    [0.30, 0.50, 0.40, 0.26],
    [0.40, 0.26, 0.52, 0.76],
    [0.52, 0.76, 0.62, 0.35],
    [0.62, 0.35, 0.70, 0.58],
    [0.70, 0.58, 0.76, 0.50],
    [0.76, 0.50, 0.88, 0.50],
  ];

  const strokeWidth = size * 0.045;
  const glowWidth = size * 0.12;

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      const nx = x / width;
      const ny = y / height;

      // 1. 背景：深色暗黑漸層 (深石板藍黑 #0b0f19 至 #030712)
      const bgDistFromCenter = Math.hypot(nx - 0.5, ny - 0.5);
      let r = Math.round(11 + 6 * (1 - bgDistFromCenter));
      let g = Math.round(16 + 14 * (1 - bgDistFromCenter));
      let b = Math.round(28 + 18 * (1 - bgDistFromCenter));

      // 2. 計算到脈動電波折線的最小距離
      let minDist = Infinity;
      for (const [x1, y1, x2, y2] of segments) {
        const d = distToSegment(nx, ny, x1, y1, x2, y2) * size;
        if (d < minDist) minDist = d;
      }

      // 節點小圓點 (波峰與波谷)
      const dPeak = Math.hypot(nx - 0.40, ny - 0.26) * size;
      const dValley = Math.hypot(nx - 0.52, ny - 0.76) * size;
      const minDotDist = Math.min(dPeak, dValley);

      // 3. 著色與光暈合成
      const pulseColorR = Math.round(16 + (nx * 10));   // Emerald/Teal
      const pulseColorG = Math.round(200 + (nx * 25));
      const pulseColorB = Math.round(140 + (nx * 60));

      if (minDist <= strokeWidth || minDotDist <= strokeWidth * 1.2) {
        // 主線條核心 (高亮翡翠白綠)
        const coreFactor = Math.max(0, 1 - (minDist / strokeWidth));
        r = Math.min(255, Math.round(pulseColorR + coreFactor * 100));
        g = Math.min(255, Math.round(pulseColorG + coreFactor * 55));
        b = Math.min(255, Math.round(pulseColorB + coreFactor * 100));
      } else if (minDist < strokeWidth + glowWidth) {
        // 柔和外光暈 (Glow)
        const glowFactor = Math.pow(1 - (minDist - strokeWidth) / glowWidth, 2);
        r = Math.min(255, Math.round(r + pulseColorR * glowFactor * 0.8));
        g = Math.min(255, Math.round(g + pulseColorG * glowFactor * 0.8));
        b = Math.min(255, Math.round(b + pulseColorB * glowFactor * 0.8));
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  // PNG 編碼
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // truecolor
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdr);
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);

  const content = Buffer.concat([typeBuf, data]);
  const crc = calculateCrc32(content);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, content, crcBuf]);
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 產製所有規格圖標
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/apple-touch-icon.png', createPulsePng(180));
fs.writeFileSync('public/pwa-192x192.png', createPulsePng(192));
fs.writeFileSync('public/pwa-512x512.png', createPulsePng(512));
fs.writeFileSync('public/favicon.ico', createPulsePng(32));

console.log('Successfully generated high-res HabitPulse icons with pulse wave!');
