# Real-time WebSocket Dashboard with EIP-712 Auth

A real-time trading dashboard built with TypeScript, WebSocket, React (Vite), and EIP-712 signature authentication. Includes observability with Prometheus + Grafana, deployable via Docker or Kubernetes.

## Tech Stack

- **Backend**: Node.js, TypeScript, WebSocket (`ws`), EIP-712 (`ethers.js`)
- **Frontend**: React 19, Vite, TypeScript, nginx
- **Testing**: Jest (unit), Playwright (E2E)
- **Observability**: Prometheus, Grafana
- **CI/CD**: GitHub Actions, SonarCloud
- **Container**: Docker, Kubernetes

## Project Structure

```
├── server/
│   ├── eventEmitter.ts       # Custom EventEmitter (Map + Set)
│   ├── eventEmitter.test.ts  # Jest unit tests
│   ├── server.ts             # WebSocket server + Prometheus metrics
│   ├── serverWithAuth.ts     # WebSocket server with EIP-712 auth
│   └── clientWithAuth.ts     # Test client with wallet signing
├── frontend/
│   ├── Dockerfile            # Multi-stage build (node → nginx)
│   ├── src/
│   │   ├── App.tsx
│   │   └── hooks/usePriceStream.ts  # WebSocket React hook with EIP-712
│   └── e2e/                  # Playwright E2E tests
├── k8s/
│   ├── deployment.yaml       # ws-server Deployment (3 replicas)
│   ├── service.yaml          # ws-server Service
│   ├── frontend.yaml         # frontend Deployment + Service
│   ├── prometheus.yaml       # Prometheus ConfigMap + Deployment + Service
│   └── grafana.yaml          # Grafana Deployment + Service
├── Dockerfile                # ws-server Docker image
├── docker-compose.yml        # Local dev: Prometheus + Grafana
├── prometheus.yml            # Prometheus scrape config (local)
├── sonar-project.properties  # SonarCloud config
└── .github/workflows/
    └── sonar.yml             # GitHub Actions + SonarCloud
```

## Prerequisites

- Node.js 20+
- Docker Desktop (with Kubernetes enabled for k8s deployment)

## Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## Running (Local Dev)

### 1. WebSocket Server

```bash
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

# Run E2E tests (server must be running first)
npm run rt:server &
npx playwright test
```

## Observability (Local — docker-compose)

```bash
# Server must be running first (exposes /metrics on port 9090)
npm run rt:server

# Start Prometheus + Grafana containers
docker-compose up
```

| Service    | URL                           | Credentials   |
|------------|-------------------------------|---------------|
| Metrics    | http://localhost:9090/metrics | —             |
| Prometheus | http://localhost:9091         | —             |
| Grafana    | http://localhost:3001         | admin / admin |

Grafana Data Source URL: `http://prometheus:9090`

## Kubernetes Deployment

### Prerequisites

Enable Kubernetes in Docker Desktop: Settings → Kubernetes → Enable Kubernetes

### Build Docker Images

```bash
# Build ws-server image
docker build -t ws-server:latest .

# Build frontend image
docker build -t frontend:latest ./frontend
```

### Deploy All Services

```bash
kubectl apply -f k8s/
```

### Check Status

```bash
kubectl get pods
kubectl get services
```

### Service URLs (Kubernetes)

| Service    | URL                           | Credentials   |
|------------|-------------------------------|---------------|
| ws-server  | ws://localhost:8765           | —             |
| Metrics    | http://localhost:9090/metrics | —             |
| Frontend   | http://localhost:3000         | —             |
| Prometheus | http://localhost:9091         | —             |
| Grafana    | http://localhost:3001         | admin / admin |

Grafana Data Source URL (inside k8s): `http://prometheus:9091`

### Scale ws-server

```bash
kubectl scale deployment ws-server --replicas=5
kubectl get pods
```

### Rolling Update (zero downtime)

```bash
# Rebuild image
docker build -t ws-server:latest .

# Restart pods with new image
kubectl rollout restart deployment/ws-server
```

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
