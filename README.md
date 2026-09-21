# CostGate

CostGate connects GitHub pull requests to a real SQL cost-analysis pipeline: GitHub webhook -> Amazon SQS -> processor Lambda -> VPC PostgreSQL analysis -> deterministic cost engine -> GitHub Check/PR comment -> DynamoDB prediction ledger.

## Application architecture

The Next.js frontend is a same-origin BFF. Browser requests never call the backend API directly. Protected pages require a signed `costgate_session` cookie, and Next.js proxies authenticated requests to the deployed API. This avoids CORS/session split-brain and keeps the GitHub OAuth secret server-side.

The authenticated data paths are:

- **Dashboard**: one `/api/dashboard` request per load, backed by user-scoped DynamoDB data.
- **PR Studio**: lists connected GitHub repositories and open PRs through the GitHub App; PR analysis is submitted to the processor Lambda and persisted as an asynchronous job.
- **Cost Simulator**: sends the user-entered workload/execution assumptions to the backend cost engine and renders its response.
- **Onboarding**: CostGate account -> GitHub OAuth -> GitHub App installation -> repository selection -> persisted cost policy.

There are no client-side fallback dashboard records or fabricated PR results.

## Deployment configuration

### Next.js

Set these environment variables in the Next.js deployment (Vercel, ECS, EC2, etc.):

```bash
NEXT_PUBLIC_SITE_URL=https://your-costgate-domain.example
COSTGATE_BACKEND_URL=https://your-api-id.execute-api.eu-north-1.amazonaws.com
COSTGATE_BACKEND_TIMEOUT_MS=15000
AUTH_JWT_SECRET=<same-value-used-by-sam-authjwtsecret>
GITHUB_CLIENT_ID=<github-oauth-app-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-app-client-secret>
GITHUB_APP_SLUG=<github-app-slug>
```

Use the same `AUTH_JWT_SECRET` value in both the frontend and the SAM stack. Do not set `COSTGATE_BACKEND_URL` to the Next.js origin.

### GitHub OAuth App

Configure the OAuth App callback URL to exactly:

```text
https://your-costgate-domain.example/api/auth/github/callback
```

The callback exchanges the authorization code server-side, verifies the returned GitHub identity, and then establishes the CostGate session.

### GitHub App

Set the GitHub App's **Setup URL** to exactly:

```text
https://your-costgate-domain.example/api/auth/github/setup
```

The onboarding install flow sends a signed state value to GitHub. CostGate verifies that state when GitHub returns from the App installation and then reloads the authenticated onboarding page.

### SAM backend

Deploy `template.yaml` with at least:

- `WebhookSecret`
- `AuthJwtSecret` (32+ characters, same value as the frontend)
- `GitHubAppId`
- `GitHubAppSlug`
- RDS/VPC/CUR parameters required by the analysis worker

The stack creates persistent DynamoDB tables for users, connected repositories, cost policy, PR Studio jobs, and prediction records.

Example: `sam build && sam deploy --guided`

The deployed API is exposed under `/api/{proxy+}` by `DashboardFunction`.

## Local frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in COSTGATE_BACKEND_URL, AUTH_JWT_SECRET and GitHub credentials.
npm install
npm run build
npm start
```

For a local backend/API Gateway emulator, set `COSTGATE_BACKEND_URL` to that backend URL—not port 3000 unless the backend really runs there.

## Important production behaviour

- Session cookies are `HttpOnly` and `SameSite=Lax`; production cookies are `Secure`.
- Browser API requests default to **zero automatic retries**. A transient error does not fan out into repeated dashboard traffic.
- Dashboard initial load is consolidated into one backend request instead of separate summary/authors/predictions/repos calls.
- Cost Simulator and PR Studio are protected both by the Next.js route group and by backend session validation.
- GitHub repository access is validated against the authenticated GitHub App installation rather than trusting arbitrary repository or installation IDs from the browser.
