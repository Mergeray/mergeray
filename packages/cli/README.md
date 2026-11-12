# mergeray

Responsive layout review for pull requests, from source. The CLI submits committed
source revisions to the hosted MergeRay service and returns findings, source
locations and explicit coverage.

```sh
npm install --global mergeray
export MERGERAY_TOKEN=<your CLI token>
mergeray --base BASE_COMMIT --head HEAD_COMMIT --repository YOUR_REPOSITORY_ID --json
```

- Needs a personal CLI token from the dashboard (Manage → CLI tokens) and a Pro seat.
  Public repositories can use the GitHub workflow instead, which needs no token.
- Node 22.14.0 or 24.21.0 and Git. The command transfers source; uncommitted files
  are not reviewed. Installing the package does not grant hosted access.
- Website: https://www.mergeray.com · Docs: https://www.mergeray.com/docs

Full guide, GitHub workflow and supported scope:
[github.com/Mergeray/mergeray](https://github.com/Mergeray/mergeray#readme).

Copyright © 2026 MergeRay. Licensed under Apache-2.0; see LICENSE.md and NOTICE.
Third-party and Unicode notices accompany this package.
