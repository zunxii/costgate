# CostGate

### Git blame for your cloud bill.

CostGate is a pull-request cost intelligence system for cloud-backed applications.

It analyzes the database behavior of a code change **before merge**, estimates the financial impact of the regression, explains the underlying query-plan change, applies a configurable policy, and records the prediction so it can be verified against billing after the change reaches production.

The core idea is simple:

```text
Code change
    ↓
Execution-plan change
    ↓
Infrastructure impact
    ↓
$ / month
    ↓
Policy decision
    ↓
Post-merge verification
    ↓
Prediction accuracy
```

---

## Why CostGate?

A normal code review can tell you:

> "This query is slower."

CostGate tries to answer:

> "This query became 500× slower, switched from an index-backed scan to a sequential scan, and is projected to add approximately $X/month at the configured workload."

That turns infrastructure cost into something developers can reason about **at PR time**, instead of discovering it after the cloud bill arrives.

---

## How it works

```text
                         GitHub Pull Request
                                  │
                                  ▼
                        GitHub App Webhook
                                  │
                                  ▼
                                SQS
                                  │
                                  ▼
                       CostGate Processor
                          │             │
                          │             └── GitHub API
                          │
                          ▼
                    Query Extraction
                          │
                          ▼
                 VPC Analysis Lambda
                          │
                          ▼
                PostgreSQL Shadow DB
                          │
                 ┌────────┴────────┐
                 │                 │
              Baseline          Candidate
                 │                 │
                 └────────┬────────┘
                          ▼
                  Plan Comparison
                          │
                          ▼
                  Deterministic Cost
                       Engine
                          │
             ┌────────────┼─────────────┐
             │            │             │
             ▼            ▼             ▼
          Comment       GitHub       Prediction
                         Check          Ledger
                                         │
                                         ▼
                                   Post-merge state
                                         │
                                         ▼
                                    CUR / Athena
                                         │
                                         ▼
                                  Actual cost/error
```

---

## What CostGate detects

CostGate currently focuses on SQL/query regressions that can be observed through PostgreSQL execution plans.

Examples include:

- index-backed lookup → sequential scan
- index usage disappearing
- execution time increasing sharply
- buffer usage increasing
- changed scan strategies
- workload-sensitive monthly infrastructure impact

For Python application code, CostGate can extract literal `SELECT`/`WITH` SQL from changed Python files so the workflow does not require developers to maintain a separate SQL benchmark file.

---

## Example

A one-line application change:

```sql
-- Before
WHERE customer_id = '12345';

-- After
WHERE LOWER(customer_id::text) = '12345';
```

can produce evidence such as:

```text
Baseline
  Bitmap Heap Scan
  Index: yes
  Execution: 0.127 ms

Candidate
  Seq Scan
  Index: no
  Execution: 66.737 ms
```

CostGate can then report:

```text
Execution impact:  +66.610 ms
Cost impact:       approximately +$0.74/month
Range:             approximately $0.59–$0.89/month
Policy:            PASS / WARN / BLOCK
```

The exact amount depends on the configured workload, database pricing assumptions, and other cost-model inputs.

---

## GitHub experience

CostGate operates as a GitHub App.

The intended developer workflow is:

```text
Open / update PR
      ↓
CostGate analyzes changed query behavior
      ↓
PR comment with evidence
      ↓
GitHub Check with policy result
```

The GitHub Check can communicate a policy result such as:

```text
CostGate: PASS
CostGate: WARNING
CostGate: BLOCK
```

The prediction is also recorded so the change can be followed after merge.

---

## Closed-loop verification

Prediction is only the first half of CostGate.

After a PR is merged, its prediction can move into a verification lifecycle:

```text
predicted
    ↓
verification_pending
    ↓
billing data available
    ↓
reconciled
```

The ledger records the predicted value, actual value when available, and prediction error.

The AWS CUR 2.0 integration is designed for resource-level billing verification through Athena. A newly created CUR export may require time before the first billing dataset is delivered; until that data is available, CostGate keeps the prediction in a pending verification state rather than inventing an actual value.

---

## Console

The web console is designed around the same underlying CostGate data.

The current product surfaces include:

- repository overview
- PR prediction history
- predicted vs. verified impact
- author-level cost attribution
- policy configuration
- PR analysis details
- execution-plan evidence
- verification status

The live telemetry view is intended to expose prediction counts, predicted impact, verified impact, forecast error, recent PR predictions, and author-level cost statistics. fileciteturn13file3L19-L34

---

## Architecture

### AWS

```text
GitHub
  ↓
API Gateway
  ↓
Webhook Lambda
  ↓
SQS
  ↓
Processor Lambda
  ├── GitHub
  ├── policy
  └── DynamoDB ledger
        │
        ▼
  Analysis Lambda (VPC)
        │
        ▼
  PostgreSQL / RDS shadow database
```

For post-merge billing verification:

```text
Prediction Ledger
      ↓
Reconciliation Lambda
      ↓
Athena
      ↓
AWS CUR 2.0
      ↓
Verified billing impact
```

---

## Core design principles

### Deterministic numbers

The cost calculation is performed by a deterministic cost engine. LLMs are not responsible for deciding the financial number.

### Evidence before explanation

The product prefers observable execution-plan evidence:

```text
scan type
index usage
rows
execution time
buffer activity
```

over unexplained scores.

### Explicit uncertainty

Cost results are estimates of attributed infrastructure impact, not guarantees of an AWS invoice amount.

### No production mutation during analysis

Query analysis is performed against a controlled/shadow database workflow with read-only execution and statement timeouts.

### Post-merge verification

A prediction should eventually be compared with observed billing rather than being treated as automatically correct.

---

## Project structure

```text
costgate/
├── app/
│   ├── analyzer/
│   ├── billing/
│   ├── cost_engine/
│   ├── github/
│   ├── handlers/
│   ├── ledger/
│   ├── learning/
│   ├── pipeline/
│   ├── policy/
│   └── query_extractor/
│
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
│
├── dashboard/
├── data/
├── docs/
├── scripts/
├── tests/
└── template.yaml
```

The backend contains the analysis, cost, policy, ledger, billing, and GitHub integration layers. The frontend is the presentation layer over those services.

---

## Running locally

### Backend

Use the project's Python virtual environment:

```bash
source .venv/bin/activate
pytest -q tests/unit
```

For SAM:

```bash
sam build --use-container
sam deploy
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

Run the development server with the environment required by the current deployment/API configuration.

---

## Production configuration

Important configuration categories include:

```text
GitHub App credentials
GitHub installation/workspace configuration
PostgreSQL / RDS connection
DynamoDB prediction ledger
Cost-model assumptions
Policy thresholds
CUR / Athena configuration
```

Secrets should be supplied through the configured secret/environment mechanism rather than committed to the repository.

---

## Product direction

The long-term model is:

```text
PREDICT
Measure the cost of the code change.

GUARD
Enforce a configurable cost policy.

VERIFY
Compare the prediction with actual spend.

LEARN
Use verified prediction error to improve future estimates.

ATTRIBUTE
Trace cloud-cost changes back to PRs, repositories, and authors.
```

That is the foundation for the broader idea:

> **Git blame for your cloud bill.**