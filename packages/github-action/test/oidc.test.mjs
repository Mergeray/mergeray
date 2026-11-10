import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sameRepoCredential, requestGitHubIdToken } from "../dist/oidc.js";
test("same-repo requests exact audience, masks token; fork never invokes token provider", async () => {
  let calls = 0;
  const secrets = [];
  const get = async (audience) => {
    calls++;
    assert.equal(audience, "expected");
    return "synthetic-oidc";
  };
  assert.deepEqual(
    await sameRepoCredential({ fork: false }, "expected", get, (token) =>
      secrets.push(token),
    ),
    { token: "synthetic-oidc", forkAuthorized: false },
  );
  assert.equal(
    await sameRepoCredential({ fork: true }, "expected", get, () => {}),
    undefined,
  );
  assert.equal(calls, 1);
  assert.deepEqual(secrets, ["synthetic-oidc"]);
});
test("OIDC failure has no static service credential fallback", async () => {
  const prior = process.env.INPUT_SERVICE_TOKEN;
  process.env.INPUT_SERVICE_TOKEN = "must-not-use";
  try {
    assert.equal(
      await sameRepoCredential(
        { fork: false },
        "expected",
        async () => {
          throw new Error("raw-secret");
        },
        () => {},
      ),
      undefined,
    );
    assert.doesNotMatch(
      readFileSync(new URL("../src/entrypoint.ts", import.meta.url), "utf8"),
      /service-token|serviceToken|getIDToken/,
    );
  } finally {
    if (prior === undefined) delete process.env.INPUT_SERVICE_TOKEN;
    else process.env.INPUT_SERVICE_TOKEN = prior;
  }
});
const env = {
  ACTIONS_ID_TOKEN_REQUEST_URL:
    "https://vstoken.actions.githubusercontent.com/token?api-version=1",
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: "runner-only",
};
test("runner OIDC transport is bounded and credential-separated", async () => {
  assert.equal(
    await requestGitHubIdToken("audience", env, async (url, init) => {
      assert.equal(new URL(url).searchParams.get("audience"), "audience");
      assert.ok(!url.includes("runner-only"));
      assert.equal(init.redirect, "error");
      assert.ok(init.signal);
      assert.equal(init.headers.authorization, "Bearer runner-only");
      return Response.json({ value: "signed-oidc" });
    }),
    "signed-oidc",
  );
  for (const response of [
    new Response("secret", { status: 302 }),
    new Response("x".repeat(32769)),
    Response.json({ value: 4 }),
  ]) {
    await assert.rejects(
      requestGitHubIdToken("a", env, async () => response),
      /^Error: ACCESS_UNAVAILABLE$/,
    );
  }
  await assert.rejects(
    requestGitHubIdToken(
      "a",
      { ...env, ACTIONS_ID_TOKEN_REQUEST_URL: "https://evil.invalid/token" },
      async () => {
        assert.fail("network");
      },
    ),
    /^Error: ACCESS_UNAVAILABLE$/,
  );
});

test("explicit custom audiences never cause credential fallback", async () => {
  for (const audience of [
    "urn:breaklint:source-service",
    "urn:mergeray:source-service",
  ]) {
    const calls = [];
    const get = async (value) => {
      calls.push(value);
      return "signed";
    };
    assert.ok(await sameRepoCredential({ fork: false }, audience, get, () => {}));
    assert.equal(
      await sameRepoCredential({ fork: true }, audience, get, () => {}),
      undefined,
    );
    assert.deepEqual(calls, [audience]);
  }
  for (const audience of [
    "*",
    "urn:*:source-service",
    "urn:mergeray:source-service?",
  ]) {
    assert.equal(
      await sameRepoCredential(
        { fork: false },
        audience,
        async () => assert.fail("must not request token"),
        () => {},
      ),
      undefined,
    );
  }
});

test("MergeRay 0.2.0 Action defaults use the exact MergeRay wire identities", async () => {
  const action = readFileSync(new URL("../action.yml", import.meta.url), "utf8");
  const endpoint = action.match(/service-url:[\s\S]*?default: (\S+)/)?.[1];
  const audience = action.match(/oidc-audience:[\s\S]*?default: (\S+)/)?.[1];
  assert.equal(endpoint, "https://source.mergeray.com");
  assert.equal(audience, "urn:mergeray:source-service");
  assert.match(action, /^name: MergeRay$/m);
  const calls = [];
  await sameRepoCredential(
    { fork: false },
    audience,
    (value) =>
      requestGitHubIdToken(value, env, async (url, init) => {
        calls.push(new URL(url).searchParams.get("audience"));
        assert.equal(init.redirect, "error");
        return Response.json({ value: "signed-oidc" });
      }),
    () => {},
  );
  assert.deepEqual(calls, ["urn:mergeray:source-service"]);
});
