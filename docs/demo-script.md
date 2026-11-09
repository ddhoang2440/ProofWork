# Detailed Demo Script — ProofWork

This document provides a step-by-step walkthrough for demonstrating the **ProofWork** DApp on **Avalanche Fuji Testnet (Chain ID: 43113)**.

---

## Pre-Demo Checklist

1. **Smart Contract:** `GroupTask.sol` is deployed to Avalanche Fuji, `AGENT_ROLE` is granted to the Agent wallet (`grantAgentRole`), and `npm run export` has been executed to populate `shared/abi/GroupTask.json` and `shared/addresses.json`.
2. **AI Agent (`agent/`):** Running on port `3000` (`npm run start:dev`). Verify via `GET http://localhost:3000/agent/health` returning `"status": "ok"`.
3. **Frontend (`frontend/`):** Running (`npm run dev`) in a browser with MetaMask connected to Avalanche Fuji Testnet and funded with test AVAX.

---

## Scenario 1: Happy Path (Automatic Confirmation & Certificate Issuance)

**Objective:** Demonstrate the end-to-end flow from creating a group and task, submitting valid evidence, automatic AI Agent verification via WebSocket events, to real-time Frontend UI updates and on-chain Certificate lookup.

| Step | Action | Expected System Outcome |
| :---: | :--- | :--- |
| **Step 1** | Open **Create Page** (`/create`). Click **Connect Wallet** in the navigation bar and approve the MetaMask connection on Avalanche Fuji (`43113`). | The Connect button displays the shortened wallet address (e.g., `0x1234...abcd`). All forms on the page become enabled. |
| **Step 2** | - In **Create Group Form**: Enter group name `"Web3 Hackathon Team"` -> Click **Create Group** -> Confirm in MetaMask.<br>- In **Create Task Form**: Enter `groupId = 1` and task title `"Design Smart Contract Architecture"` -> Click **Create Task** -> Confirm in MetaMask. | - Transactions succeed; UI shows notifications for `groupId = 1` and `taskId = 1`.<br>- On the **Confirm Page** (`/confirm`), the `Task #1` card appears in **Gray (`Pending`)**. |
| **Step 3** | In **Submit Evidence Form**: Enter `taskId = 1` and a valid non-zero `proofHash`, e.g.:<br>`0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`<br>Click **Submit Evidence** and sign the transaction. | - Smart Contract emits `TaskSubmitted(1, proofHash, userAddress)`.<br>- On **Confirm Page** (`/confirm`), the `Task #1` card turns **Yellow (`Submitted` - Agent Evaluating...)**. |
| **Step 4** | Observe the **AI Agent** terminal (no manual action required). | - Agent receives `TaskSubmitted` via WebSocket.<br>- `LlmService` evaluates `proofHash != 0x0` -> returns `decision: "CONFIRM"`.<br>- Agent automatically signs and sends `confirmCompletion(1)` to Fuji.<br>- Smart Contract emits `TaskConfirmed(1, agentAddress, completedAt)`. |
| **Step 5** | Observe **Confirm Page** (`/confirm`) and navigate to **Certificate Page** (`/certificates`). | - **Confirm Page:** `Task #1` card automatically transitions from **Yellow** to **Green (`Confirmed`)** without refreshing the page (F5), accompanied by a Toast notification `"Task #1 confirmed by AI Agent!"`.<br>- **Certificate Page:** Enter the creator's wallet address in the search input -> Displays the **Certificate Card** for `Task #1` with completion timestamp, `proofHash`, and a Snowtrace transaction link. |

---

## Scenario 2: Reject Path (Invalid Evidence Rejection)

**Objective:** Demonstrate that the AI Agent detects invalid/empty evidence (`0x0`) and records an on-chain rejection with a clear reason.

| Step | Action | Expected System Outcome |
| :---: | :--- | :--- |
| **Step 1** | Create `Task #2` (`"Write Contract Unit Tests"`). In **Submit Evidence Form**, enter `taskId = 2` and an empty zero hash:<br>`0x0000000000000000000000000000000000000000000000000000000000000000` (or `0x0`).<br>Click **Submit Evidence** and sign the transaction. | - Smart Contract emits `TaskSubmitted(2, 0x00...00, userAddress)`.<br>- On **Confirm Page**, `Task #2` appears in **Yellow (`Submitted`)**. |
| **Step 2** | Observe the **AI Agent** terminal. | - Agent receives `TaskSubmitted` for `Task #2`.<br>- `LlmService` detects `proofHash == 0x0` -> returns `decision: "REJECT"` with reason `"Invalid evidence: proofHash is empty (0x0)."`<br>- Agent automatically calls `rejectCompletion(2, reason)` on the Smart Contract.<br>- Smart Contract emits `TaskRejected(2, agentAddress, reason)`. |
| **Step 3** | Observe **Confirm Page** (`/confirm`) and **Certificate Page** (`/certificates`). | - **Confirm Page:** `Task #2` automatically turns **Red (`Rejected`)**, triggers a warning Toast, and displays the Agent's rejection reason inside a tooltip/badge.<br>- **Certificate Page:** `Task #2` is **not** issued a certificate and does not appear in the certificate list. |

---

## Scenario 3: Fallback Path (When WebSocket Drops)

**Objective:** Guarantee 100% demo reliability even if venue Wi-Fi or the public Fuji WebSocket RPC experiences latency or disconnection.

| Step | Action | Expected System Outcome |
| :---: | :--- | :--- |
| **Step 1** | Suppose the user submitted evidence for `Task #3` (status is **Yellow - `Submitted`**), but after 10 seconds the public WebSocket has not delivered the event to the Agent. | `Task #3` remains in `Submitted` status on the UI. |
| **Step 2** | Trigger the manual evaluation endpoint via `curl` (or a fallback button):<br>```bash
curl -X POST http://localhost:3000/agent/evaluate \
  -H "Content-Type: application/json" \
  -H "x-demo-secret: super-secret-demo-key" \
  -d '{"taskId": 3}'
``` | - Agent immediately calls `contract.getTask(3)` over RPC to fetch the latest on-chain state.<br>- Agent evaluates the task and sends `confirmCompletion(3)` or `rejectCompletion(3)` on-chain.<br>- API responds with JSON containing `status`, `decision`, `reason`, and `txHash`. |
| **Step 3** | Observe **Confirm Page** (`/confirm`). | `Task #3` updates to its final state (`Confirmed` or `Rejected`) as soon as the transaction is mined. |
