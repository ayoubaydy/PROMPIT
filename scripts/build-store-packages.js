"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const projectRoot = path.resolve(__dirname, "..");
const releaseRoot = path.join(projectRoot, "release", "stores");
const stageRoot = path.join(releaseRoot, ".stage");
const sourceManifest = readJson(path.join(projectRoot, "manifest.json"));
const version = sourceManifest.version;

const extensionFiles = [
  "manifest.json",
  "background.js",
  "content.js",
  "content.css",
  "tokens.css",
  "options.html",
  "options.js",
  "options.css",
  "PROMPIT_LOGO.svg"
];
const extensionDirectories = ["icons"];
const packageTargets = [
  { store: "chrome", filename: `Promp-it-v${version}-chrome.zip` },
  { store: "edge", filename: `Promp-it-v${version}-edge.zip` },
  { store: "firefox", filename: `Promp-it-v${version}-firefox.xpi` },
  { store: "safari", filename: `Promp-it-v${version}-safari-web-extension-input.zip` }
];

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function ensureFile(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filename)) throw new Error(`Missing required store file: ${relativePath}`);
  return filename;
}

function resetDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function copyExtensionFiles(destination) {
  extensionFiles.forEach((relativePath) => {
    fs.copyFileSync(ensureFile(relativePath), path.join(destination, relativePath));
  });
  extensionDirectories.forEach((relativePath) => {
    fs.cpSync(ensureFile(relativePath), path.join(destination, relativePath), { recursive: true });
  });
}

function manifestForStore(store) {
  const manifest = JSON.parse(JSON.stringify(sourceManifest));
  const settings = manifest.browser_specific_settings || {};

  if (store === "firefox") {
    manifest.browser_specific_settings = { gecko: settings.gecko };
    if (!settings.gecko?.id) throw new Error("Firefox package requires browser_specific_settings.gecko.id.");
    if (!settings.gecko?.data_collection_permissions?.required?.length) {
      throw new Error("Firefox package requires data_collection_permissions.");
    }
  } else if (store === "safari") {
    manifest.browser_specific_settings = { safari: settings.safari };
    if (!settings.safari?.strict_min_version) throw new Error("Safari package requires a Safari minimum version.");
  } else {
    delete manifest.browser_specific_settings;
  }

  return manifest;
}

function validateManifest(manifest, store) {
  if (manifest.manifest_version !== 3) throw new Error(`${store}: Manifest V3 is required.`);
  if (!/^\d+(?:\.\d+){0,3}$/.test(String(manifest.version || ""))) {
    throw new Error(`${store}: Invalid manifest version.`);
  }
  if (!manifest.icons?.["128"]) throw new Error(`${store}: A 128px icon is required.`);
  if (!manifest.background?.service_worker) throw new Error(`${store}: A background service worker is required.`);
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipDateTime(value) {
  const date = new Date(value);
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

function writeUint16(buffer, offset, value) {
  buffer.writeUInt16LE(value & 0xffff, offset);
}

function writeUint32(buffer, offset, value) {
  buffer.writeUInt32LE(value >>> 0, offset);
}

function listPackageFiles(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((first, second) => first.name.localeCompare(second.name))
    .flatMap((entry) => {
      const absolute = path.join(directory, entry.name);
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) return listPackageFiles(absolute, `${relative}/`);
      if (!entry.isFile()) return [];
      return [{ absolute, relative: relative.replaceAll("\\", "/"), stats: fs.statSync(absolute) }];
    });
}

function createZip(directory, destination) {
  const localRecords = [];
  const centralRecords = [];
  let offset = 0;

  listPackageFiles(directory).forEach((file) => {
    const source = fs.readFileSync(file.absolute);
    const deflated = zlib.deflateRawSync(source, { level: 9 });
    const compressed = deflated.length < source.length ? deflated : source;
    const method = compressed === deflated ? 8 : 0;
    const name = Buffer.from(file.relative, "utf8");
    const checksum = crc32(source);
    const timestamp = zipDateTime(file.stats.mtime);
    const local = Buffer.alloc(30 + name.length + compressed.length);

    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20);
    writeUint16(local, 6, 0x0800);
    writeUint16(local, 8, method);
    writeUint16(local, 10, timestamp.time);
    writeUint16(local, 12, timestamp.date);
    writeUint32(local, 14, checksum);
    writeUint32(local, 18, compressed.length);
    writeUint32(local, 22, source.length);
    writeUint16(local, 26, name.length);
    writeUint16(local, 28, 0);
    name.copy(local, 30);
    compressed.copy(local, 30 + name.length);
    localRecords.push(local);

    const central = Buffer.alloc(46 + name.length);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 0x0314);
    writeUint16(central, 6, 20);
    writeUint16(central, 8, 0x0800);
    writeUint16(central, 10, method);
    writeUint16(central, 12, timestamp.time);
    writeUint16(central, 14, timestamp.date);
    writeUint32(central, 16, checksum);
    writeUint32(central, 20, compressed.length);
    writeUint32(central, 24, source.length);
    writeUint16(central, 28, name.length);
    writeUint16(central, 30, 0);
    writeUint16(central, 32, 0);
    writeUint16(central, 34, 0);
    writeUint16(central, 36, 0);
    writeUint32(central, 38, 0);
    writeUint32(central, 42, offset);
    name.copy(central, 46);
    centralRecords.push(central);
    offset += local.length;
  });

  const centralSize = centralRecords.reduce((total, record) => total + record.length, 0);
  const end = Buffer.alloc(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 4, 0);
  writeUint16(end, 6, 0);
  writeUint16(end, 8, centralRecords.length);
  writeUint16(end, 10, centralRecords.length);
  writeUint32(end, 12, centralSize);
  writeUint32(end, 16, offset);
  writeUint16(end, 20, 0);
  fs.writeFileSync(destination, Buffer.concat([...localRecords, ...centralRecords, end]));
}

function buildPackage(target) {
  const stage = path.join(stageRoot, target.store);
  fs.mkdirSync(stage, { recursive: true });
  copyExtensionFiles(stage);
  const manifest = manifestForStore(target.store);
  validateManifest(manifest, target.store);
  fs.writeFileSync(path.join(stage, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const destination = path.join(releaseRoot, target.filename);
  createZip(stage, destination);
  return { store: target.store, filename: target.filename, bytes: fs.statSync(destination).size };
}

resetDirectory(stageRoot);
packageTargets.forEach((target) => fs.rmSync(path.join(releaseRoot, target.filename), { force: true }));
const packages = packageTargets.map(buildPackage);
fs.rmSync(stageRoot, { recursive: true, force: true });

console.table(packages);
