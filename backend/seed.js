require('dotenv').config();
const mongoose = require('mongoose');
const { Device } = require('./models/Device');

const sampleDevices = [
  {
    deviceId: 'TB001',
    name: 'Máy chiếu độ phân giải cao Epson',
    deviceType: 'Máy chiếu',
    room: 'P.A101',
    brand: 'Epson',
    model: 'EB-E01',
    quantity: 1,
    status: 'Đang sử dụng',
    purchaseDate: '2025-08-15',
    description: 'Máy chiếu chính phục vụ giảng dạy lý thuyết tại phòng A101'
  },
  {
    deviceId: 'TB002',
    name: 'Máy tính thực hành lập trình',
    deviceType: 'Máy tính',
    room: 'Lab CNTT 02',
    brand: 'Dell',
    model: 'OptiPlex 7010',
    quantity: 40,
    status: 'Đang sử dụng',
    purchaseDate: '2025-09-01',
    description: 'Dàn máy tính cấu hình Core i7, RAM 16GB phục vụ thực hành'
  },
  {
    deviceId: 'TB003',
    name: 'Hệ thống loa và micro trợ giảng không dây',
    deviceType: 'Thiết bị âm thanh',
    room: 'Hội trường B201',
    brand: 'JBL',
    model: 'EON208P',
    quantity: 2,
    status: 'Đang sửa chữa',
    purchaseDate: '2024-11-20',
    description: 'Đang bảo trì đầu thu micro không dây số 2'
  }
];

async function seedDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Thiếu biến môi trường MONGODB_URI trong file .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Đã kết nối MongoDB Atlas thành công!');

    for (const item of sampleDevices) {
      await Device.findOneAndUpdate(
        { deviceId: item.deviceId },
        item,
        { upsert: true, new: true, runValidators: true }
      );
    }

    console.log('Đã khởi tạo thành công 3 bản ghi thiết bị mẫu vào collection devices!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khởi tạo dữ liệu:', error.message);
    process.exit(1);
  }
}

seedDatabase();