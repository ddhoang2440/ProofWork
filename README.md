# ProofWork (Group Task DApp)

Decentralized Group Task Management & Verification DApp on **Avalanche Fuji Testnet** (`chainId: 43113`).

## Architecture Overview

- **`contracts/`**: Hardhat + Solidity (`^0.8.24`) + OpenZeppelin `AccessControl` (`GroupTask.sol`) + `ethers` v6.
- **`frontend/`**: React 18 + Vite + TypeScript (Strict Mode) + `ethers` v6 + React Router DOM v6.
- **`agent/`**: NestJS + TypeScript (Strict Mode) + `ethers` v6 (`WebSocketProvider`) + `class-validator`.
- **`shared/`**: Shared ABI (`shared/abi/GroupTask.json`) and deployed contract addresses (`shared/addresses.json`).

---

## Quick Start & Installation

### 1. Smart Contracts (`contracts/`)

```bash
cd contracts
cp .env.example .env
npm install
npm run compile
npm test
```

Deploy to Avalanche Fuji & export ABI/Addresses to `shared/`:

```bash
npm run deploy:fuji
npm run export
```

### 2. Frontend (`frontend/`)

```bash
cd frontend
cp .env.example .env
npm install
npm run build
npm run dev
```

### 3. AI Agent (`agent/`)

```bash
cd agent
cp .env.example .env
npm install
npm run build
npm run start:dev
```

Test manual evaluation endpoint:

```bash
curl -X POST http://localhost:3000/agent/evaluate \
  -H "Content-Type: application/json" \
  -H "x-demo-secret: super-secret-demo-key" \
  -d '{"taskId": 1, "title": "Implement UI", "proofHash": "0x123456"}'
```
