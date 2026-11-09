# Smart Contract Interface Specification — `GroupTask.sol`

- **Contract Name:** `GroupTask`
- **Solidity Version:** `^0.8.24`
- **Inheritance:** `@openzeppelin/contracts/access/AccessControl.sol`
- **Target Network:** Avalanche Fuji C-Chain (`chainId: 43113`)
- **Role Constants:**
  - `DEFAULT_ADMIN_ROLE = 0x00...00` (Default OpenZeppelin admin role, granted to `deployer`)
  - `AGENT_ROLE = keccak256("AGENT_ROLE")` (Dedicated role granted to the AI Agent wallet)

---

## 1. `Enum` & `Struct` Definitions

### 1.1. Enum `TaskStatus`

| Numeric Value (`uint8`) | Status Name | Description |
| :---: | :--- | :--- |
| `0` | `Pending` | Task has been created and is awaiting evidence submission (`proofHash`). |
| `1` | `Submitted` | User has submitted evidence; awaiting evaluation by the AI Agent. |
| `2` | `Confirmed` | AI Agent has verified completion; an on-chain `Certificate` has been issued. |
| `3` | `Rejected` | AI Agent has rejected the evidence with a specific reason (`rejectReason`). |

### 1.2. Struct `Group`

```solidity
struct Group {
    uint256 id;          // Unique group identifier (auto-incremented starting from 1)
    string name;         // Group name (1 to 100 UTF-8 bytes)
    address creator;     // Wallet address of the group creator
    uint256 createdAt;   // Group creation timestamp (block.timestamp)
    bool exists;         // Flag indicating whether the group exists
}
```

### 1.3. Struct `Task`

```solidity
struct Task {
    uint256 id;            // Unique task identifier (auto-incremented starting from 1)
    uint256 groupId;       // ID of the group this task belongs to
    address creator;       // Wallet address of the task creator
    string title;          // Short title / description of the task (1 to 100 bytes)
    bytes32 proofHash;     // Evidence hash submitted for completion (default 0x0)
    TaskStatus status;     // Current lifecycle status of the task
    string rejectReason;   // Rejection reason (empty if not rejected)
    uint256 createdAt;     // Task creation timestamp (block.timestamp)
    uint256 completedAt;   // Confirmation timestamp (0 if not Confirmed)
}
```

### 1.4. Struct `Certificate`

```solidity
struct Certificate {
    uint256 taskId;        // ID of the completed task
    uint256 groupId;       // Group ID of the task
    string taskTitle;      // Title of the completed task
    address creator;       // Wallet address of the task creator / completer
    bytes32 proofHash;     // Verified evidence hash
    address confirmedBy;   // Wallet address of the AI Agent that confirmed the task
    uint256 completedAt;   // Completion timestamp (block.timestamp)
}
```

---

## 2. Event Definitions (`Events`)

| Event Name | Full Solidity Signature | `indexed` Parameters | Emitted When |
| :--- | :--- | :--- | :--- |
| **`GroupCreated`** | `event GroupCreated(uint256 indexed groupId, string name, address indexed creator);` | `groupId`, `creator` | `createGroup` succeeds. |
| **`TaskCreated`** | `event TaskCreated(uint256 indexed taskId, uint256 indexed groupId, address indexed creator, string title);` | `taskId`, `groupId`, `creator` | `createTask` succeeds. |
| **`TaskSubmitted`** | `event TaskSubmitted(uint256 indexed taskId, bytes32 proofHash, address indexed submitter);` | `taskId`, `submitter` | `submitEvidence` succeeds. |
| **`TaskConfirmed`** | `event TaskConfirmed(uint256 indexed taskId, address indexed agent, uint256 completedAt);` | `taskId`, `agent` | Agent calls `confirmCompletion` successfully. |
| **`TaskRejected`** | `event TaskRejected(uint256 indexed taskId, address indexed agent, string reason);` | `taskId`, `agent` | Agent calls `rejectCompletion` successfully. |

---

## 3. Detailed Specification of the 9 Contract Functions

### 3.1. `createGroup`
- **Signature:** `function createGroup(string calldata name) external returns (uint256 groupId)`
- **Input:**
  - `name` (`string`): Group name (1 to 100 bytes).
- **Output:** `groupId` (`uint256`) — ID of the newly created group (starts at `1`).
- **Pre-conditions:**
  - `require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid group name length")` (prevents empty strings or excessively long strings that waste gas).
  - Callable by any connected wallet address.
- **Emitted Event:** `GroupCreated(groupId, name, msg.sender)`

### 3.2. `createTask`
- **Signature:** `function createTask(uint256 groupId, string calldata title) external returns (uint256 taskId)`
- **Input:**
  - `groupId` (`uint256`): ID of an existing group.
  - `title` (`string`): Task title (1 to 100 bytes).
- **Output:** `taskId` (`uint256`) — ID of the newly created task (starts at `1`).
- **Pre-conditions:**
  - Group `groupId` must exist (`require(groups[groupId].exists, "Group does not exist")`).
  - `require(bytes(title).length > 0 && bytes(title).length <= 100, "Invalid task title length")`.
  - Initializes `status = TaskStatus.Pending` and `proofHash = bytes32(0)`.
- **Emitted Event:** `TaskCreated(taskId, groupId, msg.sender, title)`

### 3.3. `submitEvidence`
- **Signature:** `function submitEvidence(uint256 taskId, bytes32 proofHash) external`
- **Input:**
  - `taskId` (`uint256`): ID of the task to submit evidence for.
  - `proofHash` (`bytes32`): Evidence hash (allows `0x00...00` to support the Agent rejection demo scenario).
- **Output:** None.
- **Pre-conditions:**
  - Task `taskId` must exist (`tasks[taskId].id != 0`).
  - `tasks[taskId].status == TaskStatus.Pending` or `TaskStatus.Rejected` (allows resubmission after rejection).
  - Updates `tasks[taskId].proofHash = proofHash` and `tasks[taskId].status = TaskStatus.Submitted`.
- **Emitted Event:** `TaskSubmitted(taskId, proofHash, msg.sender)`

### 3.4. `confirmCompletion`
- **Signature:** `function confirmCompletion(uint256 taskId) external onlyRole(AGENT_ROLE)`
- **Input:**
  - `taskId` (`uint256`): ID of the task confirmed by the Agent.
- **Output:** None.
- **Pre-conditions:**
  - **Access Control:** Caller (`msg.sender`) must hold `AGENT_ROLE`.
  - **Task Status:** `tasks[taskId].status == TaskStatus.Submitted`.
  - Updates `status = TaskStatus.Confirmed`, `completedAt = block.timestamp`, and stores the corresponding `Certificate` record.
- **Emitted Event:** `TaskConfirmed(taskId, msg.sender, block.timestamp)`

### 3.5. `rejectCompletion`
- **Signature:** `function rejectCompletion(uint256 taskId, string calldata reason) external onlyRole(AGENT_ROLE)`
- **Input:**
  - `taskId` (`uint256`): ID of the rejected task.
  - `reason` (`string`): Rejection reason provided by the Agent (1 to 256 bytes).
- **Output:** None.
- **Pre-conditions:**
  - **Access Control:** Caller (`msg.sender`) must hold `AGENT_ROLE`.
  - **Task Status:** `tasks[taskId].status == TaskStatus.Submitted`.
  - `require(bytes(reason).length > 0 && bytes(reason).length <= 256, "Invalid reject reason length")`.
  - Updates `status = TaskStatus.Rejected` and `rejectReason = reason`.
- **Emitted Event:** `TaskRejected(taskId, msg.sender, reason)`

### 3.6. `getTask`
- **Signature:** `function getTask(uint256 taskId) external view returns (Task memory)`
- **Input:** `taskId` (`uint256`).
- **Output:** `Task` struct containing full task metadata.
- **Pre-conditions:** Task `taskId` must exist (reverts with `"Task does not exist"` otherwise).
- **Emitted Event:** None (`view` function).

### 3.7. `getTasksByGroup`
- **Signature:** `function getTasksByGroup(uint256 groupId) external view returns (Task[] memory)`
- **Input:** `groupId` (`uint256`).
- **Output:** Array of `Task[]` belonging to `groupId`.
- **Pre-conditions:** Group `groupId` must exist.
- **Emitted Event:** None (`view` function).

### 3.8. `getCertificate`
- **Signature:** `function getCertificate(uint256 taskId) external view returns (Certificate memory)`
- **Input:** `taskId` (`uint256`).
- **Output:** `Certificate` struct for the completed task.
- **Pre-conditions:**
  - Task `taskId` must exist and have `status == TaskStatus.Confirmed` (reverts with `"Certificate not available"` if not `Confirmed`).
- **Frontend Query Note (MVP):**
  - `getCertificate` takes a `taskId` (not a wallet address). To display certificates filtered by wallet address on Screen 3 without modifying the contract or deploying an indexer (such as The Graph), the Frontend should:
    1. Fetch tasks via `getTasksByGroup(groupId)` or iterate over known `taskId` values stored in `localStorage`.
    2. Filter tasks where `status == TaskStatus.Confirmed` and `creator` matches the searched wallet address, then call `getCertificate(taskId)` for each matching task.
- **Emitted Event:** None (`view` function).

### 3.9. `grantAgentRole`
- **Signature:** `function grantAgentRole(address agent) external onlyRole(DEFAULT_ADMIN_ROLE)`
- **Input:** `agent` (`address`) — Wallet address of the AI Agent (must not be `address(0)`).
- **Output:** None.
- **Pre-conditions:**
  - **Access Control:** Only `DEFAULT_ADMIN_ROLE` (admin/deployer) can call this function.
  - `require(agent != address(0), "Invalid agent address")`.
- **Emitted Event:** `RoleGranted(AGENT_ROLE, agent, msg.sender)` (standard OpenZeppelin `AccessControl` event).
