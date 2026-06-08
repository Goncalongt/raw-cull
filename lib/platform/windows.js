import { rename, copyFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { execSync } from "child_process";

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function escapeForPowerShell(filePath) {
  return filePath.replace(/'/g, "''");
}

export function trashFiles(paths) {
  for (const chunk of chunkArray(paths, 50)) {
    const targets = chunk.map((f) => `'${escapeForPowerShell(f)}'`).join(",");
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName Microsoft.VisualBasic; ${targets} | ForEach-Object { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($_, 'OnlyErrorDialogs', 'SendToRecycleBin') }"`,
      { stdio: "inherit" },
    );
  }
}

export async function moveFile(src, dest) {
  const destDir = dirname(dest);
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  try {
    await rename(src, dest);
  } catch (err) {
    if (err.code !== "EXDEV") throw err;
    await copyFile(src, dest);
    try {
      execSync(
        `powershell -NoProfile -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${escapeForPowerShell(src)}', 'OnlyErrorDialogs', 'SendToRecycleBin')"`,
        { stdio: "ignore" },
      );
    } catch {
      console.error(`  ✗  Failed to send original to Recycle Bin: ${src}`);
    }
  }
}
