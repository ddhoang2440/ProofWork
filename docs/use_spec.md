# User Flow & UI/UX Specification — `docs/use_spec.md`

The Frontend application (`frontend/`) consists of a shared navigation header and **3 primary screens** corresponding to the 3 stages of the Task lifecycle.

---

## 1. Shared Components (Global Layout & Guards)

1. **WalletConnectButton (`components/common/WalletConnectButton.tsx`):**
   - When disconnected: Displays a `"Connect Wallet"` button.
   - When connected: Displays the shortened wallet address (e.g., `0x1234...5678`).
2. **NetworkGuard (`components/common/NetworkGuard.tsx`):**
   - Checks the connected wallet's `chainId`.
   - If `chainId !== 43113` (Avalanche Fuji Testnet): Overlays a network warning prompt with a `"Switch to Avalanche Fuji"` button that invokes `switchToFuji()`.
3. **EventToast (`components/common/EventToast.tsx`):**
   - Displays a floating toast notification in the corner of the screen whenever an on-chain event (`GroupCreated`, `TaskCreated`, `TaskSubmitted`, `TaskConfirmed`, `TaskRejected`) is received, auto-dismissing after 5 seconds.

---

## 2. SCREEN 1: Create Page (`/create`)

**Purpose:** Allows users to create a Group, create a Task within a Group, and submit completion evidence (`proofHash`).

### UI Forms & Contract Mapping

| Section / Component | Form Inputs | Action Button | Contract Function Called |
| :--- | :--- | :--- | :--- |
| **1. Create Group Form**<br>(`CreateGroupForm.tsx`) | - `groupName` (Text input, required, max 100 chars, placeholder: `"Enter group name..."`) | **"Create Group"** | `createGroup(name)` |
| **2. Create Task Form**<br>(`CreateTaskForm.tsx`) | - `groupId` (Number/Select input, defaults to latest created group)<br>- `taskTitle` (Text input, required, max 100 chars, placeholder: `"Enter task title..."`) | **"Create Task"** | `createTask(groupId, title)` |
| **3. Submit Evidence Form**<br>(`SubmitEvidenceForm.tsx`) | - `taskId` (Number input, ID of the task)<br>- `proofHash` (`bytes32` hex string input `0x...`, includes quick-fill helper buttons *"Fill Valid Sample Hash"* and *"Fill Zero Hash 0x0"* for fast demoing) | **"Submit Evidence"** | `submitEvidence(taskId, proofHash)` |

### Required UI States on Screen 1

1. **Wallet Disconnected (`address == null`):**
   - Disable all form submission buttons and display a prompt reminding the user to click **"Connect Wallet"** first.
2. **Transaction in Progress (`isSubmitting == true`):**
   - While awaiting wallet signature or block confirmation (`await tx.wait()`):
   - Disable the active form's button and inputs.
   - Change button text to `"Processing transaction..."` with a loading spinner.
3. **Transaction Completed (`Success`):**
   - Re-enable the form and clear input fields.
   - Display a success banner showing the newly created `groupId` or `taskId` along with a transaction link.
4. **Transaction Failed (`Error`):**
   - If the user rejects the wallet prompt or the transaction reverts: Re-enable the button and display a clear red error message below the form.

---

## 3. SCREEN 2: Confirm Page (`/confirm`)

**Purpose:** Displays all Tasks in a group and visualizes real-time AI Agent evaluation (confirmation or rejection).

### Task List & Card Layout (`TaskList.tsx` & `TaskCard.tsx`)

- Allows selecting or entering a `groupId` to load tasks via `getTasksByGroup(groupId)`.
- Each Task is rendered as a **Task Card** containing:
  - Task ID (`#taskId`) & Title (`title`).
  - Shortened creator address (`creator`).
  - Shortened `proofHash` (or `"Not submitted"` if `Pending`).
  - Color-coded **Status Badge** and card border.

### Status Color Coding Specification

| Status (`TaskStatus`) | Primary Color | Badge Label | Additional UI Details |
| :--- | :--- | :--- | :--- |
| **`Pending` (`0`)** | **Gray** (`#64748b` / bg `#f1f5f9`) | `Pending Evidence` | Helper text: *"Submit evidence on the Create page"*. |
| **`Submitted` (`1`)** | **Yellow** (`#d97706` / bg `#fef3c7`) | `Agent Evaluating...` | Displays a pulsing indicator/spinner showing the AI Agent is analyzing the evidence. |
| **`Confirmed` (`2`)** | **Green** (`#16a34a` / bg `#dcfce7`) | `Confirmed` | Displays a green checkmark icon and the completion timestamp (`completedAt`). |
| **`Rejected` (`3`)** | **Red** (`#dc2626` / bg `#fee2e2`) | `Rejected` | Displays a warning icon with a **Tooltip** (or expandable section) showing the exact rejection reason (`rejectReason`) from the AI Agent. |

### Real-Time Update Mechanism

- While `/confirm` is open, `eventService.ts` listens for `TaskSubmitted`, `TaskConfirmed`, and `TaskRejected` events from `GroupTask.sol`.
- As soon as the AI Agent executes `confirmCompletion(taskId)` or `rejectCompletion(taskId, reason)` on-chain:
  1. The matching `TaskCard` (`id == taskId`) **automatically transitions color** from **Yellow** to **Green** (or **Red**) without requiring a page refresh (F5).
  2. `EventToast` pops up in the corner announcing the result.

---

## 4. SCREEN 3: Certificate Page (`/certificates`)

**Purpose:** Searches and showcases verifiable On-Chain Completion Certificates for tasks confirmed by the AI Agent (`Confirmed`).

### MVP Data Query Strategy (Without Contract Changes)

Because `getCertificate(uint256 taskId)` on the Smart Contract accepts a `taskId` (rather than a wallet `address`), the Frontend performs wallet-based certificate lookup as follows:
1. Read known `groupId` / `taskId` values stored in browser `localStorage` (or fetch tasks via `getTasksByGroup(groupId)`).
2. Iterate over the tasks and filter those with `status === TaskStatus.Confirmed` and `creator.toLowerCase() === searchWalletAddress.toLowerCase()` (if the search box is empty, include all `Confirmed` tasks).
3. For each matching `taskId`, call `getCertificate(taskId)` (combined with `TaskConfirmed` event logs or `localStorage` to retrieve the `txHash`) and render the certificate cards.

### UI Components

1. **Wallet Address Search Input (`WalletSearchInput.tsx`):**
   - Text input for entering a wallet address (`0x...`), paired with a **"Search"** button and a quick **"My Wallet"** button (auto-fills the currently connected wallet address).
2. **Certificate List (`CertificateList.tsx`):**
   - Renders the filtered list of `CertificateCard` components.
   - **Important Rule:** Strictly display **only** tasks with `Confirmed` status. Tasks in `Pending`, `Submitted`, or `Rejected` status must never appear on this screen.
3. **Certificate Card (`CertificateCard.tsx` & `ExplorerLink.tsx`):**
   - Styled as an official completion certificate displaying 5 distinct fields:
     1. **Task Title (`taskTitle`):** Title of the completed task.
     2. **Creator Address (`creator`):** Wallet address of the task creator.
     3. **Completion Date (`completedAt`):** Formatted human-readable timestamp (`YYYY-MM-DD HH:mm:ss`).
     4. **Evidence Hash (`proofHash`):** The `bytes32` hash submitted by the user via `submitEvidence` (displayed as reference metadata).
     5. **Transaction Hash (`txHash`):** The on-chain transaction hash generated by the Avalanche Fuji network when the task was confirmed (retrieved from `TaskConfirmed` event logs or `localStorage`), linked via `ExplorerLink` directly to Snowtrace (`https://testnet.snowtrace.io/tx/<txHash>`). If `txHash` is unavailable in the current session, fallback to the contract address link (`https://testnet.snowtrace.io/address/<contractAddress>`).
