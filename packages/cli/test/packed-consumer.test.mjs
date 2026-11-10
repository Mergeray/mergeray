import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  cpSync,
  rmSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const root = resolve(import.meta.dirname, "../../..");
test("packed CLI runs in a consumer with zero private engine dependencies", () => {
  const directory = mkdtempSync(join(tmpdir(), "mergeray-public-consumer-"));
  try {
    for (const name of ["public-protocol", "public-config", "hosted-client", "cli"]) {
      const tar = join(directory, name + ".tgz");
      execFileSync("pnpm", ["pack", "--out", tar], {
        cwd: join(root, "packages", name),
        stdio: "pipe",
      });
      const dest = join(
        directory,
        "node_modules",
        name === "cli" ? "mergeray" : "@mergeray/" + name,
      );
      mkdirSync(dest, { recursive: true });
      execFileSync("tar", ["-xzf", tar, "--strip-components=1", "-C", dest]);
    }
    for (const name of ["zod", "ignore", "commander"]) {
      const owner =
        name === "zod"
          ? "public-protocol"
          : name === "ignore"
            ? "hosted-client"
            : "cli";
      const ownerRequire = createRequire(join(root, "packages", owner, "package.json"));
      let resolved = ownerRequire.resolve(name);
      while (
        !readdirSync((resolved = resolve(resolved, ".."))).includes("package.json")
      ) {
        /* nearest package */
      }
      // Zod's entry can be nested below its package root.
      while (
        JSON.parse(readFileSync(join(resolved, "package.json"), "utf8")).name !== name
      )
        resolved = resolve(resolved, "..");
      cpSync(resolved, join(directory, "node_modules", name), {
        recursive: true,
        dereference: true,
      });
    }
    const cli = join(directory, "node_modules/mergeray/bin/mergeray.js");
    const help = execFileSync(process.execPath, [cli, "--help"], {
      cwd: directory,
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    });
    assert.match(help, /Usage: mergeray/);
    assert.match(help, /--base/);
    assert.ok(help.includes("https://source.mergeray.com"));
    assert.deepEqual(
      Object.keys(
        JSON.parse(
          readFileSync(join(directory, "node_modules/mergeray/package.json"), "utf8"),
        ).bin,
      ),
      ["mergeray"],
    );
    assert.doesNotMatch(help, /Chromium|preview|headed|baseUrl/);
    const inspect = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import * as cli from 'mergeray'; console.log(Object.keys(cli).sort().join(','));",
      ],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(inspect.trim(), "defineConfig,projectPolicy");
    assert.deepEqual(readdirSync(join(directory, "node_modules/@mergeray")).sort(), [
      "hosted-client",
      "public-config",
      "public-protocol",
    ]);
    const packedManifest = JSON.parse(
      readFileSync(join(directory, "node_modules/mergeray/package.json"), "utf8"),
    );
    assert.equal(packedManifest.name, "mergeray");
    const consumerRequire = createRequire(join(directory, "consumer.cjs"));
    assert.throws(() => consumerRequire.resolve("@mergeray/cli"));
    assert.throws(() => consumerRequire.resolve("mergeray/dist/cli.js"), {
      code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
    });
    assert.throws(() => consumerRequire.resolve("@mergeray/core"));
    writeFileSync(join(directory, "package.json"), JSON.stringify({ type: "module" }));
    // Exercise committed packaging and the CLI terminal/exit path through a bounded
    // synthetic service response, entirely outside the proprietary workspace.
    execFileSync("git", ["init", "-q"], { cwd: directory });
    execFileSync("git", ["config", "user.name", "Synthetic"], { cwd: directory });
    execFileSync("git", ["config", "user.email", "synthetic@example.invalid"], {
      cwd: directory,
    });
    writeFileSync(
      join(directory, "App.tsx"),
      "export function App(){return <div>Hello</div>}\n",
    );
    execFileSync("git", ["add", "App.tsx"], { cwd: directory });
    execFileSync("git", ["commit", "-qm", "base"], { cwd: directory });
    const base = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: directory,
      encoding: "utf8",
    }).trim();
    execFileSync("git", ["commit", "--allow-empty", "-qm", "head"], { cwd: directory });
    writeFileSync(
      join(directory, "transport.mjs"),
      `
import {CAPABILITIES} from '@mergeray/hosted-client';
import {requestDigest,RULE_IDS} from '@mergeray/public-protocol/internal';
globalThis.fetch=async (url,init)=>{
 if(new URL(url).origin !== (process.env.EXPECTED_ORIGIN ?? "https://fixture.invalid")) throw new Error("wrong service origin");
 if(init.redirect !== "error") throw new Error("redirects must fail");
 if(process.env.EXPECTED_TOKEN && init.headers.authorization !== "Bearer " + process.env.EXPECTED_TOKEN) throw new Error("wrong credential precedence");
 if(init.headers["user-agent"] !== "mergeray/0.2.1") throw new Error("wrong client identity");
 if(process.env.TEST_INTERRUPT==='1'){process.emit('SIGINT');return new Response(JSON.stringify({errorSchemaVersion:'1.0',code:'UNAUTHENTICATED',retry:'never'}),{status:401});}
 if(new URL(url).pathname==='/capabilities')return new Response(JSON.stringify({versions:[CAPABILITIES]}));
 const {request:q}=JSON.parse(init.body);const acceptedAt=new Date().toISOString().replace(/\\.\\d{3}Z$/,'Z');const t=Date.parse(acceptedAt);const iso=n=>new Date(n).toISOString().replace('.000Z','Z');
 return new Response(JSON.stringify({missingBlobs:[],result:{protocolVersion:'1.0',resultSchemaVersion:'1.0',runId:'synthetic',binding:{requestId:q.requestId,requestDigest:requestDigest(q),manifestDigest:q.source.manifestDigest,policyDigest:q.policyDigest,repository:q.repository,requested:{base:q.comparison.base,rawHead:q.comparison.rawHead}},acceptedAt,deadlineAt:iso(t+1800000),idempotencyExpiresAt:iso(t+86400000),state:'terminal',completedAt:acceptedAt,outcome:{status:'complete',conclusion:'pass',reason:'NO_GATING_FINDINGS'},provenance:{state:'verified',method:'descendant',association:'client-submitted',base:q.comparison.base,effectiveHead:q.comparison.rawHead},analyzed:{base:q.comparison.base,effectiveHead:q.comparison.rawHead},scope:{declared:q.policy.scope,coverage:'complete',enabledRules:RULE_IDS,baseFilesAnalyzed:1,effectiveHeadFilesAnalyzed:1},findings:[],findingsComplete:true,limitations:[]}}));
};`,
    );
    const args = [
      "--import",
      join(directory, "transport.mjs"),
      cli,
      "--base",
      base,
      "--repository",
      "synthetic",
      "--service",
      "https://fixture.invalid",
      "--json",
    ];
    for (const env of [
      { MERGERAY_TOKEN: "canonical", EXPECTED_TOKEN: "canonical" },
      { BREAKLINT_TOKEN: "legacy", EXPECTED_TOKEN: "legacy" },
      {
        MERGERAY_TOKEN: "canonical",
        BREAKLINT_TOKEN: "legacy",
        EXPECTED_TOKEN: "canonical",
      },
    ]) {
      const output = execFileSync(process.execPath, args, {
        cwd: directory,
        encoding: "utf8",
        env: { PATH: process.env.PATH, ...env },
      });
      assert.equal(JSON.parse(output).outcome.conclusion, "pass");
    }
    const defaultArgs = args.filter(
      (arg) => !["--service", "https://fixture.invalid"].includes(arg),
    );
    const defaultOutput = execFileSync(process.execPath, defaultArgs, {
      cwd: directory,
      encoding: "utf8",
      env: {
        PATH: process.env.PATH,
        MERGERAY_TOKEN: "synthetic",
        EXPECTED_ORIGIN: "https://source.mergeray.com",
      },
    });
    assert.equal(JSON.parse(defaultOutput).outcome.conclusion, "pass");
    assert.throws(
      () =>
        execFileSync(process.execPath, args, {
          cwd: directory,
          encoding: "utf8",
          stdio: "pipe",
          env: {
            PATH: process.env.PATH,
            MERGERAY_TOKEN: "",
            BREAKLINT_TOKEN: "legacy",
          },
        }),
      (error) => error.status === 3 && error.stderr.trim() === "UNAUTHENTICATED",
    );
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            "--import",
            join(directory, "transport.mjs"),
            cli,
            "--base",
            base,
            "--repository",
            "synthetic",
            "--service",
            "https://fixture.invalid",
          ],
          {
            cwd: directory,
            encoding: "utf8",
            stdio: "pipe",
            env: {
              PATH: process.env.PATH,
              MERGERAY_TOKEN: "synthetic",
              TEST_INTERRUPT: "1",
            },
          },
        ),
      (error) => error.status === 130 && error.stderr.includes("UNAUTHENTICATED"),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
