import { test } from "node:test";
import assert from "node:assert/strict";
import { revisionIgnoreMatcher } from "../dist/revision-selection.js";

test("canonical and legacy immutable exclusions combine without relaxing privacy", () => {
  const ignored = revisionIgnoreMatcher([
    { path: ".gitignore", contents: "git.css" },
    { path: ".breaklintignore", contents: "legacy.css\n!important.css" },
    { path: ".mergerayignore", contents: "canonical.css\n!legacy.css\nimportant.css" },
    { path: "nested/.mergerayignore", contents: "scoped.css" },
  ]);
  for (const path of [
    "git.css",
    "legacy.css",
    "canonical.css",
    "important.css",
    "nested/scoped.css",
  ])
    assert.equal(ignored(path), true, path);
  assert.equal(ignored("scoped.css"), false);
  assert.equal(ignored("included.css"), false);
});
