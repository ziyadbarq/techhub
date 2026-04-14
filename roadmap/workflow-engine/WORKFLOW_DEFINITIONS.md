# Built-in Workflow Definitions

These three definitions are seeded on first boot. They are `PUBLISHED` and serve as the defaults for Standard, Normal, and Emergency change types. Admins can clone and customize them but cannot delete these originals.

---

## 1. Standard Change

Auto-approves with no human interaction. Used for pre-approved, low-risk, routine changes.

```jsonc
{
  "id": "standard-change-v1",
  "name": "Standard Change",
  "slug": "standard-change",
  "entityType": "ChangeRequest",
  "triggerConditions": { "field": "changeType", "op": "==", "value": "STANDARD" },
  "steps": [
    {
      "id": "auto-approve",
      "type": "AUTOMATION",
      "name": "Auto Approve",
      "handler": "set-change-status",
      "params": { "status": "APPROVED" },
      "onSuccess": "notify-requestor",
      "onFailure": "TERMINATE"
    },
    {
      "id": "notify-requestor",
      "type": "NOTIFICATION",
      "name": "Notify Requestor",
      "recipients": [{ "strategy": "COMPUTED", "resolver": "requestor" }],
      "template": "change-approved",
      "next": "END"
    }
  ]
}
```

**Flow:** Submit → auto-approve automation → notify requestor → done (outcome: APPROVED)

---

## 2. Normal Change

Single approver with risk assessment input. Escalates to Emergency workflow if risk score ≥ 16.

```jsonc
{
  "id": "normal-change-v1",
  "name": "Normal Change",
  "slug": "normal-change",
  "entityType": "ChangeRequest",
  "triggerConditions": { "field": "changeType", "op": "==", "value": "NORMAL" },
  "slaConfig": {
    "duration": "P5D",
    "calendar": "saudi-standard",
    "warnAt": "P3D",
    "escalateAt": "P5D"
  },
  "steps": [
    {
      "id": "risk-assessment",
      "type": "INPUT",
      "name": "Risk Assessment",
      "fields": ["riskLikelihood", "riskImpact", "riskNotes"],
      "assignee": { "strategy": "SPECIFIC_ROLE", "role": "change-manager" },
      "sla": { "duration": "PT48H", "businessHours": true, "calendar": "saudi-standard" },
      "onComplete": "compute-risk"
    },
    {
      "id": "compute-risk",
      "type": "AUTOMATION",
      "name": "Compute Risk Score",
      "handler": "compute-change-risk",
      "onSuccess": "risk-branch",
      "onFailure": "TERMINATE"
    },
    {
      "id": "risk-branch",
      "type": "BRANCH",
      "name": "Route by Risk Level",
      "branches": [
        {
          "condition": { "field": "riskScore", "op": ">=", "value": 21 },
          "next": "critical-risk-block"
        },
        {
          "condition": { "field": "riskScore", "op": ">=", "value": 16 },
          "next": "escalate-to-emergency-notify"
        },
        { "default": true, "next": "single-approval" }
      ]
    },
    {
      "id": "critical-risk-block",
      "type": "APPROVAL",
      "name": "Critical Risk Acknowledgement",
      "assignees": [{ "strategy": "SPECIFIC_ROLE", "role": "change-manager" }],
      "policy": "ANY",
      "allowedActions": ["APPROVE", "REJECT"],
      "sla": { "duration": "PT24H", "businessHours": true, "calendar": "saudi-standard" },
      "onApprove": "single-approval",
      "onReject": "notify-rejected"
    },
    {
      "id": "escalate-to-emergency-notify",
      "type": "NOTIFICATION",
      "name": "Suggest Emergency Escalation",
      "recipients": [{ "strategy": "COMPUTED", "resolver": "requestor" }],
      "template": "change-risk-escalation-suggested",
      "next": "single-approval"
    },
    {
      "id": "single-approval",
      "type": "APPROVAL",
      "name": "Change Manager Approval",
      "assignees": [
        { "strategy": "SPECIFIC_ROLE", "role": "change-manager" }
      ],
      "policy": "ANY",
      "allowedActions": ["APPROVE", "REJECT", "REQUEST_INFO"],
      "sla": {
        "duration": "PT48H",
        "businessHours": true,
        "calendar": "saudi-standard",
        "warnAt": "PT36H",
        "autoDecideAt": "PT72H",
        "autoDecision": "ESCALATE"
      },
      "onApprove": "notify-approved",
      "onReject": "notify-rejected"
    },
    {
      "id": "sla-escalation",
      "type": "ESCALATION",
      "name": "SLA Breach Escalation",
      "watchesStep": "single-approval",
      "afterDuration": "PT48H",
      "escalateTo": { "strategy": "REQUESTOR_MANAGER" },
      "action": "ADD_ASSIGNEE"
    },
    {
      "id": "notify-approved",
      "type": "NOTIFICATION",
      "name": "Notify Approved",
      "recipients": [
        { "strategy": "COMPUTED", "resolver": "requestor" },
        { "strategy": "COMPUTED", "resolver": "assignedTo" }
      ],
      "template": "change-approved",
      "next": "END"
    },
    {
      "id": "notify-rejected",
      "type": "NOTIFICATION",
      "name": "Notify Rejected",
      "recipients": [{ "strategy": "COMPUTED", "resolver": "requestor" }],
      "template": "change-rejected",
      "next": "TERMINATE"
    }
  ]
}
```

**Flow:**
```
Submit
  → Risk Assessment (INPUT, change-manager, 48h SLA)
  → Compute Risk (AUTOMATION)
  → Branch:
      riskScore ≥ 21 → Critical Acknowledgement (APPROVAL) → Single Approval
      riskScore ≥ 16 → Notify Escalation Suggested → Single Approval
      default        → Single Approval
  → Single Approval (APPROVAL, change-manager, 48h SLA)
      [parallel: SLA Escalation watching for breach → adds manager as assignee]
      approve → Notify Approved → END (outcome: APPROVED)
      reject  → Notify Rejected → TERMINATE (outcome: REJECTED)
```

---

## 3. Emergency Change

Parallel CAB approval with tight SLA. Does not require maintenance window.

```jsonc
{
  "id": "emergency-change-v1",
  "name": "Emergency Change",
  "slug": "emergency-change",
  "entityType": "ChangeRequest",
  "triggerConditions": { "field": "changeType", "op": "==", "value": "EMERGENCY" },
  "slaConfig": {
    "duration": "PT8H",
    "calendar": "calendar",
    "warnAt": "PT4H",
    "escalateAt": "PT6H"
  },
  "steps": [
    {
      "id": "notify-emergency-start",
      "type": "NOTIFICATION",
      "name": "Emergency Change Alert",
      "recipients": [
        { "strategy": "SPECIFIC_ROLE", "role": "change-manager" },
        { "strategy": "SPECIFIC_ROLE", "role": "cab-member" },
        { "strategy": "CI_OWNER" }
      ],
      "template": "emergency-change-alert",
      "next": "parallel-cab"
    },
    {
      "id": "parallel-cab",
      "type": "PARALLEL",
      "name": "CAB + CI Owner Parallel Approval",
      "mergePolicy": "ALL_COMPLETE",
      "branches": [
        {
          "id": "branch-cab",
          "steps": [
            {
              "id": "cab-approval",
              "type": "APPROVAL",
              "name": "CAB Member Approval",
              "assignees": [{ "strategy": "SPECIFIC_ROLE", "role": "cab-member" }],
              "policy": "ANY",
              "allowedActions": ["APPROVE", "REJECT"],
              "sla": {
                "duration": "PT4H",
                "businessHours": false,
                "calendar": "calendar",
                "autoDecideAt": "PT6H",
                "autoDecision": "AUTO_APPROVE"
              }
            }
          ]
        },
        {
          "id": "branch-ci-owner",
          "steps": [
            {
              "id": "ci-owner-approval",
              "type": "APPROVAL",
              "name": "CI Owner Approval",
              "assignees": [{ "strategy": "CI_OWNER" }],
              "policy": "ANY",
              "allowedActions": ["APPROVE", "REJECT"],
              "sla": {
                "duration": "PT4H",
                "businessHours": false,
                "calendar": "calendar",
                "autoDecideAt": "PT6H",
                "autoDecision": "AUTO_APPROVE"
              }
            }
          ]
        }
      ],
      "onMerge": "check-outcomes"
    },
    {
      "id": "check-outcomes",
      "type": "BRANCH",
      "name": "Check Parallel Outcomes",
      "branches": [
        {
          "condition": {
            "or": [
              { "field": "steps.cab-approval.outcome", "op": "==", "value": "REJECTED" },
              { "field": "steps.ci-owner-approval.outcome", "op": "==", "value": "REJECTED" }
            ]
          },
          "next": "notify-rejected"
        },
        { "default": true, "next": "notify-approved" }
      ]
    },
    {
      "id": "notify-approved",
      "type": "NOTIFICATION",
      "name": "Notify Emergency Approved",
      "recipients": [
        { "strategy": "COMPUTED", "resolver": "requestor" },
        { "strategy": "COMPUTED", "resolver": "assignedTo" },
        { "strategy": "SERVICE_OWNER" }
      ],
      "template": "emergency-change-approved",
      "next": "END"
    },
    {
      "id": "notify-rejected",
      "type": "NOTIFICATION",
      "name": "Notify Emergency Rejected",
      "recipients": [
        { "strategy": "COMPUTED", "resolver": "requestor" },
        { "strategy": "SPECIFIC_ROLE", "role": "change-manager" }
      ],
      "template": "change-rejected",
      "next": "TERMINATE"
    }
  ]
}
```

**Flow:**
```
Submit
  → Notify all stakeholders (NOTIFICATION)
  → Parallel CAB Approval:
      Branch A: CAB member approval (4h SLA, auto-approve at 6h)
      Branch B: CI owner approval   (4h SLA, auto-approve at 6h)
      [merge: ALL_COMPLETE]
  → Check outcomes branch:
      any REJECTED → Notify Rejected → TERMINATE (outcome: REJECTED)
      all approved → Notify Approved → END (outcome: APPROVED)
```

---

## Seeded Automation Handlers (registered with engine)

| Handler Name | Description |
|---|---|
| `set-change-status` | Updates the ChangeRequest status field |
| `compute-change-risk` | Calculates riskScore = likelihood × impact, sets riskLevel |
| `notify-ci-owners` | Sends notification to all CI owners of affected CIs |
| `validate-maintenance-window` | Checks if scheduledStartAt falls in a valid window |
| `generate-change-number` | Auto-generates the changeNumber on creation |

---

## Seeded Assignee Resolvers

| Resolver Name | Description |
|---|---|
| `requestor` | Returns the Person who created the ChangeRequest |
| `assignedTo` | Returns the assignedTo Person on the ChangeRequest |
| `affected-ci-owners` | Returns primary owners of all ChangeAffectedCI records |
| `affected-service-owners` | Returns owners of all ChangeAffectedService records |
