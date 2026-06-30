# TechHub Argo CD Application Reference

This document captures the Argo CD application state and deployment wiring visible from the `techhub` application in Argo CD.

It is based on:

- The Argo CD application details shared from the UI
- The application manifest rendered in the Argo CD page
- The application tree and status visible in the screenshot

Where something is inferred rather than directly confirmed from cluster manifests, it is explicitly marked as an inference.

## Purpose

This page is the operational view for the deployed `techhub` application in Kubernetes. It tells you:

- What sources Argo CD uses to render the deployment
- Which cluster and namespace the app targets
- Whether the app is synced to Git
- Whether the app is healthy at the Kubernetes resource level
- Which workloads and related resources currently exist
- What you can safely inspect or trigger from Argo CD

## Current Application Identity

- Application name: `techhub`
- Argo CD namespace: `argocd`
- Argo CD project: `horizontal-services`
- Destination cluster: `in-cluster`
- Destination API server: `https://kubernetes.default.svc`
- Destination namespace: `horizontal-services`
- Created at: `2026-02-09 09:19:00`
- Sync policy: automated
- Prune: enabled
- Self-heal: enabled
- Sync option: `CreateNamespace=true`
- Retry: disabled

## Multi-Source Application Model

This is a multi-source Argo CD application.

Argo CD renders the final deployment from two inputs:

1. Helm chart source
   - `repoURL`: `me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-helm-repo`
   - `chart`: `barq`
   - `targetRevision`: `1.1.2`

2. Values source
   - `repoURL`: `git@gitlab.dev.baraq.com.internal:baraq-engineering/devops/values-yaml-npd.git`
   - `targetRevision`: `HEAD`
   - `ref`: `values`

The chart source consumes this values file:

- `$values/techhub/values-gcpdev.yaml`

That means the deployed `techhub` app is not defined only by this repository. The effective runtime configuration depends on:

- The `barq` Helm chart version `1.1.2`
- The contents of `techhub/values-gcpdev.yaml` in the `values-yaml-npd` repo

## What This Means Operationally

This repo controls application code and image production.

Argo CD deploys the app using:

- A shared Helm chart maintained elsewhere
- A values repository maintained elsewhere

So if you need to understand runtime behavior in Kubernetes, the relevant operational sources are:

- Argo CD application details
- The Helm chart version being used
- The values file referenced by Argo CD
- The live pod spec in the cluster

## Sync and Health Status

The application state shown in Argo CD was:

- Health: `Healthy`
- Sync status: `OutOfSync`
- Last sync: `Sync OK`
- App conditions: `3 Warnings`

Interpretation:

- `Healthy` means the tracked Kubernetes resources are currently considered operational by Argo CD.
- `OutOfSync` means the live cluster state differs from the desired state produced from Git/chart sources.
- `Last sync OK` means the last sync action itself completed successfully.
- `Healthy` and `OutOfSync` at the same time is normal. It means the app is running, but not perfectly aligned with the desired manifest state.

## Verified Application Warnings

The three warnings shown in Argo CD are:

1. `SharedResourceWarning`
   - `PriorityClass/critical-apps` is part of applications `argocd/techhub` and `data-cleansing`
   - Observed at `Mon Mar 09 2026 15:16:03 GMT+0300`

2. `SharedResourceWarning`
   - `PriorityClass/normal-apps` is part of applications `argocd/techhub` and `data-cleansing`
   - Observed at `Mon Mar 09 2026 15:16:03 GMT+0300`

3. `SharedResourceWarning`
   - `PriorityClass/overprovisioning` is part of applications `argocd/techhub` and `data-cleansing`
   - Observed at `Mon Mar 09 2026 15:16:03 GMT+0300`

Meaning:

- Argo CD has detected that these cluster-scoped `PriorityClass` resources are claimed by more than one application
- `techhub` is not the sole owner of these objects
- Another Argo CD application, `data-cleansing`, is also managing the same resources

Operational impact:

- This is usually an ownership and GitOps-boundary warning, not an immediate application health failure
- It explains why the app can still be `Healthy` while warnings are present
- If both applications attempt to manage the same `PriorityClass` definitions, drift and repeated reconciliation can occur

Recommended action:

- Treat these `PriorityClass` objects as shared platform resources, not app-owned resources
- Ownership should ideally be moved to exactly one source of truth
- The best fix is usually in the shared Helm chart, values repo, or Argo CD app boundaries, not in this application code repo

## Observed Image

The Argo CD page showed this application image:

- `me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-docker-repo/techhub:1.0.0-0ebaa8-106796`

Also visible:

- `docker.io/istio/proxyv2:1.25.0`

Inference:

- `techhub` likely runs in an Istio-enabled namespace or service mesh context
- The Envoy sidecar image appears because the workload is injected with an Istio proxy

## Observed Resource Tree

The screenshot shows the following managed resources for the app.

Primary application resources:

- `techhub` deployment
- `techhub-svc` service
- `techhub-sa` service account
- `techhub-dr` destination rule
- `techhub-vs` virtual service
- `techhub-pdb` pod disruption budget
- `critical-apps` priority class reference
- `normal-apps` priority class reference
- `overprovisioning` priority class reference

ReplicaSets visible in the tree:

- `techhub-5b8c68b674`
- `techhub-6ff6476d5d`
- `techhub-74bd97d6cd`
- `techhub-7ffcbf744d`
- `techhub-66947c4b68`
- `techhub-7d67c47bc9`
- `techhub-f794d54f7`
- `techhub-5b464bb9cf`
- `techhub-7bf4c4d9b8`

Active pod visible in the tree:

- `techhub-5b8c68b674-nl9hf`

Observed pod state:

- Running
- `2/2` containers ready
- Age shown in UI: `3 days`

Inference:

- The `2/2` readiness strongly suggests one application container plus one sidecar container, likely the Istio proxy
- The multiple ReplicaSets are normal deployment history retained by Kubernetes

## Verified Pod Runtime Details

The currently inspected live pod is:

- Kind: `Pod`
- Name: `techhub-5b8c68b674-nl9hf`
- Namespace: `horizontal-services`
- Created at: `2026-03-06 17:28:31`
- Phase: `Running`
- Health: `Healthy`
- Pod IP: `172.17.0.122`
- Node IP: `172.17.16.32`
- Node name: `gke-gcp-brq-app-cl-d-main-dev-spot-au-29ba65d0-j0vq`
- QoS class: `Burstable`
- Service account: `techhub-sa`
- Owner ReplicaSet: `techhub-5b8c68b674`

### Container Composition

The pod contains:

- Init container: `istio-init`
- Sidecar container: `istio-proxy`
- Main application container: `techhub`

Observed container states:

- `istio-init`: completed successfully with exit code `0`
- `istio-proxy`: running and ready
- `techhub`: running and ready

This confirms the pod is operating normally with an Istio sidecar.

### Istio / Service Mesh Evidence

The live pod manifest confirms Istio injection:

- Annotation `istio.io/rev: default`
- Sidecar status annotation present
- Init container `istio-init`
- Sidecar container `istio-proxy`
- Istio-managed health probe rewriting via `ISTIO_KUBE_APP_PROBERS`
- Istio TLS/service mesh labels present

Operationally, this means:

- Traffic is flowing through the Istio sidecar
- App probes are being routed through Istio on port `15020`
- Mesh-related config can affect startup, readiness, and networking behavior

### App Runtime Environment: Verified Presence

The live `techhub` container has these environment variables present:

- `CONFIG_SERVER_URL`
- `APPLICATION_NAME`
- `ENVIRONMENT_NAME`
- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `REDIS_URL`
- `NEXT_PUBLIC_APP_URL`
- `HOST`

`NEXT_PUBLIC_APP_URL` should be the canonical external app origin for the
environment. It must match `BETTER_AUTH_URL` from the runtime config source, and
it must be present during build because the value is embedded in the client
bundle.

Important conclusions:

- `CONFIG_SERVER_URL` is reaching the runtime container
- Spring Cloud Config activation is therefore wired at runtime
- `DATABASE_URL` and `ENCRYPTION_KEY` are also present in the runtime container
- Runtime environment injection is happening outside this repository, through the deployment/chart layer

For security reasons, this document intentionally does not repeat the raw secret values shown in the live manifest.

### Config Server Detail

The live pod manifest should show:

- `CONFIG_SERVER_URL=http://config-server-svc.horizontal-services.svc.cluster.local:8083`
- `APPLICATION_NAME=techhub`
- `ENVIRONMENT_NAME=gcpdev`

Operational note:

- This appears to reference an in-cluster config server service
- `CONFIG_SERVER_URL` must include `http://` or `https://`; the verification script treats scheme-less values as invalid
- `ENVIRONMENT_NAME=gcpdev` is what makes the app request `techhub-gcpdev.properties`

This is worth verifying in application startup logs rather than assuming.

### Health Probes

The `techhub` container is exposed on:

- Container port: `3000`

The live pod uses these probe paths through the Istio sidecar:

- Liveness: `/app-health/techhub/livez` on port `15020`
- Readiness: `/app-health/techhub/readyz` on port `15020`
- Startup: `/app-health/techhub/startupz` on port `15020`

Istio rewrites those to the application endpoint:

- `/health` on port `3000`

This is useful when debugging readiness or startup behavior. A probe issue may be:

- application-side
- Istio-side
- or caused by probe rewriting/config mismatch

### Resource Requests and Limits

Main application container `techhub`:

- Requests:
  - CPU: `450m`
  - Memory: `1000Mi`
- Limits:
  - Memory: `4000Mi`

Istio sidecar `istio-proxy`:

- Requests:
  - CPU: `100m`
  - Memory: `128Mi`
- Limits:
  - CPU: `2`
  - Memory: `1Gi`

Operationally:

- The pod is `Burstable`, not `Guaranteed`
- There is no CPU limit on the main app container in the shared snippet
- Memory pressure behavior for the app will be governed by the `4000Mi` limit

### Scheduling Characteristics

The pod is configured with:

- Preference for GKE spot provisioning nodes
- Toleration for `cloud.google.com/gke-spot=true`
- Pod affinity preference to co-locate/associate with other `techhub` pods by hostname
- `preemptionPolicy: PreemptLowerPriority`
- Termination grace period: `90` seconds
- App container `preStop` hook: sleep `30` seconds

Implications:

- `techhub` is allowed to run on spot capacity
- Evictions or node replacement events are possible and should be expected operationally
- The app has a graceful shutdown window before termination

### Restart and Stability Signals

Observed stability indicators:

- `restartCount: 0` for `techhub`
- `restartCount: 0` for `istio-proxy`
- Pod conditions `Ready=True` and `ContainersReady=True`
- Main container started at `2026-03-06T14:28:46Z`

This is strong evidence that the currently deployed pod is stable.

### Additional Observations

- `hostAliases` includes `gitlab.dev.baraq.com.internal -> 10.100.1.191`
- Pod labels include:
  - `app.kubernetes.io/managed-by=Helm`
  - `helm.sh/chart=barq-1.1.2`
  - `app.kubernetes.io/name=techhub`
  - `app.kubernetes.io/instance=techhub`
- Pod annotation `kubectl.kubernetes.io/restartedAt=2026-03-03T17:20:27Z` suggests a manual or controller-triggered rollout restart occurred earlier than the current pod creation time

Inference:

- The host alias may exist to allow internal GitLab resolution from inside the pod, likely for runtime or operational integrations
- The deployment is definitely chart-managed by Helm and delivered via Argo CD

## Why the App Can Be Healthy but OutOfSync

Common reasons include:

- The values repo `HEAD` changed after the last successful sync
- A chart-rendered field differs from the live cluster state
- A mutable field was changed live and Argo CD detected drift
- Sidecar, labels, annotations, or generated metadata differ
- The chart version and values source together render a different desired manifest than what is currently live

Because self-heal is enabled, some drift may get corrected automatically. If drift remains, inspect the `Diff` tab for the exact fields.

## What You Can Do From This Page

Safe read-only or low-risk actions:

- Open `Details` to inspect source repos, revisions, sync policy, and app metadata
- Open `Diff` to see exactly what is different between desired and live state
- Click `Refresh` to force Argo CD to re-evaluate Git/chart sources and the cluster
- Open `History and Rollback` to see deployment history and previously synced revisions
- Inspect each resource in the tree to view live manifests, events, logs, and health

Actions to use carefully:

- `Sync`
  - Applies the desired state currently rendered from chart + values
  - Use this when the desired Git state is correct and you want the cluster to match it
- `Delete`
  - Deletes the Argo CD application and, depending on finalizers and configuration, may also remove managed resources
  - Do not use casually

Because automated sync is enabled, manual sync is usually only needed when:

- You want immediate reconciliation
- Auto-sync has not run yet
- You want to observe the result directly

## Practical Checks You Can Perform

### 1. Confirm the Deployed Revision

Use the Argo CD app page to confirm:

- Chart version: `1.1.2`
- Values source revision: whatever `HEAD` currently resolves to
- App image tag: `1.0.0-0ebaa8-106796`

This tells you whether the image built by CI is the one currently deployed.

### 2. Inspect the Diff

Open `Diff` and check which resources are marked `OutOfSync`.

Focus first on:

- `Deployment`
- `VirtualService`
- `DestinationRule`
- `PodDisruptionBudget`
- Any resource marked with a warning icon

This is the fastest way to understand the current drift.

### 3. Verify Runtime Environment Injection

If you need to verify Spring Cloud Config wiring, inspect the live `Deployment` or `Pod` manifest and look for:

- `CONFIG_SERVER_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_SECRET`
- `ENCRYPTION_KEY`

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must both point to the public app
origin, not an internal service URL. `TRUSTED_ORIGINS` is optional and should
only list additional exact browser origins such as temporary aliases.

This is the most direct way to answer whether runtime variables are reaching the container.

Important:

- A GitLab CI variable alone is not enough unless the deployment pipeline or chart wiring injects it into the pod runtime environment.
- Argo CD is the best place to verify the final rendered deployment outcome.

### 4. Check Pod Health

For the running pod:

- Confirm the pod is `Running`
- Confirm readiness is `2/2`
- Open logs for the main container
- Check recent events for restart loops, image pull errors, or probe failures

If `CONFIG_SERVER_URL` is correctly injected and your app logs startup information, logs may show whether Spring Cloud Config initialization was attempted.

### 5. Review Warnings

The app conditions showed `3 Warnings`, all of type `SharedResourceWarning`.

Open app conditions and determine:

- Which resources generated the warnings
- Whether they are drift warnings, health warnings, or informational warnings
- Whether they affect deployment correctness or are only operational noise

For `techhub`, the warnings are specifically about shared `PriorityClass` resources:

- `critical-apps`
- `normal-apps`
- `overprovisioning`

That means the warning is about overlapping ownership, not a pod crash, failed probe, or missing deployment object.

## Current Manifest Snapshot

The Argo CD page showed this application manifest:

```yaml
project: horizontal-services
destination:
  server: https://kubernetes.default.svc
  namespace: horizontal-services
syncPolicy:
  automated:
    prune: true
    selfHeal: true
  syncOptions:
    - CreateNamespace=true
sources:
  - repoURL: me-central2-docker.pkg.dev/gcp-brq-shd-prd-prj-74ba/gcp-brq-helm-repo
    targetRevision: 1.1.2
    helm:
      valueFiles:
        - $values/techhub/values-gcpdev.yaml
    chart: barq
  - repoURL: git@gitlab.dev.baraq.com.internal:baraq-engineering/devops/values-yaml-npd.git
    targetRevision: HEAD
    ref: values
```

## What This Tells You About Ownership Boundaries

You can verify a lot from Argo CD even without owning the Helm chart or Kubernetes setup.

You can directly verify:

- What chart version is in use
- What values repo is in use
- What namespace is targeted
- What image is running
- What resources exist
- Whether the live deployment is synced
- Whether the runtime manifest contains the environment variables you need

You cannot fully change deployment behavior from this repository alone if the behavior lives in:

- The shared Helm chart
- The values repo
- Cluster-level admission or sidecar injection
- External secrets or runtime env injection mechanisms

## Recommended Workflow for Future Checks

When troubleshooting deployment/config issues for `techhub`, use this order:

1. Check Argo CD app health and sync state
2. Open `Diff` and identify the exact out-of-sync resources
3. Inspect the live deployment manifest
4. Verify the image tag and env vars in the pod spec
5. Check pod logs and events
6. Trace back to the owning source:
   - application code repo
   - Helm chart repo
   - values repo

## Suggested Follow-Up Documentation

If you want deeper coverage later, add:

- A copy of the rendered `Deployment` manifest for `techhub`
- The actual contents of `techhub/values-gcpdev.yaml`
- Any environment variable section from the chart values or deployment template
- The exact `Diff` output for the current `OutOfSync` state
- The meaning of the `3 Warnings` from app conditions

That would make this document a full operational runbook instead of a UI-side reference.
