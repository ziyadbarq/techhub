# GitLab CLI on macOS

Set up and use the GitLab CLI (`glab`) on a Barq MacBook development environment for the internal GitLab instance.

## When to use this guide

Use this guide when you need to:

- install `glab` on macOS
- authenticate against `gitlab.dev.baraq.com.internal`
- create or manage merge requests from the terminal
- work safely in this repo's dual-remote setup (`origin` + `gitlab`)

## Repository context

This repository uses two remotes:

- `origin` -> GitHub backup: `https://github.com/azzuwayed/barq-assets.git`
- `gitlab` -> internal GitLab: `git@gitlab.dev.baraq.com.internal:baraq-engineering/webdev/techhub.git`

`gitlab` is the remote that triggers CI/CD and hosts merge requests.

Agent note:

- Codex can access the Barq VPN path in this environment and can work with the internal GitLab remote directly.
- Claude Code may be blocked from that network path, so its workflow may need to stop at local commits or rely on user-run GitLab commands.

## Prerequisites

Before using `glab`, make sure you have:

1. access to the Barq internal network or VPN
2. SSH access to the GitLab host
3. a GitLab personal access token with at least:
   - `api`
   - `write_repository`

Verify SSH access:

```bash
ssh -T git@gitlab.dev.baraq.com.internal
git remote -v
```

## Install `glab`

### Option 1: Homebrew

```bash
sudo xcodebuild -license accept
brew install glab
glab --version
```

Use `sudo xcodebuild -license accept` only if Homebrew is blocked by the Xcode license prompt.

### Option 2: Manual install

If Homebrew is unavailable, install the latest macOS arm64 binary into `~/.local/bin`:

```bash
mkdir -p ~/.local/bin
tmpdir="$(mktemp -d)"
cd "$tmpdir"

asset_url="$(
python3 - <<'PY'
import json, urllib.request
data = json.load(urllib.request.urlopen("https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases/permalink/latest"))
for link in data.get("assets", {}).get("links", []):
    url = link.get("direct_asset_url") or link.get("url") or ""
    low = url.lower()
    if "darwin" in low and "arm64" in low and low.endswith(".tar.gz"):
        print(url)
        break
else:
    raise SystemExit("No macOS arm64 glab archive found")
PY
)"

curl -fL "$asset_url" -o glab.tar.gz
tar -xzf glab.tar.gz
glab_bin="$(find "$tmpdir" -type f -name glab | head -n1)"
install -m 0755 "$glab_bin" ~/.local/bin/glab
~/.local/bin/glab --version
```

## Authenticate against internal GitLab

This GitLab instance uses:

- Git protocol: `ssh`
- API protocol: `http`

That split matters. Git pushes use SSH, but `glab` API calls must use `http` for this internal host.

### Interactive login

```bash
glab auth login --hostname gitlab.dev.baraq.com.internal
```

Choose:

- default Git protocol: `SSH`
- host API protocol: `HTTP`

### Non-interactive login

If you already have a token:

```bash
glab auth login \
  --hostname gitlab.dev.baraq.com.internal \
  --git-protocol ssh \
  --api-protocol http \
  --token YOUR_PERSONAL_ACCESS_TOKEN
```

If you do not want the token in shell history:

```bash
glab auth login \
  --hostname gitlab.dev.baraq.com.internal \
  --git-protocol ssh \
  --api-protocol http \
  --stdin
```

### Verify the setup

```bash
glab auth status --hostname gitlab.dev.baraq.com.internal
glab api user --hostname gitlab.dev.baraq.com.internal
```

Expected result:

- logged in successfully
- Git operations use `ssh`
- API calls use `http`

## Recommended host defaults

If the interactive setup chose the wrong API protocol, correct it explicitly:

```bash
glab config set git_protocol ssh --host gitlab.dev.baraq.com.internal
glab config set api_protocol http --host gitlab.dev.baraq.com.internal
```

Confirm:

```bash
glab config get git_protocol --host gitlab.dev.baraq.com.internal
glab config get api_protocol --host gitlab.dev.baraq.com.internal
```

## Working in this dual-remote repository

Because this repo also has a GitHub `origin`, do not rely on implicit host selection for MR commands. Prefer one of these patterns:

```bash
GITLAB_HOST=gitlab.dev.baraq.com.internal glab mr list -R baraq-engineering/webdev/techhub
```

```bash
GITLAB_HOST=gitlab.dev.baraq.com.internal glab mr create -R baraq-engineering/webdev/techhub ...
```

That removes ambiguity when `origin` points to GitHub and `gitlab` points to the internal GitLab project.

## Common workflows

### Publish a branch to GitLab

```bash
git push gitlab feat/oci-cloud-sync:feat/oci-cloud-sync
git branch --set-upstream-to=gitlab/feat/oci-cloud-sync feat/oci-cloud-sync
```

### Check branch divergence

```bash
git fetch --all --prune
git rev-list --left-right --count gitlab/main...HEAD
git log --oneline gitlab/main..HEAD
```

### List merge requests

```bash
GITLAB_HOST=gitlab.dev.baraq.com.internal \
glab mr list -R baraq-engineering/webdev/techhub
```

### Create a merge request

```bash
GITLAB_HOST=gitlab.dev.baraq.com.internal \
glab mr create \
  -R baraq-engineering/webdev/techhub \
  -s feat/oci-cloud-sync \
  -b main \
  -t "feat: add OCI Cloud Sync infrastructure" \
  -d $'## Summary\n- add OCI Cloud Sync infrastructure\n- fix environment precedence in startup scripts' \
  --yes
```

### Open an MR in the browser

```bash
GITLAB_HOST=gitlab.dev.baraq.com.internal \
glab mr view 1 -R baraq-engineering/webdev/techhub --web
```

## Troubleshooting

### `dial tcp ...:443: connect: network is unreachable`

Cause:

- `glab` is trying `https` instead of `http`
- or you are not on the internal network / VPN

Fix:

```bash
glab config set api_protocol http --host gitlab.dev.baraq.com.internal
glab auth status --hostname gitlab.dev.baraq.com.internal
```

### `401 Unauthorized`

Cause:

- token is missing
- token was not stored
- token is missing required scopes

Fix:

```bash
glab auth login --hostname gitlab.dev.baraq.com.internal
glab auth status --hostname gitlab.dev.baraq.com.internal
```

Recreate the token with `api` and `write_repository` if needed.

### `Unknown flag: --host`

Some `glab` commands do not accept `--host`. Use `GITLAB_HOST=...` and `-R group/project` instead:

```bash
GITLAB_HOST=gitlab.dev.baraq.com.internal \
glab mr list -R baraq-engineering/webdev/techhub
```

### `Everything up-to-date` after `git push -o merge_request.create`

GitLab push options are not reliable once the branch is already published. Use `glab mr create` instead.

### Homebrew install blocked by Xcode license

Run:

```bash
sudo xcodebuild -license accept
```

Then retry:

```bash
brew install glab
```

## Quick reference

```bash
# verify auth
glab auth status --hostname gitlab.dev.baraq.com.internal

# publish branch
git push gitlab my-branch:my-branch

# create MR
GITLAB_HOST=gitlab.dev.baraq.com.internal \
glab mr create -R baraq-engineering/webdev/techhub -s my-branch -b main --yes
```
