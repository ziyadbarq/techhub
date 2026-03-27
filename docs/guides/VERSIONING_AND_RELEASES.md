# Versioning And Releases

This repository now uses CI-calculated semantic versions for deployed builds.

The goal is to avoid noisy `package.json` version churn on every feature branch while still producing meaningful release versions on the health page and in image tags.

## Summary

- Developers and AI agents do not bump `package.json` for normal feature work.
- Commit messages must follow the conventional commit format.
- CI calculates the next release version from Git tags plus commit history.
- Successful `main` deployments create the next `vX.Y.Z` Git tag automatically.
- The health page shows the calculated release version plus immutable build metadata.

## Why not a pre-commit version bump

Do not auto-edit versions in `pre-commit`.

That approach is noisy and unreliable because:

- one branch may contain many commits but should only produce one release version
- a hook cannot infer major/minor/patch confidently from file diffs
- auto-editing `package.json` and `package-lock.json` during commits causes merge churn
- squash merges and rebases make commit-level version bumps misleading

The correct enforcement point is:

1. validate commit message shape locally
2. calculate the version in CI
3. tag the release on `main`

## Conventional commit policy

The `commit-msg` hook uses `commitlint` with the conventional commit format.

Examples:

```text
feat: add OCI sync dashboard filters
fix: handle empty maintenance schedule state
refactor: simplify worker status aggregation
docs: document GitLab CLI setup
```

### Version bump rules

CI maps commit types to semantic version bumps:

- `feat:` -> `minor`
- `fix:` -> `patch`
- `perf:` -> `patch`
- `refactor:` -> `patch`
- `revert:` -> `patch`
- `type(scope)!:` or `BREAKING CHANGE:` -> `major`
- `docs:`, `test:`, `chore:`, `build:`, `ci:`, `style:` -> no version bump

## Bootstrap behavior

This repo did not previously maintain release tags consistently.

Because of that, the new automation starts with a bootstrap rule:

- if no `vX.Y.Z` tag exists yet, CI uses the current `package.json` version as the baseline
- the first successful `main` deployment after this rollout creates the bootstrap tag

With the current baseline, that first bootstrap tag is expected to be:

```text
v1.0.0
```

After that, all future versions are calculated from the latest reachable release tag.

## Local commands

Preview the version CI would calculate from the current Git state:

```bash
git fetch --tags --force
npm run version:preview
```

JSON output for scripts or inspection:

```bash
npm run version:preview:json
```

Shell env output:

```bash
npm run version:preview:env
```

## CI behavior

The build pipeline now does three release-related things:

1. fetches Git tags and full enough history for version calculation
2. computes `APP_VERSION` from tags plus conventional commits
3. bakes metadata into the Docker image:
   - release version
   - short commit
   - full commit SHA
   - Git ref
   - build date
   - image tag
   - pipeline ID
   - pipeline URL
   - project URL

For successful `main` deployments, CI then creates and pushes the next release tag if:

- no release tag exists yet and bootstrap is required
- or the commit range since the latest tag requires a `patch`, `minor`, or `major` bump

## Health page fields

The `/health` page now distinguishes release identity from build identity:

- `Release Version`: CI-calculated semver
- `Build ID`: image tag
- `Git Ref`: branch or tag used for the build
- `Git Commit`: short SHA with link to GitLab when available
- `Pipeline`: pipeline number with link to GitLab when available
- `Built At`: human-readable timestamp plus raw UTC timestamp

## Developer workflow

For normal work:

1. make code changes
2. commit using conventional commits
3. push branch and open MR
4. let CI calculate the deployed version on `main`

Do not:

- run `npm version patch|minor|major` for routine app changes
- manually edit the `version` field in `package.json`
- add version-only commits on feature branches

## When to change `package.json` version manually

Almost never.

Treat `package.json` version as the bootstrap baseline, not the routine release knob.

Only change it intentionally if you are resetting the release baseline strategy and coordinating that change with CI and tags.
