// Extends ts-alias-hooks.mjs so a Node test can import .tsx app modules (the
// react-pdf templates). Node strips TypeScript but not JSX, so .tsx files are
// transpiled with the repo's own TypeScript compiler; no new dependency.
// Usage: node --import ./Testing/forms/tsx-hooks.mjs <test>.ts
import "./ts-alias-hooks.mjs";
import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

registerHooks({
  load(url, context, nextLoad) {
    if (!url.startsWith("file:") || !url.endsWith(".tsx")) return nextLoad(url, context);
    const source = readFileSync(fileURLToPath(url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: fileURLToPath(url),
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        verbatimModuleSyntax: false,
      },
    });
    // react/jsx-runtime is CommonJS whose named exports Node cannot detect, so
    // take them off the default export instead.
    const source2 = outputText.replace(
      /import \{([^}]*)\} from "react\/jsx-runtime";/,
      (_, names) =>
        `import __jsxRuntime from "react/jsx-runtime"; const {${names.replace(/ as /g, ": ")}} = __jsxRuntime;`,
    );
    return { format: "module", source: source2, shortCircuit: true };
  },
});
