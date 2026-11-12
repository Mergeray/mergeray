# MergeRay

**Small diff. Bigger impact.** MergeRay reviews pull requests for responsive layout
breaks (the horizontal overflow, the collapsed column, the card that does not fit
at 320px) and traces each finding to the source line, with evidence in a GitHub Check.

[![npm](https://img.shields.io/npm/v/mergeray)](https://www.npmjs.com/package/mergeray)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE.md)

- **From source.** No browser, preview deployment, application login or runtime
  environment is needed. MergeRay analyzes the committed source of React, Next.js and
  CSS changes.
- **Honest coverage.** Results state what was and was not analyzed. Empty findings
  do not mean clean unless coverage is complete.
- **Free for public repositories.** Private repositories need a Pro plan; billing is
  not open yet (private beta).

Website and dashboard: **[mergeray.com](https://www.mergeray.com)** ·
[Docs](https://www.mergeray.com/docs) · [Pricing](https://www.mergeray.com/pricing)

> Formerly Breaklint. Breaklint 0.1.0 → MergeRay is one product lineage, with no
> acquisition or ownership change. See [migration](docs/migration.md).

## Quick start (public repository, about five minutes)

1. Sign in at [mergeray.com](https://www.mergeray.com) with GitHub and create a workspace.
2. Install the [MergeRay GitHub App](https://github.com/apps/mergeray) on your
   repository and create a project for it in the dashboard.
3. Commit this file to your default branch as `.github/workflows/mergeray.yml`. It
   calls MergeRay's reviewed workflow, pinned to a full commit, and authenticates with
   GitHub OIDC, so there is no token or secret to add:

   ```yaml
   name: MergeRay
   on:
     pull_request:
       branches: [main]
   permissions: {}
   jobs:
     review:
       permissions:
         id-token: write
         contents: read
         actions: read
         pull-requests: write
         checks: write
       uses: Mergeray/review-workflow/.github/workflows/mergeray-review.yml@9d946eea8e52111278cede59d4427df5249e952f
   ```

4. Open a pull request from a branch of the same repository. The result appears as a
   GitHub Check on the pull request and in your dashboard. A finding that can be
   pinned to an exact changed line is also posted as an inline review comment.

Keep the file name, the pinned commit and the permissions exactly as shown. Pull
requests from forks are not reviewed. See the [Action guide](docs/github-action.md)
and [CI security](docs/ci-security.md).

## Public v1 support

| Area                                                                    | Scope                                                                             |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| React / Next.js                                                         | Bounded source review; framework recognition does not establish complete coverage |
| Authored CSS, CSS Modules, literal inline styles                        | Supported within modeled Width, Flex and Grid semantics                           |
| Unresolved conditions, source/style influence, component/prop semantics | Abstains where evidence cannot establish behavior                                 |
| Dynamic content and intrinsic dimensions                                | Abstains where dimensions cannot be proven                                        |
| Tailwind / framework themes                                             | Limited; complete theme semantics are unsupported                                 |
| Typography and arbitrary runtime styles                                 | Intrinsic text measurement and browser-equivalent behavior are unsupported        |
| GitHub delivery                                                         | Check and job summary; inline comments only for findings pinned to a changed line |

Empty findings do not mean clean unless analysis is complete. Unsupported or
indeterminate input remains inconclusive; proven blocking findings may still fail
a limited review. Runtime visual testing, AI review and automatic repair are
outside public v1.

## Use the CLI

The CLI submits committed source from your machine or from a coding agent. It needs a
personal CLI token (dashboard → Manage → CLI tokens) and a Pro seat, so it is not
available until billing opens. The public GitHub workflow above needs neither.

```sh
npm install --global mergeray
mergeray --help
```

```sh
export MERGERAY_TOKEN=<your CLI token>
mergeray --base BASE_COMMIT --head HEAD_COMMIT \
  --repository YOUR_REPOSITORY_ID --json
```

Requires Git and Node 22.14.0 or 24.21.0 (the exact tested versions). The command
transfers source and is not a dry run; uncommitted files are not reviewed. Installing
the package does not grant hosted access. The CLI sends a bounded, immutable
source/revision package over HTTPS to the private hosted engine, which is proprietary
and not included in this repository. See the [CLI reference](docs/cli.md) and the
[config reference](docs/config.md).

Source content is processed for analysis and service operation and is not used for
model training, advertising or data sale. See [source processing](docs/source-processing.md)
for transient storage, retention and GitHub output handling.

Read [known limits](docs/known-limitations.md) before relying on a result.

## Develop

For a local checkout, use pnpm 11.9.0, run `pnpm install --frozen-lockfile` and
`pnpm build`, then `node packages/cli/bin/mergeray.js --help`.

`pnpm verify` builds, typechecks, lints, checks formatting, tests synthetic
public flows, installs packed artifacts in an empty consumer, and inspects the
Action bundle, dependencies and generated content. No hosted service credentials
are needed for these local tests. See [CONTRIBUTING.md](CONTRIBUTING.md),
[SECURITY.md](SECURITY.md), and [license](LICENSE.md).

## License and project

Copyright © 2026 MergeRay. First-party public code is licensed under
[Apache-2.0](LICENSE.md); see [NOTICE](NOTICE). Third-party dependencies and Unicode
data retain their own [notices](THIRD_PARTY_NOTICES.md) and [provenance](PROVENANCE.md).
This license covers the public clients and Action, not the hosted private engine.

The approved repository is [Mergeray/mergeray](https://github.com/Mergeray/mergeray).
Use [issues](https://github.com/Mergeray/mergeray/issues) for ordinary bugs and
[private vulnerability reporting](SECURITY.md) for security concerns.
