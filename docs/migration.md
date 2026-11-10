# Breaklint is now MergeRay

Breaklint 0.1.0 → MergeRay 0.2.0 is one product lineage. This is a rename, with
no acquisition or ownership change. The canonical repository will be
[Mergeray/mergeray](https://github.com/Mergeray/mergeray).

After 0.2.0 is published, install `mergeray@0.2.0` and run `mergeray`.
The other packages are `@mergeray/public-protocol`, `@mergeray/public-config` and
`@mergeray/hosted-client`. Update imports to that scope. There is no `breaklint`
executable alias in the new package. Existing `@breaklint/*@0.1.0` installs keep
working independently; neither unpublishing nor retagging is part of this migration.

Use `MERGERAY_TOKEN`. The CLI temporarily accepts `BREAKLINT_TOKEN` only when the
canonical variable is absent. An empty canonical variable fails authentication;
it never selects a different credential. No token or environment value is logged.
Use `mergeray.policy.json`; the Action accepts legacy `breaklint.policy.json` at
trusted Base only when the canonical file is absent. Both `.mergerayignore` and
`.breaklintignore` exclusions remain effective. CLI config stays explicit via
`--config`; TypeScript configuration is not executed.

The new Action lives at `Mergeray/mergeray/action@FULL_VERIFIED_COMMIT_SHA` and
publishes the Check named `MergeRay`. Update branch protection deliberately after
proving the new Check. New and legacy Actions use separate publication journals;
do not switch Action identity in the middle of a workflow rerun. Start a fresh
workflow run when migrating. The operator must register the exact immutable
trusted workflow, repository ID and owner ID before use, preserving all existing
0.1.0 registrations. Do not substitute old Action pins into a new registration.

For MergeRay 0.2.0, the CLI, Action and hosted client default to
`https://source.mergeray.com`, and the Action requests exactly
`urn:mergeray:source-service`. The retired Breaklint 0.1.0 endpoint
(`source.breaklint.com`) is not served by MergeRay; legacy `breaklint/breaklint`
Action pins are not supported by the MergeRay service.

The service accepts one exact configured audience, with no wildcard or audience
array support. Authenticated requests reject redirects, and there is no automatic
retry against another hostname or audience. Explicit endpoint and exact audience
overrides still require matching operator authorization.

A future dual-host/audience migration is deferred to separate owner approval,
provisioning and acceptance checks. It must preserve direct legacy service routing
and isolate each exact audience and registration boundary; it is not a prerequisite
for this release.

Protocol 1.0 schemas, JCS behavior and the `breaklint-analysis-policy-1`,
`breaklint-transfer-policy-1`, `breaklint-source-package-1`, and
`breaklint-analysis-request-1` digest domains remain byte-compatible. These legacy
wire identifiers are compatibility requirements, not current display branding.
The package version changes to 0.2.0 without a cosmetic wire-schema version change.
