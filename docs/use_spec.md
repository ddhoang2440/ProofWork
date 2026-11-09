# Đặc tả Luồng Người dùng & UI/UX — `docs/use_spec.md`

Ứng dụng Frontend (`frontend/`) gồm thanh điều hướng chung (Header) và **3 màn hình chính** tương ứng với 3 giai đoạn của vòng đời Task.

---

## 1. Thành phần Dùng chung (Global Layout & Guards)

1. **WalletConnectButton (`components/common/WalletConnectButton.tsx`):**
   - Khi chưa kết nối ví: Hiển thị nút `"Connect Wallet"`.
   - Khi đã kết nối ví: Hiển thị địa chỉ rút gọn dạng `0x1234...5678`.
2. **NetworkGuard (`components/common/NetworkGuard.tsx`):**
   - Kiểm tra `chainId` hiện tại của ví.
   - Nếu `chainId !== 43113` (Avalanche Fuji Testnet): Che nội dung trang bằng thông báo yêu cầu chuyển mạng kèm nút `"Switch to Avalanche Fuji"` (gọi `switchToFuji()`).
3. **EventToast (`components/common/EventToast.tsx`):**
   - Hiển thị thông báo nổi (Toast) ở góc màn hình mỗi khi nhận được sự kiện on-chain (`GroupCreated`, `TaskCreated`, `TaskSubmitted`, `TaskConfirmed`, `TaskRejected`), tự động ẩn sau 5 giây.

---

## 2. MÀN HÌNH 1: Create Page (`/create`)

**Mục đích:** Cho phép người dùng khởi tạo Nhóm (Group), tạo Công việc (Task) trong nhóm và nộp Bằng chứng hoàn thành (`proofHash`).

### Các Thành phần Giao diện (Forms)

| Khu vực / Component | Trường nhập liệu (Inputs) | Nút hành động | Hàm Contract được gọi |
| :--- | :--- | :--- | :--- |
| **1. Form Tạo Group**<br>(`CreateGroupForm.tsx`) | - `groupName` (Text input, bắt buộc, placeholder: `"Nhập tên nhóm..."`) | Nút **"Tạo Group"** | `createGroup(name)` |
| **2. Form Tạo Task**<br>(`CreateTaskForm.tsx`) | - `groupId` (Number/Select input, mặc định nhóm vừa tạo)<br>- `taskTitle` (Text input, bắt buộc, placeholder: `"Nhập tên công việc..."`) | Nút **"Tạo Task"** | `createTask(groupId, title)` |
| **3. Form Submit Bằng chứng**<br>(`SubmitEvidenceForm.tsx`) | - `taskId` (Number input, mã task cần nộp)<br>- `proofHash` (Text input chuẩn `bytes32` hex `0x...`, có nút phụ *"Điền hash mẫu hợp lệ"* và *"Điền hash rỗng 0x0"* để hỗ trợ thao tác nhanh khi demo) | Nút **"Gửi Bằng chứng"** | `submitEvidence(taskId, proofHash)` |

### Trạng thái UI bắt buộc trên Màn hình 1

1. **Chưa kết nối ví (`address == null`):**
   - Ẩn hoặc khóa (`disabled`) toàn bộ các nút gửi form, hiển thị banner nhắc người dùng bấm **"Connect Wallet"** trước khi thao tác.
2. **Đang xử lý giao dịch (`isSubmitting == true`):**
   - Khi người dùng bấm nút và đang chờ ký ví hoặc chờ block xác nhận (`await tx.wait()`):
   - Vô hiệu hóa (`disabled`) nút bấm và các ô input của form đó.
   - Đổi nhãn nút thành `"Đang xử lý giao dịch..."` kèm spinner loading.
3. **Hoàn tất giao dịch (`Success`):**
   - Mở khóa lại form, xóa trắng dữ liệu vừa nhập.
   - Hiển thị thông báo thành công kèm mã ID vừa tạo (`groupId` hoặc `taskId`) và link giao dịch.
4. **Lỗi giao dịch (`Error`):**
   - Nếu người dùng từ chối ký ví hoặc giao dịch revert: Mở khóa nút bấm và hiển thị thông báo lỗi màu đỏ ngay dưới form.

---

## 3. MÀN HÌNH 2: Confirm Page (`/confirm`)

**Mục đích:** Theo dõi danh sách toàn bộ các Task trong nhóm và quan sát quá trình AI Agent tự động duyệt hoặc từ chối bằng chứng theo thời gian thực.

### Bố cục & Hiển thị Thẻ Task (`TaskList.tsx` & `TaskCard.tsx`)

- Cho phép chọn/nhập `groupId` để tải danh sách task bằng hàm `getTasksByGroup(groupId)`.
- Mỗi Task được hiển thị dưới dạng một **Task Card** gồm:
  - Mã Task (`#taskId`) & Tiêu đề (`title`).
  - Địa chỉ người tạo (`creator` rút gọn).
  - Giá trị `proofHash` (rút gọn, hoặc `"Chưa nộp"` nếu `Pending`).
  - Huy hiệu trạng thái (**Status Badge**) và viền thẻ phân màu rõ rệt.

### Quy ước Phân màu Trạng thái (Status Color Coding)

| Trạng thái (`TaskStatus`) | Màu sắc chủ đạo | Nhãn hiển thị | Chi tiết UI bổ sung |
| :--- | :--- | :--- | :--- |
| **`Pending` (`0`)** | **Xám** (`#64748b` / nền `#f1f5f9`) | `Chờ nộp bằng chứng` | Hiển thị gợi ý: *"Hãy nộp bằng chứng ở màn hình Create"*. |
| **`Submitted` (`1`)** | **Vàng** (`#d97706` / nền `#fef3c7`) | `Agent đang duyệt...` | Hiển thị hiệu ứng nhịp thở (pulse/spinner) biểu thị AI Agent đang phân tích bằng chứng. |
| **`Confirmed` (`2`)** | **Xanh lá** (`#16a34a` / nền `#dcfce7`) | `Đã xác nhận (Confirmed)` | Hiển thị biểu tượng dấu tích xanh và thời gian hoàn thành (`completedAt`). |
| **`Rejected` (`3`)** | **Đỏ** (`#dc2626` / nền `#fee2e2`) | `Bị từ chối (Rejected)` | Hiển thị biểu tượng cảnh báo kèm **Tooltip** (hoặc hộp thoại mở rộng) ghi rõ lý do từ chối (`rejectReason`) từ AI Agent. |

### Cơ chế Cập nhật Thời gian thực (Real-time Update)

- Khi trang `/confirm` đang mở, `eventService.ts` đăng ký lắng nghe các sự kiện `TaskSubmitted`, `TaskConfirmed`, `TaskRejected` từ `GroupTask.sol`.
- Khi AI Agent gọi `confirmCompletion(taskId)` hoặc `rejectCompletion(taskId, reason)` thành công trên chuỗi:
  1. Thẻ `TaskCard` có `id == taskId` **tự động chuyển màu** từ **Vàng** sang **Xanh lá** (hoặc **Đỏ**) ngay lập tức mà **không cần tải lại trang (F5)**.
  2. `EventToast` bật lên ở góc màn hình thông báo kết quả tương ứng.

---

## 4. MÀN HÌNH 3: Certificate Page (`/certificates`)

**Mục đích:** Tra cứu và trưng bày các Chứng chỉ hoàn thành công việc (On-chain Certificates) dành cho các Task đã được AI Agent xác nhận (`Confirmed`).

### Cơ chế Truy vấn Dữ liệu cho MVP (Không cần sửa Contract)

Vì hàm `getCertificate(uint256 taskId)` trên Smart Contract nhận vào `taskId` (chứ không nhận `address`), Frontend xử lý tìm kiếm theo địa chỉ ví như sau:
1. Lưu danh sách các `groupId` / `taskId` đã tạo vào `localStorage` của trình duyệt (hoặc lấy danh sách task thông qua `getTasksByGroup(groupId)`).
2. Lặp qua các `taskId` đã biết, lọc ra các task có `status === TaskStatus.Confirmed` và có `creator.toLowerCase() === searchWalletAddress.toLowerCase()` (nếu ô tìm kiếm để trống thì lấy tất cả task `Confirmed`).
3. Với mỗi `taskId` thỏa mãn, gọi `getCertificate(taskId)` (kết hợp `queryFilter` sự kiện `TaskConfirmed` hoặc `localStorage` để lấy `txHash`) và render ra danh sách.

### Các Thành phần Giao diện

1. **Ô Tìm kiếm theo Địa chỉ Ví (`WalletSearchInput.tsx`):**
   - Ô input cho phép nhập địa chỉ ví (`0x...`) cần tra cứu, kèm nút **"Tìm kiếm"** và nút nhanh **"Ví của tôi"** (tự điền địa chỉ ví đang kết nối).
2. **Danh sách Chứng chỉ (`CertificateList.tsx`):**
   - Hiển thị danh sách các thẻ `CertificateCard` sau khi lọc theo địa chỉ ví.
   - **Lưu ý quan trọng:** Tuyệt đối **chỉ hiển thị** các task có trạng thái `Confirmed`. Các task `Pending`, `Submitted`, hoặc `Rejected` không được hiển thị tại màn hình này.
3. **Thẻ Chứng chỉ (`CertificateCard.tsx` & `ExplorerLink.tsx`):**
   - Thiết kế dạng bằng chứng nhận trang trọng, hiển thị rõ ràng và tách biệt 5 thông tin sau:
     1. **Tên Task (`taskTitle`):** Tiêu đề công việc đã hoàn thành.
     2. **Địa chỉ người tạo (`creator`):** Địa chỉ ví của người thực hiện task.
     3. **Ngày hoàn thành (`completedAt`):** Định dạng ngày giờ dễ đọc (`dd/MM/yyyy HH:mm:ss`).
     4. **Mã băm bằng chứng (`proofHash`):** Dữ liệu `bytes32` do người dùng nộp khi gọi `submitEvidence` (hiển thị dạng rút gọn như dữ liệu tham khảo).
     5. **Mã giao dịch (`txHash`):** Mã giao dịch do mạng lưới Avalanche Fuji sinh ra khi xác nhận hoàn thành (lấy từ event log `TaskConfirmed` hoặc `localStorage`), gắn với component `ExplorerLink` để mở trực tiếp trang tra cứu Snowtrace (`https://testnet.snowtrace.io/tx/<txHash>`). Nếu không có `txHash` trong phiên làm việc, fallback link về địa chỉ contract (`https://testnet.snowtrace.io/address/<contractAddress>`).
