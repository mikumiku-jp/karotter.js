import { readdir, rename, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

const root = "dist/cjs";
const files = await walk(root);

for (const file of files) {
  if (file.endsWith(".js")) {
    const next = file.replace(/\.js$/, ".cjs");
    let src = await readFile(file, "utf8");
    src = src.replace(/require\("(\.\.?\/[^"]+?)\.js"\)/g, 'require("$1.cjs")');
    src = src.replace(/require\("(\.\.?\/[^"]+?)"\)/g, (_match, p) => {
      if (p.endsWith(".cjs") || p.endsWith(".json")) return `require("${p}")`;
      return `require("${p}.cjs")`;
    });
    await writeFile(file, src);
    await rename(file, next);
  } else if (file.endsWith(".js.map")) {
    const next = file.replace(/\.js\.map$/, ".cjs.map");
    await rename(file, next);
  }
}
