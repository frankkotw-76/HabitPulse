const fs = require('fs');
const zlib = require('zlib');

// 產生有效且好看的 PNG 檔案 (純 Node.js，不依賴外部原生 binary)
function createSolidPng(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(2, 9); // truecolor
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 per line
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // 漸層與脈動視覺
      const factor = (x + y) / (width + height);
      rawData[pixelOffset] = Math.round(r * (0.8 + 0.4 * factor));     // R
      rawData[pixelOffset + 1] = Math.round(g * (0.8 + 0.4 * factor)); // G
      rawData[pixelOffset + 2] = Math.round(b * (0.8 + 0.4 * factor)); // B
    }
  }

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

// CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
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

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

// 綠色 / 翡翠脈衝漸層 (16, 185, 129)
fs.writeFileSync('public/pwa-192x192.png', createSolidPng(192, 192, 16, 185, 129));
fs.writeFileSync('public/pwa-512x512.png', createSolidPng(512, 512, 16, 185, 129));
fs.writeFileSync('public/apple-touch-icon.png', createSolidPng(180, 180, 16, 185, 129));
fs.writeFileSync('public/favicon.ico', createSolidPng(32, 32, 16, 185, 129));
console.log('Successfully generated PWA icons!');
