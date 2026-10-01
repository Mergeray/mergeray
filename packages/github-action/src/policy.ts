import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { projectPolicy } from "@mergeray/public-config";
const execute = promisify(execFile);
/** Only declarative policy at exact trusted Base. Never import checkout configuration.
 * A present but invalid canonical policy must fail, never fall back to legacy. */
export async function readBasePolicy(repositoryRoot: string, base: string) {
  if (!/^[a-f0-9]{40}$/.test(base)) throw new Error("INVALID_CONTEXT");
  const git = async (...args: string[]) =>
    (
      await execute(
        "git",
        ["--no-replace-objects", "-c", "core.hooksPath=/dev/null", ...args],
        {
          cwd: repositoryRoot,
          maxBuffer: 262144,
          timeout: 30000,
          env: {
            PATH: process.env["PATH"],
            GIT_CONFIG_NOSYSTEM: "1",
            GIT_CONFIG_GLOBAL: "/dev/null",
            GIT_TERMINAL_PROMPT: "0",
          },
        },
      )
    ).stdout;
  for (const file of ["mergeray.policy.json", "breaklint.policy.json"]) {
    const entry = await git("ls-tree", base, "--", file);
    if (!entry) continue;
    if (
      !/^100644 blob [a-f0-9]{40}\t[^\n]+\n$/.test(entry) ||
      entry.split("\t")[1] !== `${file}\n`
    )
      throw new Error("INVALID_POLICY");
    return projectPolicy(await git("show", `${base}:${file}`));
  }
  return projectPolicy();
}
