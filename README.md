# Real-time WebSocket Dashboard with EIP-712 Auth

A real-time trading dashboard built with TypeScript, WebSocket, React (Vite), and EIP-712 signature authentication. Includes observability with Prometheus + Grafana.

## Tech Stack

- **Backend**: Node.js, TypeScript, WebSocket (`ws`), EIP-712 (`ethers.js`)
- **Frontend**: React 19, Vite, TypeScript
- **Testing**: Jest (unit), Playwright (E2E)
- **Observability**: Prometheus, Grafana
- **CI/CD**: GitHub Actions, SonarCloud

## Project Structure

```
├── server/
│   ├── eventEmitter.ts       # Custom EventEmitter (Map + Set)
│   ├── eventEmitter.test.ts  # Jest unit tests
│   ├── server.ts             # WebSocket server + Prometheus metrics
│   ├── serverWithAuth.ts     # WebSocket server with EIP-712 auth
│   └── clientWithAuth.ts     # Test client with wallet signing
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── hooks/usePriceStream.ts  # WebSocket React hook
│   └── e2e/                  # Playwright E2E tests
├── .github/workflows/
│   └── sonar.yml             # GitHub Actions + SonarCloud
├── docker-compose.yml        # Prometheus + Grafana
└── prometheus.yml            # Prometheus scrape config
```

## Prerequisites

- Node.js 20+
- Docker (for Prometheus + Grafana)

## Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## Running

### 1. WebSocket Server

```bash
# Server with EIP-712 auth
npm run rt:server
```

### 2. React Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`


## Testing

### Unit Tests (Jest)

```bash
npm test
```

### E2E Tests (Playwright)

```bash
# Install browsers (first time only)
cd frontend && npx playwright install

# Run E2E tests (server must be running)
npm run rt:server &
npx playwright test
```

## Observability

### Start Prometheus + Grafana

```bash
# Server must be running first (exposes /metrics on port 9090)
npm run rt:server

# Start containers
docker-compose up
```

| Service    | URL                        | Credentials   |
|------------|----------------------------|---------------|
| Metrics    | http://localhost:9090/metrics | —          |
| Prometheus | http://localhost:9091      | —             |
| Grafana    | http://localhost:3001      | admin / admin |

### Grafana Setup

1. Go to `http://localhost:3001`
2. **Connections** → **Add new connection** → Prometheus
3. URL: `http://prometheus:9090` → **Save & Test**
4. **Dashboards** → **New** → Add panel
5. Query: `ws_connected_clients` or `ws_auth_success_total`

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `ws_connected_clients` | Gauge | Current connected WebSocket clients |
| `ws_auth_success_total` | Counter | Total successful EIP-712 authentications |

## CI/CD

GitHub Actions runs on every push to `main` or `master`:
1. Install dependencies
2. Run Jest with coverage
3. SonarCloud code quality scan

Results at: https://sonarcloud.io/project/overview?id=ppooii27_event-websocket-EIP-712-signature
