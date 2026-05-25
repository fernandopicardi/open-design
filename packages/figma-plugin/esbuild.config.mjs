// Bundles the plugin's main-thread entry (src/code.ts) into a single
// self-contained dist/code.js that the Figma sandbox loads. The contracts
// import is type-only and erased, so nothing from @open-design/contracts is
// pulled into the bundle. The UI (src/ui.html) is referenced directly by the
// manifest and needs no build step.
import { build } from "esbuild";

await build({
  bundle: true,
  entryPoints: ["./src/code.ts"],
  format: "iife",
  outfile: "./dist/code.js",
  platform: "browser",
  target: "es2017",
});
