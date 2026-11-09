# Kịch bản Demo Chi tiết — ProofWork

Tài liệu này hướng dẫn từng bước thực hiện buổi demo hệ thống **ProofWork** trên mạng **Avalanche Fuji Testnet (Chain ID: 43113)**.

---

## Chuẩn bị Trước Buổi Demo (Checklist)

1. **Smart Contract:** Đã deploy `GroupTask.sol` lên Avalanche Fuji, đã cấp quyền `AGENT_ROLE` cho ví Agent (`grantAgentRole`), và đã chạy `npm run export` để cập nhật `shared/abi/GroupTask.json` & `shared/addresses.json`.
2. **AI Agent (`agent/`):** Đang chạy ở cổng `3000` (`npm run start:dev`). Kiểm tra nhanh bằng `GET http://localhost:3000/agent/health` trả về `"status": "ok"`.
3. **Frontend (`frontend/`):** Đang chạy (`npm run dev`), mở trình duyệt có cài sẵn ví MetaMask chứa AVAX testnet trên mạng Fuji.

---

## Kịch bản 1: Luồng Thành công (Happy Path)

**Mục tiêu:** Chứng minh quy trình khép kín từ lúc tạo Task, nộp bằng chứng hợp lệ, AI Agent tự động xác thực qua sự kiện WebSocket, đến lúc Frontend tự động cập nhật trạng thái và hiển thị Chứng chỉ (Certificate) on-chain.

| Bước | Thao tác thực hiện | Kết quả kỳ vọng trên hệ thống |
| :---: | :--- | :--- |
| **Bước 1** | Mở màn hình **Create Page** (`/create`). Bấm nút **Connect Wallet** trên thanh điều hướng và chấp nhận kết nối ví MetaMask (mạng Avalanche Fuji `43113`). | Nút Connect hiển thị địa chỉ ví rút gọn (vd: `0x1234...abcd`). Các form trên màn hình được mở khóa. |
| **Bước 2** | - Tại **Form Tạo Group**: Nhập tên nhóm `"Web3 Hackathon Team"` -> Bấm **Tạo Group** -> Xác nhận giao dịch trên MetaMask.<br>- Tại **Form Tạo Task**: Chọn/nhập `groupId = 1`, nhập tên task `"Thiết kế kiến trúc Smart Contract"` -> Bấm **Tạo Task** -> Xác nhận trên MetaMask. | - Giao dịch thành công, hiển thị thông báo đã tạo `groupId = 1` và `taskId = 1`.<br>- Nếu mở sang **Confirm Page** (`/confirm`), thẻ `Task #1` hiển thị màu **Xám (`Pending`)**. |
| **Bước 3** | Tại **Form Submit Bằng chứng**: Nhập `taskId = 1` và mã bằng chứng hợp lệ (khác `0x0`), ví dụ:<br>`0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`<br>Bấm **Gửi Bằng chứng** và ký giao dịch. | - Smart Contract phát sự kiện `TaskSubmitted(1, proofHash, userAddress)`.<br>- Sang màn hình **Confirm Page** (`/confirm`), thẻ `Task #1` chuyển sang màu **Vàng (`Submitted` - Agent đang duyệt)**. |
| **Bước 4** | Quan sát terminal của **AI Agent** (không cần thao tác tay). | - Agent bắt được sự kiện `TaskSubmitted` qua WebSocket.<br>- `LlmService` đánh giá `proofHash != 0x0` -> trả về `decision: "CONFIRM"`.<br>- Agent tự động ký và gửi giao dịch `confirmCompletion(1)` lên Fuji.<br>- Smart Contract phát sự kiện `TaskConfirmed(1, agentAddress, completedAt)`. |
| **Bước 5** | Quan sát màn hình **Confirm Page** (`/confirm`) và chuyển sang **Certificate Page** (`/certificates`). | - **Tại Confirm Page:** Thẻ `Task #1` tự động đổi từ màu **Vàng** sang **Xanh lá (`Confirmed`)** mà không cần F5, đồng thời xuất hiện Toast thông báo `"Task #1 đã được Agent xác nhận!"`.<br>- **Tại Certificate Page:** Nhập địa chỉ ví người tạo vào ô tìm kiếm -> Hiển thị **Certificate Card** của `Task #1` kèm ngày hoàn thành và link xem giao dịch trên Snowtrace/Snowscan. |

---

## Kịch bản 2: Luồng Từ chối (Reject Path)

**Mục tiêu:** Chứng minh AI Agent có khả năng phát hiện bằng chứng không hợp lệ (rỗng / `0x0`) và từ chối on-chain kèm lý do cụ thể.

| Bước | Thao tác thực hiện | Kết quả kỳ vọng trên hệ thống |
| :---: | :--- | :--- |
| **Bước 1** | Tạo thêm `Task #2` (`"Viết Unit Test cho Contract"`). Tại **Form Submit Bằng chứng**, nhập `taskId = 2` và nhập mã hash rỗng:<br>`0x0000000000000000000000000000000000000000000000000000000000000000` (hoặc `0x0`).<br>Bấm **Gửi Bằng chứng** và ký giao dịch. | - Smart Contract phát sự kiện `TaskSubmitted(2, 0x00...00, userAddress)`.<br>- Trên **Confirm Page**, thẻ `Task #2` hiển thị màu **Vàng (`Submitted`)**. |
| **Bước 2** | Quan sát terminal của **AI Agent**. | - Agent nhận sự kiện `TaskSubmitted` của `Task #2`.<br>- `LlmService` phát hiện `proofHash == 0x0` -> trả về `decision: "REJECT"` kèm lý do `"Invalid evidence: proofHash is empty (0x0)."`<br>- Agent tự động gọi hàm `rejectCompletion(2, reason)` lên Smart Contract.<br>- Smart Contract phát sự kiện `TaskRejected(2, agentAddress, reason)`. |
| **Bước 3** | Quan sát màn hình **Confirm Page** (`/confirm`) và **Certificate Page** (`/certificates`). | - **Tại Confirm Page:** Thẻ `Task #2` tự động chuyển sang màu **Đỏ (`Rejected`)**, hiện Toast cảnh báo và khi di chuột vào (tooltip) hiển thị rõ lý do từ chối từ Agent.<br>- **Tại Certificate Page:** `Task #2` **không** được cấp chứng chỉ và không xuất hiện trong danh sách chứng chỉ. |

---

## Kịch bản 3: Cơ chế Dự phòng khi WebSocket Gián đoạn (Fallback Path)

**Mục tiêu:** Đảm bảo buổi demo luôn thành công 100% ngay cả khi mạng WiFi hội trường hoặc public WebSocket RPC của Fuji bị trễ/ngắt kết nối.

| Bước | Thao tác thực hiện | Kết quả kỳ vọng trên hệ thống |
| :---: | :--- | :--- |
| **Bước 1** | Giả sử người dùng đã nộp bằng chứng cho `Task #3` (trạng thái đang là **Vàng - `Submitted`**), nhưng sau 10 giây WebSocket công cộng chưa đẩy sự kiện về cho Agent. | Thẻ `Task #3` vẫn đang ở trạng thái `Submitted`. |
| **Bước 2** | Kích hoạt API đánh giá thủ công bằng `curl` (hoặc nút Retry/Evaluate trên UI test):<br>```bash
curl -X POST http://localhost:3000/agent/evaluate \
  -H "Content-Type: application/json" \
  -H "x-demo-secret: super-secret-demo-key" \
  -d '{"taskId": 3}'
``` | - Agent lập tức gọi `contract.getTask(3)` qua RPC để lấy thông tin mới nhất.<br>- Agent thực thi đánh giá và gửi giao dịch `confirmCompletion(3)` hoặc `rejectCompletion(3)` lên chuỗi.<br>- API trả về JSON chứa `decision`, `reason` và `txHash`. |
| **Bước 3** | Quan sát lại giao diện **Confirm Page**. | Thẻ `Task #3` cập nhật trạng thái hoàn tất (`Confirmed` hoặc `Rejected`) ngay khi giao dịch hoàn thành. |
