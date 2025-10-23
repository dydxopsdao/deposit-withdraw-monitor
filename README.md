# Deposit–Withdraw Monitor

> **⚠️ Status: Not production‑ready yet**
>

A synthetic E2E test harness for dYdX deposits/withdrawals using **MetaMask** and **Phantom**. It automates the FE, waits for **finality**, emits **Datadog** telemetry, and always attempts a **rebalance** in teardown so routes can run repeatedly.

---

## Contents

- [Deposit–Withdraw Monitor](#depositwithdraw-monitor)
  - [Contents](#contents)
  - [Quick start](#quick-start)
  - [Configuration \[WIP\]](#configuration-wip)
    - [Environment Configuration](#environment-configuration)
  - [Routes: how tests are generated](#routes-how-tests-are-generated)
  - [Rebalancing](#rebalancing)
  - [Scheduling](#scheduling)
  - [Running tests](#running-tests)
    - [List generated tests (YAML mode)](#list-generated-tests-yaml-mode)
    - [Run a single test by route id (YAML mode)](#run-a-single-test-by-route-id-yaml-mode)
    - [Run by wallet (YAML mode)](#run-by-wallet-yaml-mode)
  - [Manual Route Execution](#manual-route-execution)
    - [With CLI script](#with-cli-script)
    - [With GitHub Actions](#with-github-actions)
  - [📦 Deployment](#-deployment)
  - [🐳 Local Docker Testing](#-local-docker-testing)
  - [Docker \[WIP\]](#docker-wip)
  - [Running locally with traces written to S3](#running-locally-with-traces-written-to-s3)
  - [AWS (EventBridge → ECS Fargate) — IaC \[WIP\]](#aws-eventbridge--ecs-fargate--iac-wip)
  - [Project structure](#project-structure)
  - [Observability (Datadog)](#observability-datadog)
  - [Troubleshooting \[WIP\]](#troubleshooting-wip)
  - [Custom v4-client-js Dependency Fix](#custom-v4-client-js-dependency-fix)
    - [Why a custom build?](#why-a-custom-build)
    - [Building and updating the custom dependency](#building-and-updating-the-custom-dependency)

---

## Quick start

> Node 18+, Playwright installed via `npm ci`. Download **MetaMask** and **Phantom** to `extensions/` with `npm run download-extensions` before running tests.

```bash
# 1) Install deps
npm ci

# 2) Download wallet extensions to extensions/
npm run download-extensions       # MetaMask + Phantom
#   or individually:
#   npm run download-metamask     # MetaMask only
#   npm run download-phantom      # Phantom only

# 3) Dry-run: list deposit tests derived from routes.yaml
npx playwright test src/tests/ --list

# 4) Run all tests (uses routes.yaml)
npx playwright test src/tests/ --reporter=line

# 5) (Optional) Run specific test (uses routes.yaml)
ROUTE_ID=metamask-ethereum-usdc-deposit-regular \
  npx playwright test src/tests/deposit.spec.ts --reporter=line

# 6) (Optional) Rebalance a specific route manually
npx tsx src/scripts/rebalance-route.ts metamask-ethereum-usdc-deposit-regular

# 7) (Optional) Get balances for a specific route
npx tsx src/scripts/get-route-balances.ts metamask-ethereum-usdc-deposit-regular
```
---

## Configuration [WIP]

Shared constants live in `src/config/constants.ts` (paths, extension IDs, DAPP URL).

### Environment Configuration

The project reads environment variables via `dotenv`.

- `.env.local` – used for local runs. Copy the example file from 1Password and place it in the repository root. This file is git‑ignored.
- `.env` – loaded in CI. The CI pipeline provides this file with the same keys as `.env.local`.

Essential variables include:

- `WALLET_PASSWORD` and wallet seed phrases – store these secrets in `.env.local` for local use and in your CI secret manager.
- `DD_API_KEY`, `DD_SERVICE`, `DD_SITE`, `DD_SOURCE` – Datadog configuration. Keep these in 1Password for local runs and inject them via CI secrets.

| Variable                                 | Where                 | Purpose                                                        |
| ---------------------------------------- | --------------------- | -------------------------------------------------------------- |
| `DD_API_KEY`                             | env                   | Datadog HTTP intake key (optional locally, overridden by AWS Secrets Manager).                    |
| `DD_SERVICE`                             | env                   | Datadog service name for tagging.                              |
| `DD_SITE`                                | env                   | Datadog site (e.g., datadoghq.com, datadoghq.eu).             |
| `DD_SOURCE`                              | env                   | Datadog source name for logs.                                  |
| `WALLET_PASSWORD`                        | env                   | Wallet password for wallet setup and operations (overridden by AWS Secrets Manager).               |
| `ALCHEMY_API_KEY`                        | env                   | API key for EVM and SVM RPC nodes from Alchemy (overridden by AWS Secrets Manager). |
| `DAPP_URL`                               | `config/constants.ts` | Defaults to `https://dydx.trade/portfolio/overview`.           |
| `SEED_PHRASES_SECRET_ARN`                | env (ECS runtime)     | ARN of AWS Secrets Manager secret containing seed phrases.     |
| `WALLET_PASSWORD_SECRET_ARN`             | env (ECS runtime)     | ARN of AWS Secrets Manager secret containing wallet password.  |
| `ALCHEMY_API_KEY_SECRET_ARN`             | env (ECS runtime)     | ARN of AWS Secrets Manager secret containing Alchemy API key. |
| `DATADOG_API_KEY_SECRET_ARN`             | env (ECS runtime)     | ARN of AWS Secrets Manager secret containing Datadog API key. |

---

## Routes: how tests are generated

* `routes.yaml` is the single source of truth in the repo.
* The spec loads YAML synchronously and defines **one test per enabled route**.
* Filter with envs: `ROUTE_ID` and/or `WALLET`.


## Rebalancing
Each route can specify a `rebalance_threshold` - when funds on the source chain drop below this threshold, the system automatically triggers rebalancing by transferring the maximum available amount in the opposite direction (deposit routes withdraw max amount, withdrawal routes deposit max amount) to restore the route's working balance.

## Scheduling

* Each route supports **multiple schedules** (e.g., work hours, after hours, weekends) using EventBridge cron expressions.
* **DynamoDB locking** prevents concurrent executions of the same route across different schedules.
* Lock acquired at container startup; released on exit (success or failure).
* See `routes.yaml` header for cron format and examples.

---

## Running tests

### List generated tests (YAML mode)

```bash
npx playwright test src/tests/ --list
```

### Run a single test by route id (YAML mode)

```bash
ROUTE_ID=metamask-ethereum-usdc-deposit-regular \
  npx playwright test src/tests/deposit.spec.ts --reporter=line
```

### Run by wallet (YAML mode)

```bash
WALLET=phantom npx playwright test src/tests/deposit.spec.ts --list
```


---

## Manual Route Execution

### With CLI script

The `scripts/trigger-route.sh` script allows you to manually trigger ECS tasks for specific routes or all routes in AWS.

Prerequisites:

- AWS CLI configured with appropriate credentials
- `jq` installed for JSON processing
- AWS SSO login (if using SSO): `aws sso login --sso-session dydxopsdao`

Usage examples:

```bash
./scripts/trigger-route.sh metamask-arbitrum-usdc-deposit-instant
./scripts/trigger-route.sh --all=true
```

Run it with `--help` for the complete usage information.

### With GitHub Actions

After the Terraform deployment, configure the role variable in GitHub.
Go to repository → Settings → Secrets and variables → Actions
and set `GITHUB_ACTIONS_AWS_ROLE_ARN` to the value of Terraform's output: `github_actions_role_arn`

Once configured, you can trigger routes through the GitHub Action `Trigger Route(s)`.

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

**Available Terraform Cloud Outputs:**
The following outputs are available after infrastructure deployment:

| Output | Description | Usage |
|--------|-------------|-------|
| `aws_ecr_repository_url` | ECR repository URL for Docker images | GitHub Actions CI/CD |
| `aws_github_actions_role_arn` | IAM role ARN for GitHub Actions | GitHub Actions authentication |
| `seed_phrases_secret_arn` | ARN of seed phrases secret in AWS Secrets Manager | Application runtime configuration |
| `wallet_password_secret_arn` | ARN of wallet password secret in AWS Secrets Manager | Application runtime configuration |
| `alchemy_api_key_secret_arn` | ARN of Alchemy API key secret in AWS Secrets Manager | Application runtime configuration |
| `datadog_api_key_secret_arn` | ARN of Datadog API key secret in AWS Secrets Manager | Application runtime configuration |
| `traces_bucket_name` | S3 bucket name for storing test traces | Local development with AWS |

**Terraform Cloud Secret Variables:**
The following sensitive variables must be configured in Terraform Cloud workspace (Variables tab → Terraform Variables):

| Variable | Type | Format | Description |
|----------|------|--------|-------------|
| `seed_phrases` | `map(string)` | HCL | Map of environment variable names to seed phrases (as defined in routes.yaml) |
| `wallet_password` | `string` | HCL | Password used for wallet setup and operations |
| `alchemy_api_key` | `string` | HCL | Alchemy API key for EVM and SVM RPC nodes |
| `datadog_api_key` | `string` | HCL | Datadog API key for data collection |
| `datadog_service` | `string` | HCL | Datadog service name for tagging (default: "dos-synth") |
| `datadog_site` | `string` | HCL | Datadog site (default: "ap1.datadoghq.com") |
| `datadog_source` | `string` | HCL | Datadog source name for logs (default: "playwright") |

**Example format for `seed_phrases` variable in Terraform Cloud:**

Set the variable type to "HCL" and use the following format:

```hcl
{
  "SEED_PHRASE_METAMASK_ETHEREUM_USDC_WITHDRAWAL" = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
  "SEED_PHRASE_DYDX_ETHEREUM_USDC_WITHDRAWAL" = "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
  # ... include all seed phrase keys from routes.yaml
}
```

⚠️ **Important**: 
- Mark the sensitive variables (`seed_phrases`, `wallet_password`, `datadog_api_key`, `alchemy_api_key`) as "Sensitive" in Terraform Cloud
- The `seed_phrases` variable will be stored in AWS Secrets Manager as a JSON object accessible by the ECS tasks. Each wallet type should have its corresponding seed phrase entry
- The `wallet_password`, `datadog_api_key`, and `alchemy_api_key` variables will be stored in AWS Secrets Manager as strings accessible by the ECS tasks
- The `datadog_service`, `datadog_site`, and `datadog_source` variables are passed as regular environment variables to the ECS tasks

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
- Clean, isolated environment for each test run
- Uses `--reporter=line` for clean log output

## Docker [WIP]

Use a **single** image (official Playwright base) that contains browsers + both extensions. Choose the wallet/route at runtime via routes.



**Notes**

* Extensions require **headful** Chromium; the Playwright base image uses Xvfb so headful is OK in CI.

---

## Running locally with traces written to S3

* In ~/.aws/config you should have the following entries:

  ```
  [sso-session dydxopsdao]
  sso_start_url = https://dydxopsservices.awsapps.com/start/
  sso_region = ap-northeast-1
  sso_registration_scopes = sso:account:access

  [profile deposit-withdraw-monitor]
  sso_session = dydxopsdao
  sso_account_id = 987747149454
  sso_role_name = Administrator
  ```

* Log in to AWS for CLI:

  ```
  aws sso login --sso-session dydxopsdao
  ```

* Run tests with the required env vars, e.g.:

  ```
  AWS_PROFILE=deposit-withdraw-monitor \
  AWS_REGION=ap-northeast-1 \
  AWS_TRACES_BUCKET_NAME=dydxopsdao-deposit-withdraw-monitor-traces \
  npx playwright test src/tests/ --reporter=line -g metamask-ethereum-usdc-deposit-regular
  ```

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
    datadog/
      index.ts               # Public API (createDepositLogger/createWithdrawLogger, step enums)
      core/
        types.ts             # Base interfaces and flow configuration pattern
        logger.ts            # Generic FlowTestRunLogger (flow-agnostic)
      flows/
        deposit.ts           # Deposit-specific config (steps, schema, route_kind)
        withdraw.ts          # Withdraw-specific config (steps, schema)
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

## Observability (Datadog)

- Purpose: single structured log per test run with funnel analysis and timings.
- Pattern: flow-agnostic core + flow configs.
- Directory: see `utils/datadog/` in project structure above.

Top-level concepts:
- Core: `FlowTestRunLogger` assembles the log, tracks steps, and sends to Datadog.
- Flows: each flow defines its own steps and log schema (deposit/withdraw).
- IDs: unique `test_id` matches report upload path for easy correlation.

Usage in tests:
- Import from `utils/datadog`: `datadog`, `DepositFunnelSteps` or `WithdrawFunnelSteps`.
- Create logger per test, call `startStep`/`completeStep`, then `logTestResult`.

Env:
- Required to send: `DD_API_KEY`, `DD_SITE`.
- Optional: `DD_SERVICE`, `DD_SOURCE`, `DD_VERBOSE=1`, `DD_DRY_RUN=1`, `DD_ENV` (default: `prod`).
- Local testing: set `DD_ENV=dev` in `.env.local` to isolate data from production.

---

## Troubleshooting [WIP]


**Rebalance failed**

* By design, **does not fail** the test. We log a `warning` and continue.

**Network flakiness**

* The spec separates errors into `pre_submit` vs `submit_or_finality`. You can add retries to pre‑submit only.

---

## Custom v4-client-js Dependency Fix

This project uses a custom build of `@dydxprotocol/v4-client-js` due to export issues in the official NPM package. The custom build is hosted on S3 and referenced directly in `package.json`.

### Why a custom build?

The official `@dydxprotocol/v4-client-js` package has incorrect exports that prevent proper module resolution by Playwright. Our custom build fixes these export issues.

### Building and updating the custom dependency

To update the custom dependency:

1. Clone our fork of the v4-clients repository:
   ```bash
   git clone https://github.com/dydxopsdao/v4-clients.git
   cd v4-clients
   ```
   *Note: This is our fork of the upstream [dydxprotocol/v4-clients](https://github.com/dydxprotocol/v4-clients) repository.*

2. Check out the fix branch:
   ```bash
   git checkout v4-client-js-3.0.3-fix-exports
   ```

3. Build and package:
   ```bash
   npm run build && npm pack
   ```
   This produces `dydxprotocol-v4-client-js-3.0.3.tgz`

4. Upload to S3:
   ```bash
   aws s3 cp dydxprotocol-v4-client-js-3.0.3.tgz s3://dydxopsdao-deposit-withdraw-monitor-v4-client-js-fix-exports/
   ```

5. Update `package.json` with the new S3 URL and install:
   ```bash
   npm install https://dydxopsdao-deposit-withdraw-monitor-v4-client-js-fix-exports.s3.ap-northeast-1.amazonaws.com/dydxprotocol-v4-client-js-3.0.3.tgz
   ```

**Note:** The S3 URL in `package.json` should be updated to point to the new file location after upload.
