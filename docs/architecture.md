# System Architecture — ProofWork

## 1. High-Level Architecture Diagram

```mermaid
flowchart LR
    User(["User (MetaMask)"])
    FE["Frontend DApp\n(React + Vite + ethers v6)"]
    SC["Smart Contract: GroupTask.sol\n(Avalanche Fuji - Chain ID 43113)"]
    Agent["AI Agent Backend\n(NestJS + ethers v6)"]
    LLM["LLM Provider / Rule Fallback"]

    User -->|"UI Interaction & Sign Tx"| FE
    FE -->|"JSON-RPC (Write/Read)"| SC
    SC -.->|"WebSocket Events\n(TaskSubmitted, TaskConfirmed, TaskRejected)"| FE
    SC -.->|"WebSocket Event\n(TaskSubmitted)"| Agent
    Agent -->|"Analyze Evidence"| LLM
    LLM -->|"Decision: CONFIRM / REJECT"| Agent
    Agent -->|"Signed Tx: confirmCompletion / rejectCompletion"| SC
    FE -.->|"HTTP Fallback: POST /agent/evaluate"| Agent
```

---

## 2. End-to-End Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend (React)
    participant SC as GroupTask Contract (Fuji)
    participant Agent as AI Agent (NestJS)
    participant LLM as LLM Service

    User->>FE: Enter details & click Create Group / Create Task
    FE->>SC: createGroup(name) -> createTask(groupId, title)
    SC-->>FE: Emit GroupCreated / TaskCreated (status = Pending)

    User->>FE: Enter evidence hash (proofHash) & click Submit
    FE->>SC: submitEvidence(taskId, proofHash)
    SC-->>FE: Emit TaskSubmitted(taskId, proofHash, submitter)
    SC-->>Agent: Emit TaskSubmitted(taskId, proofHash, submitter)

    Agent->>SC: getTask(taskId) to fetch task details
    Agent->>LLM: evaluate(task)
    LLM-->>Agent: { decision: "CONFIRM" | "REJECT", reason }

    alt Decision == CONFIRM
        Agent->>SC: confirmCompletion(taskId)
        SC-->>FE: Emit TaskConfirmed(taskId, agentAddress, completedAt)
        FE->>User: Auto-update card to Green (Confirmed) + show Toast
    else Decision == REJECT
        Agent->>SC: rejectCompletion(taskId, reason)
        SC-->>FE: Emit TaskRejected(taskId, agentAddress, reason)
        FE->>User: Auto-update card to Red (Rejected) + display reason
    end

    User->>FE: Open Certificate Page & search by wallet address
    FE->>SC: getCertificate(taskId)
    SC-->>FE: Return Certificate data (Confirmed tasks only)
```

---

## 3. Roles of the 3 Core Components

| Component | Tech Stack | Primary Responsibility |
| :--- | :--- | :--- |
| **1. Smart Contract (`contracts/`)** | Solidity `^0.8.24`, Hardhat, OpenZeppelin `AccessControl` | Stores all on-chain state (`Group`, `Task`, `Certificate`), enforces role-based access control (`AGENT_ROLE`, `DEFAULT_ADMIN_ROLE`), and emits events upon state transitions. |
| **2. Frontend (`frontend/`)** | React 18, Vite, TypeScript, `ethers.js` v6 | Provides the 3-screen web interface (Create, Confirm, Certificate), connects to MetaMask on Avalanche Fuji (`43113`), sends user transactions, and listens to real-time on-chain events. |
| **3. AI Agent (`agent/`)** | NestJS, TypeScript, `ethers.js` v6 (`WebSocketProvider`) | Listens to `TaskSubmitted` events from the Smart Contract via WebSocket, evaluates evidence (`proofHash`) using an LLM (with a deterministic rule-based fallback), and signs `confirmCompletion` or `rejectCompletion` transactions using the `AGENT_ROLE` wallet. |

---

## 4. Communication & State Synchronization Rules

1. **How does the Frontend know when the Agent has finished evaluating?**
   - The Frontend does **not** poll the Agent backend continuously; instead, it subscribes directly to on-chain events (`contract.on("TaskConfirmed", ...)` and `contract.on("TaskRejected", ...)`) via `eventService.ts`.
   - As soon as the Agent's transaction is confirmed on Avalanche Fuji, the Smart Contract emits `TaskConfirmed` or `TaskRejected`. The Frontend catches the event, immediately updates the corresponding Task Card UI, and triggers an `EventToast` notification without requiring a page reload (F5).
2. **How does the Agent detect newly submitted evidence?**
   - The Agent connects to Avalanche Fuji via `WebSocketProvider` and listens for `TaskSubmitted(uint256 indexed taskId, bytes32 proofHash, address indexed submitter)`.
3. **Fallback Mechanism (When WebSocket disconnects):**
   - If the WebSocket connection drops during a live demo, the Frontend or operator can invoke the HTTP endpoint `POST /agent/evaluate` with the `x-demo-secret` header and `{ "taskId": number }` payload to trigger the Agent to fetch on-chain state and execute evaluation immediately.
4. **Shared ABI & Contract Addresses (`shared/`):**
   - After compiling and deploying in `contracts/`, the `export.ts` script exports the ABI to `shared/abi/GroupTask.json` and deployed addresses to `shared/addresses.json`. Both `frontend/` and `agent/` import from `shared/` to guarantee 100% signature and event compatibility.
