import { join, basename, extname, relative, resolve, dirname, sep } from "path";

import { JPG_EXTENSIONS, RAW_EXTENSIONS, IS_WINDOWS } from "../constants.js";
import { getFiles } from "./files.js";

/** Strip any path segment named "Raw" (case-insensitive) from a relative path */
function stripRawSegments(relPath) {
  return relPath
    .split(sep)
    .filter((segment) => segment.toLowerCase() !== "raw")
    .join(sep);
}

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
    throw new Error(
      "`moveToRawSubfolder` is only valid when jpgDir and rawDir are the same folder.",
    );
  }

  const jpgFiles = getFiles(jpgDir, JPG_EXTENSIONS, recursive);
  const rawFiles = getFiles(rawDir, RAW_EXTENSIONS, recursive);

  const rawIndex = new Map(
    rawFiles.map((f) => [basename(f, extname(f)).toLowerCase(), f]),
  );

  const matchedRaws = new Set();
  const rawsToMove = [];

  for (const jpgPath of jpgFiles) {
    const rawPath = findMatchingRaw(jpgPath, jpgDir, rawDir, rawIndex);
    if (rawPath) {
      matchedRaws.add(rawPath);
      if (moveToRawSubfolder) {
        const cleanRel = stripRawSegments(relative(rawDir, rawPath));
        rawsToMove.push({ src: rawPath, dest: join(jpgDir, "Raw", cleanRel) });
      }
    }
  }

  const unmatched = rawFiles.filter((f) => !matchedRaws.has(f));
  const rawSubfolderPath = moveToRawSubfolder ? join(jpgDir, "Raw") : null;

  return {
    jpgDir,
    rawDir,
    jpgFiles,
    rawFiles,
    rawsToMove,
    unmatched,
    rawSubfolderPath,
  };
}

export function printPlan({
  jpgDir,
  rawDir,
  jpgFiles,
  rawFiles,
  rawsToMove,
  unmatched,
}) {
  console.log(`\nJPEG folder: ${jpgDir}`);
  console.log(`RAW folder:  ${rawDir}`);
  console.log(
    `\n📊 Found ${jpgFiles.length} JPEG(s) and ${rawFiles.length} RAW(s).`,
  );

  if (rawsToMove.length > 0) {
    console.log(`\n📂 ${rawsToMove.length} kept RAW file(s) will be moved:`);
    rawsToMove.forEach(({ src, dest }) => {
      console.log(`  📂 ${relative(rawDir, src)} → ${relative(jpgDir, dest)}`);
    });
  }

  if (unmatched.length === 0) {
    console.log("✅ No unmatched RAW files to delete.");
  } else {
    console.log(
      `\n🗑  ${unmatched.length} unmatched RAW file(s) will be deleted:`,
    );
    unmatched.forEach((f) => console.log(`  🗑  ${relative(rawDir, f)}`));
  }
}
