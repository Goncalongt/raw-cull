import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, basename, extname } from "path";
import { homedir } from "os";

function escapeShell(str) {
  return str.replace(/'/g, "'\\''");
}

export function trashFiles(paths) {
  const trashDir = join(homedir(), ".Trash");
  for (const f of paths) {
    const base = basename(f, extname(f));
    const ext = extname(f);
    const dest = join(trashDir, basename(f));
    const finalDest = existsSync(dest)
      ? join(trashDir, `${base}_${Date.now()}${ext}`)
      : dest;
    execSync(`mv '${escapeShell(f)}' '${escapeShell(finalDest)}'`, {
      stdio: "ignore",
    });
  }
}

export function moveFile(src, dest) {
  execSync(`mv '${escapeShell(src)}' '${escapeShell(dest)}'`, {
    stdio: "ignore",
  });
}
