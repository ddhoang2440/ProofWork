# AI Agent API Specification — `agent/`

The AI Agent (NestJS) acts both as a **Background Worker** (listening to `TaskSubmitted` events via WebSocket) and as a **REST API Server** for health monitoring (`health`) and manual evaluation fallback (`evaluate`).

- **Base URL (Local):** `http://localhost:3000`
- **Content Type:** `application/json`

---

## 1. `POST /agent/evaluate`

Triggers the AI Agent to read task data from the Smart Contract, evaluate its evidence (`proofHash`), and submit either a `confirmCompletion` or `rejectCompletion` transaction to the Avalanche Fuji network.

### Required Headers

| Header | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `Content-Type` | `string` | Yes | `application/json` |
| `x-demo-secret` | `string` | Yes | Secret key matching the `DEMO_SECRET` environment variable on the Agent server. |

### Request Body

```json
{
  "taskId": 1
}
```

| Field | Type | Required | Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- |
| `taskId` | `number` | Yes | `@IsInt()`, `@Min(1)` | On-chain ID of the Task (must currently be in `Submitted` status). |

### Success Response (`200 OK` / `201 Created`)

**When the Agent confirms the task (`CONFIRM`):**

```json
{
  "status": "success",
  "decision": "CONFIRM",
  "reason": "Valid proofHash verified by AI Agent.",
  "txHash": "0x8a7d9f3c2e1b4a6d8f0c1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c"
}
```

**When the Agent rejects the task (`REJECT`):**

```json
{
  "status": "success",
  "decision": "REJECT",
  "reason": "Invalid evidence: proofHash is empty (0x0).",
  "txHash": "0x4b9e1a2c3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
}
```

### Error Responses

| HTTP Status | Cause | Example Payload |
| :---: | :--- | :--- |
| `400 Bad Request` | Invalid `taskId` or the on-chain task is not in `Submitted` status. | `{ "statusCode": 400, "message": "Task #1 is not in Submitted status" }` |
| `401 Unauthorized` | Missing or invalid `x-demo-secret` header. | `{ "statusCode": 401, "message": "Invalid or missing x-demo-secret header" }` |
| `404 Not Found` | `taskId` does not exist on the Smart Contract. | `{ "statusCode": 404, "message": "Task #999 does not exist" }` |
| `500 Internal Server Error` | RPC failure or reverted on-chain transaction. | `{ "statusCode": 500, "message": "Failed to submit transaction to Fuji" }` |

---

## 2. `GET /agent/health`

Checks the operational status of the AI Agent service, the latest synced block number, and the wallet address used by the Agent to sign transactions.

### Headers

No authentication headers required (`Public endpoint`).

### Success Response (`200 OK`)

```json
{
  "status": "ok",
  "lastProcessedBlock": 38492015,
  "agentAddress": "0x71C95911E9a5D330f4D621842EC243EE1343292e"
}
```

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | `string` | Always returns `"ok"` when the service is healthy. |
| `lastProcessedBlock` | `number` | Latest Avalanche Fuji block number processed by the Agent. |
| `agentAddress` | `string` | Wallet address of the Agent (granted `AGENT_ROLE` on `GroupTask.sol`). |
