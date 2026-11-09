# Đặc tả API của AI Agent — `agent/`

AI Agent (NestJS) vừa đóng vai trò **Background Worker** (lắng nghe sự kiện `TaskSubmitted` qua WebSocket), vừa cung cấp **REST API** để kiểm tra trạng thái hoạt động (`health`) và kích hoạt đánh giá thủ công (`evaluate` fallback) khi cần thiết.

- **Base URL (Local):** `http://localhost:3000`
- **Định dạng dữ liệu:** `application/json`

---

## 1. `POST /agent/evaluate`

Kích hoạt AI Agent đọc dữ liệu task từ Smart Contract, thực hiện đánh giá bằng chứng (`proofHash`) và gửi giao dịch `confirmCompletion` hoặc `rejectCompletion` lên mạng Avalanche Fuji.

### Headers bắt buộc

| Header | Kiểu | Bắt buộc | Mô tả |
| :--- | :--- | :---: | :--- |
| `Content-Type` | `string` | Có | `application/json` |
| `x-demo-secret` | `string` | Có | Khóa bí mật khớp với biến môi trường `DEMO_SECRET` trên server Agent. |

### Request Body

```json
{
  "taskId": 1
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc (Validation) | Mô tả |
| :--- | :--- | :---: | :--- | :--- |
| `taskId` | `number` | Có | `@IsInt()`, `@Min(1)` | Mã định danh của Task trên Smart Contract (đang ở trạng thái `Submitted`). |

### Response Thành công (`200 OK` / `201 Created`)

**Trường hợp Agent duyệt (CONFIRM):**

```json
{
  "status": "success",
  "decision": "CONFIRM",
  "reason": "Valid proofHash verified by AI Agent.",
  "txHash": "0x8a7d9f3c2e1b4a6d8f0c1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c"
}
```

**Trường hợp Agent từ chối (REJECT):**

```json
{
  "status": "success",
  "decision": "REJECT",
  "reason": "Invalid evidence: proofHash is empty (0x0).",
  "txHash": "0x4b9e1a2c3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
}
```

### Mã lỗi có thể gặp

| HTTP Status | Nguyên nhân | Ví dụ Response |
| :---: | :--- | :--- |
| `400 Bad Request` | `taskId` không hợp lệ hoặc Task trên chuỗi không ở trạng thái `Submitted`. | `{ "statusCode": 400, "message": "Task #1 is not in Submitted status" }` |
| `401 Unauthorized` | Thiếu hoặc sai giá trị header `x-demo-secret`. | `{ "statusCode": 401, "message": "Invalid or missing x-demo-secret header" }` |
| `404 Not Found` | `taskId` không tồn tại trên Smart Contract. | `{ "statusCode": 404, "message": "Task #999 does not exist" }` |
| `500 Internal Server Error` | Lỗi RPC hoặc giao dịch on-chain bị revert. | `{ "statusCode": 500, "message": "Failed to submit transaction to Fuji" }` |

---

## 2. `GET /agent/health`

Kiểm tra trạng thái hoạt động của AI Agent, tiến độ đọc block gần nhất và địa chỉ ví mà Agent đang sử dụng để ký giao dịch.

### Headers

Không yêu cầu header bảo mật (`Public endpoint`).

### Response Thành công (`200 OK`)

```json
{
  "status": "ok",
  "lastProcessedBlock": 38492015,
  "agentAddress": "0x71C95911E9a5D330f4D621842EC243EE1343292e"
}
```

| Trường | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `status` | `string` | Luôn trả về `"ok"` khi service hoạt động bình thường. |
| `lastProcessedBlock` | `number` | Số thứ tự block gần nhất trên Avalanche Fuji mà Agent đã đồng bộ/xử lý sự kiện. |
| `agentAddress` | `string` | Địa chỉ ví của Agent (địa chỉ đã được cấp quyền `AGENT_ROLE` trên `GroupTask.sol`). |
