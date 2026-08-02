/**
 * Bulk-replace common `any` patterns that fail next build eslint.
 * Run: node scripts/fix-explicit-any.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk("src");
let changed = 0;

for (const file of files) {
  let src = readFileSync(file, "utf8");
  const original = src;

  const needsUiTypes =
    /useState<any|:\s*any\b|as any|<any>|any\[\]/.test(src) &&
    !file.includes("types\\ui.ts") &&
    !file.includes("types/ui.ts");

  // State
  src = src.replace(/useState<any\[\]>/g, "useState<JsonRecord[]>");
  src = src.replace(/useState<any>/g, "useState<JsonRecord | null>");

  // Callback / param anys — common short names
  src = src.replace(
    /\(([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\)/g,
    "($1: JsonRecord)"
  );
  src = src.replace(
    /\(([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any,/g,
    "($1: JsonRecord,"
  );
  src = src.replace(/:\s*any\[\]/g, ": JsonRecord[]");
  src = src.replace(/payload:\s*any/g, "payload: JsonRecord");
  src = src.replace(/as any/g, "as JsonRecord");
  src = src.replace(/catch\s*\(\s*err\s*:\s*any\s*\)/g, "catch (err: unknown)");
  src = src.replace(/catch\s*\(\s*e\s*:\s*any\s*\)/g, "catch (e: unknown)");

  // Remaining bare `: any` (fields)
  src = src.replace(/:\s*any\b(?!\s*\()/g, ": JsonRecord");

  if (src === original) continue;

  if (needsUiTypes && !src.includes("@/types/ui")) {
    if (src.startsWith('"use client"') || src.startsWith("'use client'")) {
      src = src.replace(
        /("use client"|'use client');?\r?\n/,
        (m) => `${m}import type { JsonRecord } from "@/types/ui";\n`
      );
    } else if (src.includes("from ")) {
      // insert after first import block start
      const idx = src.indexOf("import ");
      if (idx >= 0) {
        src =
          src.slice(0, idx) +
          `import type { JsonRecord } from "@/types/ui";\n` +
          src.slice(idx);
      }
    } else {
      src = `import type { JsonRecord } from "@/types/ui";\n` + src;
    }
  }

  // Dedupe import if script ran twice
  src = src.replace(
    /(import type \{ JsonRecord \} from "@\/types\/ui";\r?\n){2,}/g,
    'import type { JsonRecord } from "@/types/ui";\n'
  );

  writeFileSync(file, src);
  changed++;
  console.log("fixed", file);
}

console.log(`Updated ${changed} files`);
