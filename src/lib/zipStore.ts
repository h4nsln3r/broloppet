/** Bygger en okomprimerad ZIP (STORE). JPEG är redan komprimerat. */

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = n & 0xff;
  b[1] = (n >>> 8) & 0xff;
  b[2] = (n >>> 16) & 0xff;
  b[3] = (n >>> 24) & 0xff;
  return b;
}

function asBlobPart(data: Uint8Array): BlobPart {
  return data as unknown as BlobPart;
}

export type ZipStoreFile = {
  name: string;
  data: Uint8Array;
};

/** Skapar en zip-fil utan komprimering. */
export function createStoreZip(files: ZipStoreFile[]): Blob {
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  const utf8 = new TextEncoder();
  let offset = 0;

  for (const file of files) {
    const nameBytes = utf8.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.byteLength;
    const flags = 0x0800; // UTF-8-filnamn

    const local = new Uint8Array(30 + nameBytes.length);
    local.set(u32(0x04034b50), 0);
    local.set(u16(20), 4);
    local.set(u16(flags), 6);
    local.set(u16(0), 8);
    local.set(u16(0), 10);
    local.set(u16(0), 12);
    local.set(u32(crc), 14);
    local.set(u32(size), 18);
    local.set(u32(size), 22);
    local.set(u16(nameBytes.length), 26);
    local.set(u16(0), 28);
    local.set(nameBytes, 30);

    parts.push(asBlobPart(local), asBlobPart(file.data));

    const header = new Uint8Array(46 + nameBytes.length);
    header.set(u32(0x02014b50), 0);
    header.set(u16(20), 4);
    header.set(u16(20), 6);
    header.set(u16(flags), 8);
    header.set(u16(0), 10);
    header.set(u16(0), 12);
    header.set(u16(0), 14);
    header.set(u32(crc), 16);
    header.set(u32(size), 20);
    header.set(u32(size), 24);
    header.set(u16(nameBytes.length), 28);
    header.set(u16(0), 30);
    header.set(u16(0), 32);
    header.set(u16(0), 34);
    header.set(u16(0), 36);
    header.set(u32(0), 38);
    header.set(u32(offset), 42);
    header.set(nameBytes, 46);
    central.push(header);

    offset += local.length + size;
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  for (const chunk of central) parts.push(asBlobPart(chunk));

  const eocd = new Uint8Array(22);
  eocd.set(u32(0x06054b50), 0);
  eocd.set(u16(0), 4);
  eocd.set(u16(0), 6);
  eocd.set(u16(files.length), 8);
  eocd.set(u16(files.length), 10);
  eocd.set(u32(centralSize), 12);
  eocd.set(u32(offset), 16);
  eocd.set(u16(0), 20);
  parts.push(asBlobPart(eocd));

  return new Blob(parts, { type: "application/zip" });
}
