PVP THỜI GIAN THỰC - ĐẢO RỒNG

Backend:
- worker/index.js xác thực Firebase ID token.
- Durable Object PvpRoom giữ hàng chờ, lời mời, trận đấu và BXH PvP.
- /api/pvp/ws là kết nối WebSocket cho trận đấu.
- /api/pvp/leaderboard trả về BXH PvP.
- Trận đấu cân bằng: mỗi rồng 100 máu, 30 mana; máy chủ tự xử lý lượt đánh và kết quả.
- Điểm BXH: thắng +3 điểm. Rời trận khi đang đấu được tính thua.

Triển khai:
1. Từ thư mục gốc repository, triển khai bằng lệnh: npx wrangler deploy
2. Lần triển khai đầu sẽ tạo Durable Object SQLite theo migration v1 trong wrangler.jsonc.
3. Đảm bảo Worker và trang game được phục vụ cùng hostname để đường dẫn /api/pvp/* hoạt động.
4. Mở dao-rong/index.html bằng tài khoản Firebase đã đăng nhập. Nút PvP Online nằm ở góc dưới bên phải.

Lưu ý:
- Chỉ mã Worker được phép quyết định lượt đánh và ghi điểm; trình duyệt không tự cộng điểm.
- Đây là PvP theo lượt đồng bộ trực tiếp khi cả hai người cùng online, không phải hoạt ảnh đánh đồng thời.
- Nếu deploy báo lỗi migration hoặc Durable Object binding, cần kiểm tra trạng thái deploy trong Cloudflare trước khi thử PvP.
