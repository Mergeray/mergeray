# @mergeray/hosted-client

Authenticated client and committed-source packaging for MergeRay.

Version 0.2.0. See the [repository README](https://github.com/Mergeray/mergeray#readme)
for supported usage and hosted service access requirements.

Copyright © 2026 MergeRay. Licensed under Apache-2.0; see LICENSE.md and NOTICE.
Third-party and Unicode notices accompany this package.

Omitting `endpoint` uses `https://source.mergeray.com`, the hosted MergeRay service. Explicit HTTPS overrides remain supported;
empty or invalid values fail closed. Authenticated requests never follow redirects.
