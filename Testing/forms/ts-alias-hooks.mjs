// Lets a Node test script import app modules that use the Next.js "@/..." alias
// and extensionless relative imports. Node 24 strips the TypeScript itself.
// Usage: node --import ./Testing/forms/ts-alias-hooks.mjs <test>.ts
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), "src");

function resolveSource(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (/\.(ts|tsx|js|mjs)$/.test(candidate) && existsSync(candidate)) return candidate;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base = null;
    if (specifier.startsWith("@/")) {
      base = join(SRC, specifier.slice(2));
    } else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith("file:")) {
      base = fileURLToPath(new URL(specifier, context.parentURL));
    }
    const file = base && resolveSource(base);
    return nextResolve(file ? pathToFileURL(file).href : specifier, context);
  },
});
