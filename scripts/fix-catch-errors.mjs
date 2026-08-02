import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk("src");
let n = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  const orig = src;

  // err?.response?.data?.message || "..."
  src = src.replace(
    /(\berr|\be)\?\.response\?\.data\?\.message\s*\|\|\s*("([^"]*)"|'([^']*)')/g,
    'apiErrorMessage($1, $2)'
  );

  if (src !== orig) {
    if (!src.includes("apiErrorMessage")) {
      if (src.includes('from "@/types/ui"')) {
        src = src.replace(
          /import type \{ JsonRecord \} from "@\/types\/ui";/,
          'import type { JsonRecord } from "@/types/ui";\nimport { apiErrorMessage } from "@/types/ui";'
        );
      } else if (src.startsWith('"use client"') || src.startsWith("'use client'")) {
        src = src.replace(
          /("use client"|'use client');?\r?\n/,
          `$1;\nimport { apiErrorMessage } from "@/types/ui";\n`
        );
      } else {
        src = `import { apiErrorMessage } from "@/types/ui";\n` + src;
      }
    } else if (
      src.includes("import type { JsonRecord }") &&
      !src.includes("apiErrorMessage } from")
    ) {
      src = src.replace(
        /import type \{ JsonRecord \} from "@\/types\/ui";/,
        'import { apiErrorMessage, type JsonRecord } from "@/types/ui";'
      );
    }
    // merge duplicate imports from ui
    src = src.replace(
      /import type \{ JsonRecord \} from "@\/types\/ui";\r?\nimport \{ apiErrorMessage \} from "@\/types\/ui";/g,
      'import { apiErrorMessage, type JsonRecord } from "@/types/ui";'
    );
    writeFileSync(file, src);
    n++;
    console.log("fixed", file);
  }
}
console.log("done", n);
