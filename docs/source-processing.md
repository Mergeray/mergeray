# Source processing

This document describes the MergeRay public v1 source-review service. Source
content is processed only for MergeRay analysis and service operation. Submitted
source is not used for AI or model training. User data and source are not sold or
used for advertising. The public v1 source-review path does not call an AI/model
service and does not require executing the customer's application.

## Do you keep my private code?

Public and private source reviews process your code temporarily for analysis.
MergeRay does not maintain a permanent copy of your codebase or reuse a raw
source cache between reviews. Processing uses memory and temporary analysis
storage, so this does not mean code is never stored.

Source cleanup and result retention are separate:

- Source buffers are cleared when a review completes, fails, is cancelled or
  times out. Temporary files are removed as execution finishes; after a crash,
  recovery removes the service's leftovers when it restarts.
- Results and request metadata have a 24-hour replay window. That window does
  not require keeping raw source and is not an exact physical deletion deadline.
- GitHub Checks and job summaries follow GitHub's own access and retention
  settings. Removing a MergeRay record does not remove published GitHub output.

The sections below describe what is transferred, what can remain and the
cleanup limits. This describes the current implementation; production storage
and recovery configuration still require deployment verification before launch.

## What is submitted

The public CLI and GitHub Action prepare a bounded package of committed source at
exact revisions. It includes selected source files, relative paths, content digests,
revision identifiers, a source manifest and bounded Git objects used to establish
revision relationships and file membership. A request also carries repository and
request identities and the analysis policy. Uncommitted working-tree edits are not
part of the comparison. See [selection and limits](known-limitations.md).

Git tree and commit metadata can reveal file names (including excluded-file names),
authors and commit messages even when a file's source body is excluded. Selection
and secret screening are bounded safeguards, not a guarantee that submitted
content or metadata contains no sensitive information. Transfer only repositories
and data you are authorized to submit.

## Authentication and purpose

Clients use authenticated HTTPS to the configured hosted MergeRay service. The
CLI requires a dedicated service credential. The GitHub Action uses short-lived
GitHub OIDC identity through an operator-registered trusted workflow; the separate
GitHub token permits provider context checks and result publication. Service
access must be provisioned and authorized for the repository and policy.
Installation of the clients does not itself grant service access.

Source is analyzed by the hosted private engine. Normal source review requires no
Chromium/browser installation, preview URL, customer application deployment,
application login or customer runtime environment. Source review does not establish
complete browser or CSS equivalence.

## Source content

Raw source bodies are processed in memory and temporary analysis storage. The
service does not maintain a persistent repository mirror or a cross-review raw
source cache. On completion, failure, cancellation or timeout, it clears its
managed upload buffers and admitted-source copies and releases their references.
The analysis workspace is removed as execution unwinds, including error paths.
Abandoned uploads time out without requiring another client request.

The upload window is 10 minutes from acceptance. A started review has an overall
deadline of 30 minutes from acceptance. These are processing limits, not promises
that all temporary or infrastructure copies are physically erased by that time.

On restart, the service acquires exclusive ownership of its record store before
removing leftovers from its own managed temporary workspace directory. Graceful
shutdown waits for active execution cleanup before releasing ownership. A process
crash can leave temporary files until recovery; unavailable storage can delay
cleanup. Source is therefore temporarily stored during processing. These controls
are not a promise of immediate or irreversible erasure of every runtime, operating
system or infrastructure copy.

## Provenance and request metadata

Run records may retain repository/request identities, revision identifiers,
policy, source manifests, digests and Git provenance descriptors for bounded replay,
idempotency and operational reliability. These records are distinct from raw
source bodies, but may still contain sensitive repository paths and commit metadata.

The current implementation has a **24-hour durable replay window**. Replay expiry
limits reuse of a run; it is not a guarantee of deletion at precisely 24 hours.
Expired durable records are removed during service startup, subsequent admission
and a maintenance sweep scheduled every minute while the service is running.
Physical removal can occur later than expiry if the service is stopped, busy or
unable to access its storage. The replay window does not require retaining raw
source bodies.

This window applies to accepted source-review run records. It does not define
retention for all workspace, account or billing data.

## Results

Validated results may be retained with the run for replay and reliable delivery.
They include outcomes, coverage, findings and source locations and may reveal
repository-sensitive information. Results must be handled according to the
repository's access needs even though they are sanitized to the public result
contract.

## GitHub-published output

The Action publishes a GitHub Check and job summary. Public v1 does not publish
inline PR review comments. Findings and source locations in these outputs become
accessible according to the destination repository's GitHub settings. GitHub's
own retention and access behavior applies to published Checks and summaries;
expiry of a MergeRay replay record does not delete GitHub output.

## Retention limits and policy changes

Normal cleanup is not a promise of immediate universal deletion, crash-proof
cleanup or irreversible erasure at a fixed instant. This document does not
establish a general user-facing deletion workflow, backup deletion schedule,
storage region, encryption-at-rest assurance or universal logging-retention
policy. Do not infer these properties from the replay window or HTTPS transport.

Future changes to processing purposes, data handling or these documented limits
will be recorded in this document and the repository's release notes. This is
product documentation, not a data processing agreement or privacy certification,
and it does not assert a legal-controller identity or corporate status.
