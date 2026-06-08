import { existsSync, mkdirSync } from "fs";
import { join, relative, dirname } from "path";
import { trashFiles, moveFile } from "./platform/index.js";

async function moveRawsToSubfolder(rawsToMove, rawDir, rawSubfolderPath) {
  if (rawsToMove.length === 0) return true;
  try {
    await Promise.all(
      rawsToMove.map((f) => {
        const dest = join(rawSubfolderPath, relative(rawDir, f));
        const destDir = dirname(dest);
        if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
        return moveFile(f, dest);
      }),
    );
    console.log(`✅ Moved ${rawsToMove.length} kept RAW file(s) to subfolder.`);
    return true;
  } catch (e) {
    console.error(`❌ Move failed:`, e.message);
    return false;
  }
}

async function deleteUnmatchedRaws(unmatched) {
  if (unmatched.length === 0) return true;
  try {
    await trashFiles(unmatched);
    console.log(`✅ Deleted ${unmatched.length} unmatched RAW file(s).`);
    return true;
  } catch (e) {
    console.error(`❌ Deletion failed:`, e.message);
    return false;
  }
}

export async function executePlan({
  rawsToMove,
  unmatched,
  rawDir,
  rawSubfolderPath,
}) {
  if (rawSubfolderPath && !existsSync(rawSubfolderPath)) {
    mkdirSync(rawSubfolderPath, { recursive: true });
  }
  const moveOk = await moveRawsToSubfolder(
    rawsToMove,
    rawDir,
    rawSubfolderPath,
  );
  const deleteOk = await deleteUnmatchedRaws(unmatched);
  return moveOk && deleteOk;
}
