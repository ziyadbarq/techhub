# Kubernetes Operations Guide

Day-to-day operations guide for TechHub deployments on Kubernetes (OCI and GCP clouds).

## Table of Contents

- [Quick Reference](#quick-reference)
- [Accessing Clusters](#accessing-clusters)
- [Viewing Deployments](#viewing-deployments)
- [Checking Logs](#checking-logs)
- [Scaling Applications](#scaling-applications)
- [Rolling Updates](#rolling-updates)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Common kubectl Commands](#common-kubectl-commands)

## Quick Reference

### GitLab Pipeline

**Repository**: http://gitlab.dev.baraq.com.internal/baraq-engineering/webdev/techhub

```bash
# View pipelines
# GitLab UI: CI/CD > Pipelines

# Deployments via GitOps (ArgoCD):
# - Pipeline updates deployment values in the GitOps repo
# - ArgoCD automatically syncs changes to Kubernetes

# Automatic deployment (main branch → OCI production)
# Push to main branch - builds image, updates values-dev.yaml, ArgoCD deploys

# Automatic deployment (dev branch → GCP development)
# Push to dev branch - builds image, updates values-gcpdev.yaml, ArgoCD deploys

# Manual operations:
# - Build only: CI/CD > Pipelines > Run pipeline > set type=build_only
# - Promote image: CI/CD > Pipelines > [Pipeline] > promote-to-uat-oci > Play
```

### Kubernetes Clusters

| Cloud | Namespace             | Environment | URL                          |
| ----- | --------------------- | ----------- | ---------------------------- |
| OCI   | `istio-dev`           | Production  | https://techhub.baraq.com    |
| GCP   | `horizontal-services` | Development | https://techhub.dev.barq.com |

### Container Registries

- **OCI**: `$OCI_REGISTRY/techhub`
- **GCP**: `$GCP_REGISTRY/techhub`

## Accessing Clusters

### Set Kubeconfig

```bash
# Set kubeconfig (obtain from DevOps team)
export KUBECONFIG=/path/to/kubeconfig

# Verify cluster connection
kubectl cluster-info

# List available contexts
kubectl config get-contexts

# Switch context (if multiple clusters in kubeconfig)
kubectl config use-context <context-name>
```

### Verify Access

```bash
# Check OCI cluster access
kubectl get nodes
kubectl get namespaces
kubectl get pods -n istio-dev

# Check GCP cluster access
kubectl get pods -n horizontal-services
```

## Viewing Deployments

### Check Deployment Status

```bash
# OCI Production
kubectl get deployment techhub -n istio-dev
kubectl get pods -n istio-dev -l app=techhub
kubectl get svc -n istio-dev -l app=techhub
kubectl get ingress -n istio-dev

# GCP Development
kubectl get deployment techhub -n horizontal-services
kubectl get pods -n horizontal-services -l app=techhub
```

### Watch Rollout Status

```bash
# Watch deployment in real-time
kubectl rollout status deployment/techhub -n istio-dev

# Watch pods updating
kubectl get pods -n istio-dev -l app=techhub --watch
```

### Describe Resources

```bash
# Get detailed deployment info
kubectl describe deployment techhub -n istio-dev

# Get pod details (useful for troubleshooting)
kubectl describe pod <pod-name> -n istio-dev

# Check events
kubectl get events -n istio-dev --sort-by='.lastTimestamp'
```

## Checking Logs

### View Application Logs

```bash
# Tail logs from all pods
kubectl logs -n istio-dev -l app=techhub --tail=100 -f

# Logs from specific pod
kubectl logs <pod-name> -n istio-dev --tail=200

# Logs from previous container (if pod crashed)
kubectl logs <pod-name> -n istio-dev --previous

# Logs with timestamps
kubectl logs <pod-name> -n istio-dev --timestamps=true
```

### Filter Logs

```bash
# Grep for errors
kubectl logs -n istio-dev -l app=techhub --tail=500 | grep -i error

# Save logs to file
kubectl logs -n istio-dev -l app=techhub --tail=1000 > techhub-logs.txt
```

### Pod Shell Access

```bash
# Get shell in running pod
kubectl exec -it <pod-name> -n istio-dev -- sh

# Run single command
kubectl exec <pod-name> -n istio-dev -- node --version

# Check environment variables
kubectl exec <pod-name> -n istio-dev -- env | grep DATABASE
```

## Scaling Applications

### Manual Scaling

```bash
# Scale to 3 replicas
kubectl scale deployment techhub -n istio-dev --replicas=3

# Verify scaling
kubectl get pods -n istio-dev -l app=techhub
```

### Update Helm Values

```bash
# Clone deployment-configs repo
git clone http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs.git
cd deployment-configs

# Edit values file
vi manifests/techhub/values-oci-prod.yaml
# Change: replicaCount: 3

# Apply via Helm
helm upgrade techhub ./manifests/techhub \
  --namespace istio-dev \
  --values manifests/techhub/values-oci-prod.yaml

# Commit changes
git add manifests/techhub/values-oci-prod.yaml
git commit -m "chore: Scale TechHub to 3 replicas"
git push github main
```

### Auto-Scaling (HPA)

```bash
# Check if HPA is configured
kubectl get hpa -n istio-dev

# Create HPA (if not exists)
kubectl autoscale deployment techhub -n istio-dev \
  --cpu-percent=70 \
  --min=2 \
  --max=10

# Watch HPA in action
kubectl get hpa techhub -n istio-dev --watch
```

## Rolling Updates

### Via GitLab CI (Recommended)

**Automatic Method**:

1. Push code to `main` or `dev` branch
2. Pipeline builds new Docker image
3. Trigger manual deployment (OCI) or automatic (GCP)
4. Helm performs rolling update

### Manual Image Update

```bash
# Update image tag manually
kubectl set image deployment/techhub \
  techhub=$OCI_REGISTRY/techhub:abc1234 \
  -n istio-dev

# Watch rollout
kubectl rollout status deployment/techhub -n istio-dev
```

### Update via Helm

```bash
cd deployment-configs

# Update with new image tag
helm upgrade techhub ./manifests/techhub \
  --namespace istio-dev \
  --values manifests/techhub/values-oci-prod.yaml \
  --set image.tag=abc1234 \
  --wait

# Verify update
kubectl get pods -n istio-dev -l app=techhub
```

## Rollback Procedures

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/techhub -n istio-dev

# Rollback to previous version
kubectl rollout undo deployment/techhub -n istio-dev

# Rollback to specific revision
kubectl rollout undo deployment/techhub -n istio-dev --to-revision=2

# Verify rollback
kubectl rollout status deployment/techhub -n istio-dev
```

### Rollback via Helm

```bash
# List Helm releases
helm list -n istio-dev

# View release history
helm history techhub -n istio-dev

# Rollback to previous release
helm rollback techhub -n istio-dev

# Rollback to specific version
helm rollback techhub 3 -n istio-dev

# Verify rollback
kubectl get pods -n istio-dev -l app=techhub
```

### Emergency: Force Restart

```bash
# Force pod restart (recreate all pods)
kubectl rollout restart deployment/techhub -n istio-dev

# Delete specific pod (will be recreated)
kubectl delete pod <pod-name> -n istio-dev
```

## Troubleshooting

### Pod Not Starting

**Symptom**: Pods stuck in `Pending`, `ContainerCreating`, or `CrashLoopBackOff`

```bash
# Check pod status
kubectl get pods -n istio-dev -l app=techhub

# Describe pod for events
kubectl describe pod <pod-name> -n istio-dev

# Common issues:
# - ImagePullBackOff: Wrong image or registry credentials
# - CrashLoopBackOff: Application crashes on startup
# - Pending: Resource constraints or node issues
```

**Solutions**:

```bash
# ImagePullBackOff - check image exists
docker pull $OCI_REGISTRY/techhub:abc1234

# Check image pull secret
kubectl get secret techhub-registry -n istio-dev

# CrashLoopBackOff - check logs
kubectl logs <pod-name> -n istio-dev --previous

# Pending - check resource requests/limits
kubectl describe pod <pod-name> -n istio-dev | grep -A 5 Resources
```

### Database Connection Issues

```bash
# Check database connectivity from pod
kubectl exec <pod-name> -n istio-dev -- sh
# Inside pod:
nc -zv <database-host> 5432
ping <database-host>

# Check environment variables
kubectl exec <pod-name> -n istio-dev -- env | grep DATABASE

# Verify ConfigMap/Secret exists
kubectl get configmap techhub-config -n istio-dev
kubectl get secret techhub-secrets -n istio-dev

# View ConfigMap contents
kubectl get configmap techhub-config -n istio-dev -o yaml

# Check GCP Cloud SQL proxy (if used)
kubectl get pods -n istio-dev | grep cloud-sql-proxy
```

### Ingress/Service Issues

```bash
# Check service
kubectl get svc techhub -n istio-dev
kubectl describe svc techhub -n istio-dev

# Check ingress
kubectl get ingress -n istio-dev
kubectl describe ingress techhub -n istio-dev

# Test service internally
kubectl run -it --rm debug --image=alpine --restart=Never -n istio-dev -- sh
# Inside debug pod:
wget -O- http://techhub:3000/api/health
```

### Performance Issues

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n istio-dev

# Check pod metrics
kubectl get --raw "/apis/metrics.k8s.io/v1beta1/namespaces/istio-dev/pods/<pod-name>" | jq .

# Increase resources via Helm
# Edit values file to increase CPU/memory limits
helm upgrade techhub ./manifests/techhub \
  --namespace istio-dev \
  --values manifests/techhub/values-oci-prod.yaml \
  --set resources.limits.memory=4Gi
```

## Common kubectl Commands

### Get Resources

```bash
# All resources in namespace
kubectl get all -n istio-dev

# Deployments
kubectl get deployments -n istio-dev
kubectl get deploy techhub -n istio-dev -o yaml

# Pods with labels
kubectl get pods -n istio-dev -l app=techhub
kubectl get pods -n istio-dev -l app=techhub,version=v1.2.3

# Services
kubectl get svc -n istio-dev
kubectl get endpoints techhub -n istio-dev

# ConfigMaps and Secrets
kubectl get configmaps -n istio-dev
kubectl get secrets -n istio-dev
```

### Edit Resources

```bash
# Edit deployment (not recommended - use Helm)
kubectl edit deployment techhub -n istio-dev

# Edit ConfigMap
kubectl edit configmap techhub-config -n istio-dev

# Apply from file
kubectl apply -f deployment.yaml -n istio-dev
```

### Port Forwarding

```bash
# Forward local port to pod
kubectl port-forward -n istio-dev <pod-name> 3000:3000

# Access locally
curl http://localhost:3000/api/health

# Forward to service
kubectl port-forward -n istio-dev svc/techhub 3000:3000
```

### Copy Files

```bash
# Copy file from pod
kubectl cp <pod-name>:/app/logs/error.log ./error.log -n istio-dev

# Copy file to pod
kubectl cp ./config.json <pod-name>:/app/config.json -n istio-dev
```

### Labels and Annotations

```bash
# Add label to pod
kubectl label pod <pod-name> environment=production -n istio-dev

# Remove label
kubectl label pod <pod-name> environment- -n istio-dev

# Add annotation
kubectl annotate pod <pod-name> description="test pod" -n istio-dev
```

### Resource Cleanup

```bash
# Delete pod (will be recreated by deployment)
kubectl delete pod <pod-name> -n istio-dev

# Delete deployment (careful!)
kubectl delete deployment techhub -n istio-dev

# Delete all resources with label
kubectl delete all -l app=techhub -n istio-dev

# Uninstall via Helm (recommended)
helm uninstall techhub -n istio-dev
```

## Helm-Specific Operations

### List Releases

```bash
# All releases in namespace
helm list -n istio-dev

# All releases in all namespaces
helm list --all-namespaces

# Show release status
helm status techhub -n istio-dev
```

### View Values

```bash
# Get values used for current release
helm get values techhub -n istio-dev

# Get all values (including defaults)
helm get values techhub -n istio-dev --all

# Get manifest (actual K8s resources)
helm get manifest techhub -n istio-dev
```

### Test Release

```bash
# Run Helm tests (if defined in chart)
helm test techhub -n istio-dev
```

### Upgrade with Dry-Run

```bash
# Preview changes before applying
helm upgrade techhub ./manifests/techhub \
  --namespace istio-dev \
  --values manifests/techhub/values-oci-prod.yaml \
  --dry-run \
  --debug
```

## Monitoring and Alerts

### Check Application Health

```bash
# Via ingress
curl https://techhub.baraq.com/api/health

# Via service (from within cluster)
kubectl run -it --rm curl --image=curlimages/curl --restart=Never -n istio-dev -- \
  curl http://techhub:3000/api/health
```

### Watch for Changes

```bash
# Watch pods
watch kubectl get pods -n istio-dev -l app=techhub

# Watch events
kubectl get events -n istio-dev --watch

# Watch deployments
watch kubectl get deployments -n istio-dev
```

### Resource Quotas

```bash
# Check namespace quotas
kubectl get resourcequota -n istio-dev

# Check limit ranges
kubectl get limitrange -n istio-dev

# Describe quota
kubectl describe resourcequota -n istio-dev
```

## Environment Variables Management

### View Current Environment

```bash
# View env from pod
kubectl exec <pod-name> -n istio-dev -- env

# View from ConfigMap
kubectl get configmap techhub-config -n istio-dev -o yaml

# View from Secret (base64 encoded)
kubectl get secret techhub-secrets -n istio-dev -o yaml
```

### Update Environment Variables

**Via backend-configs repository** (Recommended):

1. Clone backend-configs repo
2. Update environment files
3. Create/Update ConfigMap and Secret in K8s
4. Restart deployment to pick up changes

```bash
# After updating backend-configs
kubectl create configmap techhub-config \
  --from-env-file=backend-configs/techhub/prod.env \
  --namespace=istio-dev \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployment to pick up new env
kubectl rollout restart deployment/techhub -n istio-dev
```

## Related Documentation

- [GITLAB_CI_SETUP.md](GITLAB_CI_SETUP.md) - CI/CD pipeline setup
- [BUILD_STEPS.md](BUILD_STEPS.md) - Detailed build process
- **Deployment Configs**: http://gitlab.dev.baraq.com.internal/baraq-engineering/devops/deployment-configs
- **Backend Configs**: http://gitlab.dev.baraq.com.internal/baraq-engineering/backend-shared/backend-configs
