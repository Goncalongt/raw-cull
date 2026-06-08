import { IS_WINDOWS } from "../../constants.js";
import { trashFiles as trashFilesMac, moveFile as moveFileMac } from "./mac.js";
import {
  trashFiles as trashFilesWindows,
  moveFile as moveFileWindows,
} from "./windows.js";

export const trashFiles = IS_WINDOWS ? trashFilesWindows : trashFilesMac;
export const moveFile = IS_WINDOWS ? moveFileWindows : moveFileMac;
