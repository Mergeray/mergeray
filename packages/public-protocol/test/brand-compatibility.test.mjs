import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixtures.mjs";
import { policyDigest, requestDigest, manifestDigest } from "../dist/internal.js";

test("Breaklint 0.1.0 golden digests remain compatible with MergeRay protocol 1.0", () => {
  const f = fixture();
  assert.equal(
    policyDigest(f.request.policy),
    "80bb4509fb008b60b8eed43cdd28052ce34fa0b3acbdf1fb474a3181a0351d38",
  );
  assert.equal(
    requestDigest(f.request),
    "6e4aa34dcec5825ef9f101324070ccc9f15eeaf5cf36f597b83d13c0279165ae",
  );
  assert.equal(
    manifestDigest(f.manifest),
    "f8afc6206e01021c7d35e66f6dea2bd0a815179e9831fe4783170ccab335e7c4",
  );
});
