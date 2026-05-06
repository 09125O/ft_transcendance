# Backend test quickstart

Les scenarios Node utilises par les commandes de verification backend sont ranges dans `backend/test/scenarios/`.

## Run tests locally

```bash
cd backend
npm run test
```

## Watch mode

```bash
cd backend
npm run test:watch
```

## CI mode with coverage

```bash
cd backend
npm run test:ci
```

## Critical WebSocket scenarios (QA-05)

```bash
cd backend
npm run test:ws-critical
```

## HTTP rate limit check (SEC-02)

```bash
cd backend
npm run test:rate-limit
```

## Social integration flow (friends + notifications + spectator)

```bash
cd backend
npm run test:integration:social
```
