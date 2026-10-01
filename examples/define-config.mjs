import { writeFile } from "node:fs/promises";
import { defineConfig } from "@mergeray/public-config";
const config = defineConfig({
  gate: { changes: "introduced-or-worsened", minimumSeverity: "warning" },
});
await writeFile("mergeray.policy.json", JSON.stringify(config, null, 2) + "\n");
