# Deposit–Withdraw Monitor

> **⚠️ Status: Not production‑ready yet**
>

A synthetic E2E test harness for dYdX deposits/withdrawals using **MetaMask** and **Phantom**. It automates the FE, waits for **finality**, emits **Datadog** telemetry, and always attempts a **rebalance** in teardown so routes can run repeatedly.

---

## Contents

* [Quick start](#quick-start)
* [Configuration](#configuration)
* [Routes: how tests are generated](#routes-how-tests-are-generated)
* [Running tests](#running-tests)
* [Docker](#docker)
* [AWS (EventBridge → ECS Fargate) — IaC](#aws-eventbridge--ecs-fargate--iac)
* [Project structure](#project-structure)
* [Telemetry (Datadog)](#telemetry-datadog)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)

---

## Quick start

> Node 18+, Playwright installed via `npm ci`. The repo expects **Chrome extensions** to be present under `extensions/`.

```bash
# 1) Install deps
npm ci

# 2) Dry‑run: list deposit tests derived from routes.yaml
npx playwright test src/tests/ --list

# 3) Run all tests (uses routes.yaml)
npx playwright test src/tests/ --reporter=line

# 4) (Optional) Run specific test (uses routes.yaml)
npx playwright test src/tests/deposit.spec.ts -g "deposit: metamask-ethereum-usdc-deposit-regular"

---

## Configuration [WIP]

Shared constants live in `src/config/constants.ts` (paths, extension IDs, DAPP URL).

| Variable                                 | Where                 | Purpose                                                        |
| ---------------------------------------- | --------------------- | -------------------------------------------------------------- |
| `DD_API_KEY`                             | env                   | Datadog HTTP intake key (optional locally).                    |
| `DAPP_URL`                               | `config/constants.ts` | Defaults to `https://dydx.trade/portfolio/overview`.           |

---

## Routes: how tests are generated

* `routes.yaml` is the single source of truth in the repo.
* The spec loads YAML synchronously and defines **one test per enabled route**.
* Filter with envs: `ROUTE_ID` and/or `WALLET`.

---

## Running tests

### List generated tests (YAML mode)

```bash
npx playwright test src/tests/ --list
```

### Run a single test by route id (YAML mode)

```bash
ROUTE_ID=dep-ethereum-usdc-regular-metamask-10 \
  npx playwright test src/tests/deposit.spec.ts --reporter=line
```

### Run by wallet (YAML mode)

```bash
WALLET=phantom npx playwright test src/tests/deposit.spec.ts --list
```

### Run through docker
```bash
ROUTE_DIR="user-data/metamask/deposits/regular/metamask-ethereum-usdc-deposit-regular"; \
docker run --rm \
  -e CI=1 -e HEADFUL=1 \
  -e WALLET=metamask \
  -e EXT_DIR=/extensions \
  -e USER_DATA_DIR=/user-data \
  -v "$PWD/extensions:/extensions:ro" \
  -v "$PWD/$ROUTE_DIR:/user-data-ro:ro" \
  --tmpfs /user-data:rw,size=1g \
  -v "$PWD/playwright-report:/playwright-report" \
  -v "$PWD/test-results:/test-results" \
  --entrypoint bash \
  dwm:local -lc 'set -e; cp -a /user-data-ro/. /user-data/; exec bash src/scripts/run-tests.sh --grep "deposit: metamask-ethereum-usdc-deposit-regular" --retries=0'
```

### Run through docker with VNC
```bash
docker run --rm \
  -e CI=0 \
  -e HEADFUL=1 -e VNC=1 -e VNC_PORT=5900 -e VNC_PASSWORD='s3cret' \
  -e WALLET=metamask \
  -e EXT_DIR=/extensions \
  -e USER_DATA_DIR=/user-data/deposits/regular/metamask-ethereum-usdc-deposit-regular \
  -v "$PWD/extensions:/extensions:ro" \
  -v "$PWD/user-data/metamask/deposits/regular/metamask-ethereum-usdc-deposit-regular:/user-data" \
  -p 5900:5900 \
  dwm:local \
  --grep "deposit: metamask-ethereum-usdc-deposit-regular"
```

---

## 📦 Deployment

The application is designed to run as a scheduled ECS Fargate task in AWS.

The ECS task runs automatically every 60 minutes, executing the test suite in a clean container environment.

**Infrastructure Management:**
- Infrastructure is managed through **Terraform Cloud**
- Changes are automatically planned and applied via GitHub integration
- Manual infrastructure updates can be triggered through the Terraform Cloud web interface

**GitHub Actions Integration:**
- Docker images are automatically built and pushed to AWS ECR via GitHub Actions
- The CI/CD pipeline handles container registry authentication and deployment
- Images are tagged with timestamps and also maintained as `:latest`

**GitHub Repository Configuration:**
The following variables must be configured in GitHub repository settings (Settings → Secrets and variables → Actions → Variables):

| Variable | Source |
|----------|--------|
| `AWS_REGION` | Static value: `ap-northeast-1` |
| `AWS_ECR_REPOSITORY_URL` | Terraform Cloud output: `aws_ecr_repository_url` |
| `AWS_GITHUB_ACTIONS_ROLE_ARN` | Terraform Cloud output: `aws_github_actions_role_arn` |

*Note: The Terraform Cloud outputs can be found in the workspace's "Outputs" tab after a successful apply.*

## 🐳 Local Docker Testing

To test the Docker container locally:

```bash
# Build the Docker image
docker build -t deposit-withdraw-monitor:local .

# Run tests in the container
docker run --rm deposit-withdraw-monitor:local
```

**Key features of the Docker setup:**
- Pre-installed Playwright with Chrome dependencies
- Chrome extensions automatically downloaded during build
- Runs in headless mode optimized for CI environments
- Clean, isolated environment for each test run
- Uses `--reporter=line` for clean log output

## Docker [WIP]

Use a **single** image (official Playwright base) that contains browsers + both extensions. Choose the wallet/route at runtime via routes.



**Notes**

* Extensions require **headful** Chromium; the Playwright base image uses Xvfb so headful is OK in CI.

---

## AWS (EventBridge → ECS Fargate) — IaC [WIP]

**Pattern:** one **Fargate task** per route. EventBridge sets env overrides that describe the route; the task reads secrets from **Secrets Manager**.

* **Task definition**

* **Scheduling**

  * **(YAML as source)**: Terraform `yamldecode(file("../../routes.yaml"))` → create one EventBridge rule per enabled route with `rate(cadence_min)`, pass env overrides.

* **Tags**

  * The test emits Datadog metrics/logs with tags: `route_id`, `wallet`, `route_kind`, `src`, `dst`, `env`.

---

## Project structure

```
src/
  fixtures/
    index.ts                 # thin glue: launches context, opens app, connectWallet helper
  targets/
    dydx/
      flows.ts               # e.g open(), navToDeposit()
      selectors.ts           # app selectors
      index.ts
    wallets/
      metamask/
        flows.ts             # e.g. connect
        selectors.ts
        constants.ts
        index.ts
      phantom/
        flows.ts             # e.g. connect
        selectors.ts
        constants.ts
        index.ts
  utils/
    datadog                  # findPageWithUrl(context, matcher)
      datadog-utils.ts       # emitResult/emitLog
    finality/
      finality.ts            # Deposit Assertion - FE/BE
    helpers/
      windows.ts  
    logger/
      logging-utils.ts
    rebalance/
      rebalancer.ts          # Keeps wallet balances between certain thresholds through API transactions
    route
      routes.ts              # YAML loaders
  config/
    constants.ts             # paths, DAPP_URL, extension IDs
    timeouts.ts              # test timeouts
  tests/
    deposit.spec.ts          # generates tests from routes (YAML)
    withdraw.spec.ts         # similar pattern
routes.yaml                  # Test source of truth
```

---

## Telemetry (Datadog) [WIP]

A tiny HTTP client sends both a **result gauge** (1/0) and a **structured log** per run.

```ts
await emitResult(passed, [
  `route_id:${route.id}`,
  `wallet:${route.wallet_type}`,
  `src:${route.src_chain}`,
  `dst:${route.dst_chain}`,
  `env:${ENV}`,
]);

await emitLog(passed ? "deposit.ok" : "deposit.error", {
  route_id: route.id,
  route_kind: route.route_kind,
  amount: route.amount,
  src_chain: route.src_chain,
  dst_chain: route.dst_chain,
  tx_hash: txHash,
  status: passed ? "ok" : "error",
  error_stage: passed ? undefined : error_stage,
});
```

**Env** [WIP]

* `DD_API_KEY` (required to send) — if unset, functions no‑op.
* `DD_SITE`
* `DD_SERVICE`/`DD_SOURCE` — optional labels.

---

## Troubleshooting [WIP]


**Rebalance failed**

* By design, **does not fail** the test. We log a `warning` and continue.

**Network flakiness**

* The spec separates errors into `pre_submit` vs `submit_or_finality`. You can add retries to pre‑submit only.

---
