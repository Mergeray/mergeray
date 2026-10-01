import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture } from "../../public-protocol/test/fixtures.mjs";
import {
  createHostedClient,
  validateHostedResponse,
  CAPABILITIES,
} from "../dist/index.js";
const prepared = (f) => ({
  request: f.request,
  sourcePackage: f.sourcePackage,
  bodies: f.bodies,
});
test("binding, undeclared uploads, immutable timestamps and terminal responses fail closed", async () => {
  const f = fixture(),
    p = prepared(f);
  assert.throws(() =>
    validateHostedResponse(
      { result: { ...f.result, runId: "other" }, missingBlobs: [] },
      p,
      "expected",
    ),
  );
  assert.throws(() =>
    validateHostedResponse({ result: f.result, missingBlobs: ["f".repeat(64)] }, p),
  );
  assert.throws(() =>
    validateHostedResponse(
      { result: { ...f.result, diagnostics: "private" }, missingBlobs: [] },
      p,
    ),
  );
  let calls = 0;
  const client = createHostedClient({
    endpoint: "https://example.invalid",
    token: "test",
    fetch: async () =>
      new Response(
        JSON.stringify(
          ++calls === 1
            ? { versions: [CAPABILITIES] }
            : calls === 2
              ? { result: f.result, missingBlobs: [] }
              : {
                  result: { ...f.result, completedAt: "2026-09-19T12:02:00Z" },
                  missingBlobs: [],
                },
        ),
      ),
  });
  await client.begin(p);
  await assert.rejects(client.read(p, f.result.runId), /INVALID_PAYLOAD/);
});
test("auth errors are bounded, never retried and never expose raw response text", async () => {
  const f = fixture();
  let calls = 0;
  const client = createHostedClient({
    endpoint: "https://example.invalid",
    token: "test",
    fetch: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          errorSchemaVersion: "1.0",
          code: "UNAUTHENTICATED",
          retry: "never",
        }),
        { status: 401 },
      );
    },
  });
  await assert.rejects(client.begin(prepared(f)), /UNAUTHENTICATED/);
  assert.equal(calls, 1);
  const malformed = createHostedClient({
    endpoint: "https://example.invalid",
    token: "test",
    fetch: async () => new Response("private stack /secret/file", { status: 500 }),
  });
  await assert.rejects(
    malformed.begin(prepared(f)),
    (error) => error.message === "INVALID_PAYLOAD",
  );
});
test("client refuses insecure endpoints before transmitting credentials", () => {
  for (const endpoint of [
    "",
    "http://example.invalid",
    "https://user:secret@example.invalid",
    "https://example.invalid/?token=secret",
  ])
    assert.throws(() => createHostedClient({ endpoint, token: "test" }));
});

test("default legacy wire origin and explicit origins are served directly without fallback", async () => {
  for (const endpoint of [
    undefined,
    "https://source.breaklint.com",
    "https://mergeray-service.example.invalid",
  ]) {
    const f = fixture();
    const paths = [];
    const client = createHostedClient({
      endpoint,
      token: "synthetic",
      fetch: async (url, init) => {
        const target = new URL(url);
        assert.equal(target.origin, endpoint ?? "https://source.breaklint.com");
        assert.equal(init.redirect, "error");
        assert.equal(init.headers["user-agent"], "mergeray/0.2.0");
        paths.push(target.pathname);
        return Response.json(
          target.pathname === "/capabilities"
            ? { versions: [CAPABILITIES] }
            : { result: f.result, missingBlobs: [] },
        );
      },
    });
    await client.begin(prepared(f));
    assert.deepEqual(paths, ["/capabilities", "/runs"]);
  }
});
