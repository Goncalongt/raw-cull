import { join, extname } from "path";
import { readdirSync } from "fs";

export function getFiles(dir, extensions, recursive = false) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...getFiles(fullPath, extensions, true));
    } else if (
      entry.isFile() &&
      extensions.includes(extname(entry.name).toLowerCase())
    ) {
      files.push(fullPath);
    }
  }

  return files;
}
