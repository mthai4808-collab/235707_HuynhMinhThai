const mongoose = require('mongoose');

const VALID_STATUSES = [
  'Đang sử dụng',
  'Hư hỏng',
  'Đang sửa chữa',
  'Ngừng sử dụng'
];

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Mã thiết bị (deviceId) là bắt buộc'],
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Tên thiết bị (name) là bắt buộc'],
      trim: true
    },
    deviceType: {
      type: String,
      required: [true, 'Loại thiết bị (deviceType) là bắt buộc'],
      trim: true
    },
    room: {
      type: String,
      required: [true, 'Phòng học sử dụng (room) là bắt buộc'],
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Hãng sản xuất (brand) là bắt buộc'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model thiết bị (model) là bắt buộc'],
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng (quantity) là bắt buộc'],
      min: [0, 'Số lượng không được nhỏ hơn 0']
    },
    status: {
      type: String,
      required: [true, 'Tình trạng thiết bị (status) là bắt buộc'],
      enum: {
        values: VALID_STATUSES,
        message: 'Tình trạng phải là: Đang sử dụng, Hư hỏng, Đang sửa chữa, hoặc Ngừng sử dụng'
      },
      default: 'Đang sử dụng'
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Ngày mua/tiếp nhận (purchaseDate) là bắt buộc']
    },
    description: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'devices'
  }
);

module.exports = {
  Device: mongoose.model('Device', deviceSchema),
  VALID_STATUSES
};