# Đặc tả Giao diện Smart Contract — `GroupTask.sol`

- **Tên Contract:** `GroupTask`
- **Phiên bản Solidity:** `^0.8.24`
- **Kế thừa:** `@openzeppelin/contracts/access/AccessControl.sol`
- **Mạng triển khai:** Avalanche Fuji C-Chain (`chainId: 43113`)
- **Hằng số Quyền (Role):**
  - `DEFAULT_ADMIN_ROLE = 0x00...00` (Mặc định của OpenZeppelin, cấp cho `deployer`)
  - `AGENT_ROLE = keccak256("AGENT_ROLE")` (Quyền dành riêng cho ví của AI Agent)

---

## 1. Định nghĩa `Enum` & `Struct`

### 1.1. Enum `TaskStatus`

| Giá trị số (`uint8`) | Tên trạng thái | Ý nghĩa |
| :---: | :--- | :--- |
| `0` | `Pending` | Task vừa được tạo, đang chờ nộp bằng chứng (`proofHash`). |
| `1` | `Submitted` | Người dùng đã nộp bằng chứng, đang chờ AI Agent đánh giá. |
| `2` | `Confirmed` | AI Agent đã xác nhận hoàn thành; chứng chỉ (`Certificate`) đã được cấp. |
| `3` | `Rejected` | AI Agent đã từ chối bằng chứng kèm lý do (`rejectReason`). |

### 1.2. Struct `Group`

```solidity
struct Group {
    uint256 id;          // Mã định danh nhóm (tự tăng từ 1)
    string name;         // Tên nhóm (tối đa 100 ký tự UTF-8/bytes)
    address creator;     // Địa chỉ ví người tạo nhóm
    uint256 createdAt;   // Thời điểm tạo nhóm (block.timestamp)
    bool exists;         // Cờ kiểm tra nhóm tồn tại
}
```

### 1.3. Struct `Task`

```solidity
struct Task {
    uint256 id;            // Mã định danh task (tự tăng từ 1)
    uint256 groupId;       // Mã nhóm chứa task này
    address creator;       // Địa chỉ ví người tạo task
    string title;          // Tiêu đề / mô tả ngắn của task
    bytes32 proofHash;     // Mã băm bằng chứng hoàn thành (mặc định 0x0)
    TaskStatus status;     // Trạng thái hiện tại của task
    string rejectReason;   // Lý do từ chối (rỗng nếu chưa/không bị từ chối)
    uint256 createdAt;     // Thời điểm tạo task (block.timestamp)
    uint256 completedAt;   // Thời điểm được Confirm (0 nếu chưa Confirmed)
}
```

### 1.4. Struct `Certificate`

```solidity
struct Certificate {
    uint256 taskId;        // Mã task đã hoàn thành
    uint256 groupId;       // Mã nhóm của task
    string taskTitle;      // Tên task
    address creator;       // Địa chỉ ví người tạo / hoàn thành task
    bytes32 proofHash;     // Bằng chứng đã được duyệt
    address confirmedBy;   // Địa chỉ ví Agent đã duyệt
    uint256 completedAt;   // Thời điểm hoàn thành (block.timestamp)
}
```

---

## 2. Định nghĩa Sự kiện (`Events`)

| Tên Event | Khai báo đầy đủ | Tham số `indexed` | Thời điểm phát (Emit) |
| :--- | :--- | :--- | :--- |
| **`GroupCreated`** | `event GroupCreated(uint256 indexed groupId, string name, address indexed creator);` | `groupId`, `creator` | Khi gọi `createGroup` thành công. |
| **`TaskCreated`** | `event TaskCreated(uint256 indexed taskId, uint256 indexed groupId, address indexed creator, string title);` | `taskId`, `groupId`, `creator` | Khi gọi `createTask` thành công. |
| **`TaskSubmitted`** | `event TaskSubmitted(uint256 indexed taskId, bytes32 proofHash, address indexed submitter);` | `taskId`, `submitter` | Khi gọi `submitEvidence` thành công. |
| **`TaskConfirmed`** | `event TaskConfirmed(uint256 indexed taskId, address indexed agent, uint256 completedAt);` | `taskId`, `agent` | Khi Agent gọi `confirmCompletion` thành công. |
| **`TaskRejected`** | `event TaskRejected(uint256 indexed taskId, address indexed agent, string reason);` | `taskId`, `agent` | Khi Agent gọi `rejectCompletion` thành công. |

---

## 3. Đặc tả Chi tiết 9 Hàm Giao tiếp

### 3.1. `createGroup`
- **Chữ ký hàm:** `function createGroup(string calldata name) external returns (uint256 groupId)`
- **Input:**
  - `name` (`string`): Tên nhóm (từ 1 đến 100 bytes).
- **Output:** `groupId` (`uint256`) — ID của nhóm vừa tạo (bắt đầu từ `1`).
- **Điều kiện (Pre-conditions):**
  - `require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid group name length")` (tránh chuỗi rỗng hoặc chuỗi quá dài gây tốn gas vô ích).
  - Bất kỳ địa chỉ ví nào đã kết nối đều có thể gọi.
- **Event emit:** `GroupCreated(groupId, name, msg.sender)`

### 3.2. `createTask`
- **Chữ ký hàm:** `function createTask(uint256 groupId, string calldata title) external returns (uint256 taskId)`
- **Input:**
  - `groupId` (`uint256`): ID của nhóm đã tồn tại.
  - `title` (`string`): Tên task (từ 1 đến 100 bytes).
- **Output:** `taskId` (`uint256`) — ID của task vừa tạo (bắt đầu từ `1`).
- **Điều kiện (Pre-conditions):**
  - Nhóm `groupId` phải tồn tại (`require(groups[groupId].exists, "Group does not exist")`).
  - `require(bytes(title).length > 0 && bytes(title).length <= 100, "Invalid task title length")` (giới hạn độ dài chuỗi để tối ưu gas).
  - Khởi tạo `status = TaskStatus.Pending`, `proofHash = bytes32(0)`.
- **Event emit:** `TaskCreated(taskId, groupId, msg.sender, title)`

### 3.3. `submitEvidence`
- **Chữ ký hàm:** `function submitEvidence(uint256 taskId, bytes32 proofHash) external`
- **Input:**
  - `taskId` (`uint256`): ID của task cần nộp bằng chứng.
  - `proofHash` (`bytes32`): Mã hash bằng chứng (cho phép truyền `0x00...00` để phục vụ kịch bản demo Agent từ chối).
- **Output:** Không có.
- **Điều kiện (Pre-conditions):**
  - Task `taskId` phải tồn tại (`tasks[taskId].id != 0`).
  - `tasks[taskId].status == TaskStatus.Pending` hoặc `TaskStatus.Rejected` (cho phép nộp lại nếu từng bị từ chối).
  - Cập nhật `tasks[taskId].proofHash = proofHash` và `tasks[taskId].status = TaskStatus.Submitted`.
- **Event emit:** `TaskSubmitted(taskId, proofHash, msg.sender)`

### 3.4. `confirmCompletion`
- **Chữ ký hàm:** `function confirmCompletion(uint256 taskId) external onlyRole(AGENT_ROLE)`
- **Input:**
  - `taskId` (`uint256`): ID của task được Agent duyệt.
- **Output:** Không có.
- **Điều kiện (Pre-conditions):**
  - **Access Control:** Người gọi (`msg.sender`) bắt buộc có quyền `AGENT_ROLE`.
  - **Task Status:** `tasks[taskId].status == TaskStatus.Submitted`.
  - Cập nhật `status = TaskStatus.Confirmed`, `completedAt = block.timestamp`, và tạo bản ghi `Certificate` tương ứng.
- **Event emit:** `TaskConfirmed(taskId, msg.sender, block.timestamp)`

### 3.5. `rejectCompletion`
- **Chữ ký hàm:** `function rejectCompletion(uint256 taskId, string calldata reason) external onlyRole(AGENT_ROLE)`
- **Input:**
  - `taskId` (`uint256`): ID của task bị từ chối.
  - `reason` (`string`): Lý do từ chối do Agent cung cấp (từ 1 đến 256 bytes).
- **Output:** Không có.
- **Điều kiện (Pre-conditions):**
  - **Access Control:** Người gọi (`msg.sender`) bắt buộc có quyền `AGENT_ROLE`.
  - **Task Status:** `tasks[taskId].status == TaskStatus.Submitted`.
  - `require(bytes(reason).length > 0 && bytes(reason).length <= 256, "Invalid reject reason length")`.
  - Cập nhật `status = TaskStatus.Rejected` và `rejectReason = reason`.
- **Event emit:** `TaskRejected(taskId, msg.sender, reason)`

### 3.6. `getTask`
- **Chữ ký hàm:** `function getTask(uint256 taskId) external view returns (Task memory)`
- **Input:** `taskId` (`uint256`).
- **Output:** Struct `Task` chứa đầy đủ thông tin của task.
- **Điều kiện:** Task `taskId` phải tồn tại (nếu không tồn tại thì revert `"Task does not exist"`).
- **Event emit:** Không (hàm `view`).

### 3.7. `getTasksByGroup`
- **Chữ ký hàm:** `function getTasksByGroup(uint256 groupId) external view returns (Task[] memory)`
- **Input:** `groupId` (`uint256`).
- **Output:** Mảng `Task[]` thuộc nhóm `groupId`.
- **Điều kiện:** Nhóm `groupId` phải tồn tại.
- **Event emit:** Không (hàm `view`).

### 3.8. `getCertificate`
- **Chữ ký hàm:** `function getCertificate(uint256 taskId) external view returns (Certificate memory)`
- **Input:** `taskId` (`uint256`).
- **Output:** Struct `Certificate` của task đã hoàn thành.
- **Điều kiện:**
  - Task `taskId` phải tồn tại và có `status == TaskStatus.Confirmed` (nếu chưa `Confirmed` thì revert `"Certificate not available"`).
- **Lưu ý truy vấn cho Frontend (MVP):**
  - Hàm `getCertificate` nhận đầu vào là `taskId` (không nhận địa chỉ ví). Để hiển thị danh sách chứng chỉ theo địa chỉ ví ở Màn hình 3 mà không cần sửa Contract hay dùng Indexer (như The Graph), Frontend thực hiện:
    1. Lấy danh sách các task qua `getTasksByGroup(groupId)` hoặc lặp qua danh sách `taskId` đã biết (được lưu vào `localStorage` khi tạo task / lắng nghe event).
    2. Lọc các task có `status == TaskStatus.Confirmed` và `creator` khớp với địa chỉ ví cần tìm, sau đó gọi `getCertificate(taskId)` để lấy chi tiết chứng chỉ.
- **Event emit:** Không (hàm `view`).

### 3.9. `grantAgentRole`
- **Chữ ký hàm:** `function grantAgentRole(address agent) external onlyRole(DEFAULT_ADMIN_ROLE)`
- **Input:** `agent` (`address`) — Địa chỉ ví của AI Agent (khác `address(0)`).
- **Output:** Không có.
- **Điều kiện:**
  - **Access Control:** Chỉ `DEFAULT_ADMIN_ROLE` (admin/deployer) mới được phép gọi.
  - `agent != address(0)`.
- **Event emit:** `RoleGranted(AGENT_ROLE, agent, msg.sender)` (sự kiện chuẩn của OpenZeppelin `AccessControl`).

