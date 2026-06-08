import { existsSync } from "fs";
import { createInterface } from "readline";
import { buildPlan, printPlan } from "./lib/plan.js";
import { executePlan } from "./lib/execution.js";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

function stripQuotes(str) {
  return str
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim();
}

async function promptPath(label) {
  const raw = await ask(`Enter full path to ${label} folder:\n> `);
  const path = stripQuotes(raw);
  if (!existsSync(path)) {
    console.error(`❌ ${label} folder not found!`);
    await ask("\nPress Enter to exit...");
    rl.close();
    process.exit(1);
  }
  return path;
}

async function promptYesNo(question) {
  const answer = await ask(question);
  return answer.trim().toLowerCase() === "y";
}

(async () => {
  console.log("=== RAW Cleanup Tool ===\n");

  const jpgPath = await promptPath("JPEG");
  const rawPath = await promptPath("RAW");

  const recursive = await promptYesNo("Process folders recursively? (y/N): ");

  const sameFolder = jpgPath.toLowerCase() === rawPath.toLowerCase();
  const moveToRawSubfolder =
    sameFolder &&
    (await promptYesNo("Move kept RAW files to a 'Raw' subfolder? (y/N): "));

  try {
    const plan = buildPlan(jpgPath, rawPath, moveToRawSubfolder, recursive);
    printPlan(plan);

    if (plan.rawsToMove.length > 0 || plan.unmatched.length > 0) {
      console.log("\n--------------------------------------------------");
      const confirmed = await promptYesNo(
        "⚠️  Proceed with these changes? (y/N): ",
      );

      if (confirmed) {
        const success = await executePlan(plan);
        console.log(
          success
            ? "\n🎉 Operation completed successfully!"
            : "\n⚠️  Operation completed with errors.",
        );
      } else {
        console.log("\n❌ Cancelled. No files were modified.");
      }
    } else {
      console.log("\n🎉 Nothing to clean up. Operation completed!");
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }

  await ask("\nPress Enter to close this window...");
  rl.close();
  process.exit(0);
})();
