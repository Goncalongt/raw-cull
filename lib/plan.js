import { join, basename, extname, relative } from "path";
import { resolve } from "path";

import { JPG_EXTENSIONS, RAW_EXTENSIONS, IS_WINDOWS } from "../constants.js";
import { getFiles } from "./files.js";

function findMatchingRaw(jpgPath, jpgDir, rawDir, rawIndex) {
  const baseName = basename(jpgPath, extname(jpgPath)).toLowerCase();
  const rawPath = rawIndex.get(baseName);
  if (!rawPath) return null;

  const resolvedRawDir = resolve(rawDir);
  const separator = IS_WINDOWS ? "\\" : "/";
  if (!resolve(rawPath).startsWith(resolvedRawDir + separator)) return null;

  return rawPath;
}

export function buildPlan(jpgDir, rawDir, moveToRawSubfolder, recursive) {
  if (moveToRawSubfolder && jpgDir.toLowerCase() !== rawDir.toLowerCase()) {
    throw new Error("`moveToRawSubfolder` is only valid when jpgDir and rawDir are the same folder.");
  }

  const jpgFiles = getFiles(jpgDir, JPG_EXTENSIONS, recursive);
  const rawFiles = getFiles(rawDir, RAW_EXTENSIONS, recursive);

  const rawIndex = new Map(
    rawFiles.map((f) => [basename(f, extname(f)).toLowerCase(), f])
  );

  const matchedRaws = new Set();
  const rawsToMove = [];

  for (const jpgPath of jpgFiles) {
    const rawPath = findMatchingRaw(jpgPath, jpgDir, rawDir, rawIndex);
    if (rawPath) {
      matchedRaws.add(rawPath);
      if (moveToRawSubfolder) rawsToMove.push(rawPath);
    }
  }

  const unmatched = rawFiles.filter((f) => !matchedRaws.has(f));
  const rawSubfolderPath = moveToRawSubfolder ? join(jpgDir, "Raw") : null;

  return { jpgDir, rawDir, jpgFiles, rawFiles, rawsToMove, unmatched, rawSubfolderPath };
}

export function printPlan({ jpgDir, rawDir, jpgFiles, rawFiles, rawsToMove, unmatched }) {
  console.log(`\nJPEG folder: ${jpgDir}`);
  console.log(`RAW folder:  ${rawDir}`);
  console.log(`\n📊 Found ${jpgFiles.length} JPEG(s) and ${rawFiles.length} RAW(s).`);

  if (rawsToMove.length > 0) {
    console.log(`\n📂 ${rawsToMove.length} kept RAW file(s) will be moved:`);
    rawsToMove.forEach((f) => {
      const rel = relative(rawDir, f);
      console.log(`  📂 ${rel} → ${join("Raw", rel)}`);
    });
  }

  if (unmatched.length === 0) {
    console.log("✅ No unmatched RAW files to delete.");
  } else {
    console.log(`\n🗑  ${unmatched.length} unmatched RAW file(s) will be deleted:`);
    unmatched.forEach((f) => console.log(`  🗑  ${relative(rawDir, f)}`));
  }
}