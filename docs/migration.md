# Breaklint is now MergeRay

Breaklint 0.1.0 → MergeRay 0.2.0 is one product lineage. This is a rename, with
no acquisition or ownership change. The canonical repository will be
[Mergeray/mergeray](https://github.com/Mergeray/mergeray).

After 0.2.0 is published, install `@mergeray/cli@0.2.0` and run `mergeray`.
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
workflow run when migrating. The new canonical OIDC audience is
`urn:mergeray:source-service`; the operator must register the exact immutable
trusted workflow, repository ID and owner ID before use. Do not substitute old
Action pins into a new workflow registration.

Legacy `breaklint/breaklint` immutable Action pins and `source.breaklint.com`
remain a separate compatibility path using the operator's exact old audience
`urn:breaklint:source-service`. The new client accepts an explicit HTTPS endpoint;
no MergeRay domain has been approved here. Authenticated requests reject redirects.
There is no automatic retry against another hostname or audience.

Protocol 1.0 schemas, JCS behavior and the `breaklint-analysis-policy-1`,
`breaklint-transfer-policy-1`, `breaklint-source-package-1`, and
`breaklint-analysis-request-1` digest domains remain byte-compatible. These legacy
wire identifiers are compatibility requirements, not current display branding.
The package version changes to 0.2.0 without a cosmetic wire-schema version change.
