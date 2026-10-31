# Hệ Thống Quản Lý Thiết Bị Phòng Học Trên Nền Tảng Đám Mây

- **Họ và tên:** Huỳnh Minh Thái
- **MSSV:** 235707

## 1. Giới thiệu đề tài
Hệ thống quản lý thiết bị phòng học giúp theo dõi thông tin thiết bị, số lượng, phòng học sử dụng và tình trạng hoạt động (`Đang sử dụng`, `Hư hỏng`, `Đang sửa chữa`, `Ngừng sử dụng`), hỗ trợ tìm kiếm và cập nhật trực tuyến trên nền tảng đám mây.

## 2. Công nghệ sử dụng
- **Frontend:** React (Vite), CSS3, Nginx
- **Backend:** Node.js, Express.js, Mongoose, CORS, Dotenv
- **Cơ sở dữ liệu:** MongoDB Atlas (Database: `235707_HuynhMinhThai`, Collection: `devices`)
- **Đóng gói & Triển khai:** Git/GitHub, Docker, Docker Hub (`mthai4808`), Render

## 3. Cấu trúc dự án
```text
235707_HuynhMinhThai/
├── backend/                # Mã nguồn Backend API (Node.js + Express)
├── frontend/               # Mã nguồn Frontend (React + Vite)
├── .gitignore              # Loại trừ file nhạy cảm (.env, node_modules)
└── README.md               # Tài liệu hướng dẫn dự án
```

## 4. Hướng dẫn cài đặt và chạy chương trình
### Chạy Backend
```bash
cd backend
npm install
npm run seed
npm start
```

### Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```