NÔNG TRẠI ĐẢO BAY - CẤU TRÚC FILE

index.html  : khung trang (hiếm khi phải sửa)
style.css   : màu sắc, giao diện
config.js   : cấu hình Firebase + TEST_MODE (bản chơi thật để TEST_MODE=false)
game.js     : lõi game: vườn, chuồng trại, shop, nhân viên
social.js   : đăng nhập, lưu đám mây, bạn bè, quà, chat, thăm nhà
market.js   : chợ người chơi
achieve.js  : thành tựu + tính giá trị vườn (tab 🏅)
rank.js     : bảng xếp hạng (tab 🏆)
dm.js       : nhắn tin riêng giữa bạn bè (tab ✉️)
main.js     : khởi động game (tải cuối cùng)
img/        : toàn bộ ảnh và video

CẬP NHẬT: chỉ thay file bạn đã sửa (ví dụ market.js).
Sau đó đổi số ?v=1 thành ?v=2 trong index.html để trình duyệt tải bản mới.
Thêm file .js mới thì khai báo thêm 1 dòng <script src="ten-file.js?v=1"></script>
trong index.html, đặt TRƯỚC main.js.
Muốn thêm tab mới trong 👥: tạo file mới và đăng ký SOCX.tenTab={label,body(),init()} (xem rank.js làm mẫu).
