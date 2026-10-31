require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Device, VALID_STATUSES } = require('./models/Device');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình CORS và JSON parser
app.use(cors());
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Kết nối MongoDB Atlas thành công'))
  .catch((err) => console.error('Lỗi kết nối MongoDB Atlas:', err.message));

// Hàm kiểm tra dữ liệu đầu vào
function validateDevicePayload(body, isUpdate = false) {
  const requiredFields = [
    'deviceId',
    'name',
    'deviceType',
    'room',
    'brand',
    'model',
    'quantity',
    'status',
    'purchaseDate'
  ];

  if (!isUpdate) {
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
        return `Trường '${field}' là bắt buộc và không được để trống.`;
      }
    }
  }

  if (body.quantity !== undefined) {
    const qty = Number(body.quantity);
    if (Number.isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
      return 'Số lượng (quantity) phải là số nguyên không âm.';
    }
  }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return `Tình trạng không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}.`;
  }

  if (body.purchaseDate !== undefined && Number.isNaN(Date.parse(body.purchaseDate))) {
    return 'Ngày mua/tiếp nhận (purchaseDate) không đúng định dạng ngày hợp lệ.';
  }

  return null;
}

// Hàm tìm thiết bị theo MongoDB _id hoặc theo deviceId
async function findDeviceByIdentifier(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byObjectId = await Device.findById(id);
    if (byObjectId) return byObjectId;
  }
  return Device.findOne({ deviceId: id });
}

// 1. Endpoint kiểm tra trạng thái hoạt động của Backend
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    service: 'classroom-device-backend',
    database: dbState,
    timestamp: new Date().toISOString()
  });
});

// 2. Lấy danh sách thiết bị & Tìm kiếm theo từ khóa (?search=...)
app.get('/api/devices', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { deviceId: regex },
          { name: regex },
          { deviceType: regex },
          { room: regex },
          { brand: regex },
          { model: regex },
          { status: regex }
        ]
      };
    }

    const devices = await Device.find(query).sort({ createdAt: -1 });
    return res.status(200).json(devices);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi máy chủ khi lấy danh sách thiết bị.',
      error: error.message
    });
  }
});

// 3. Xem thông tin chi tiết một thiết bị
app.get('/api/devices/:id', async (req, res) => {
  try {
    const device = await findDeviceByIdentifier(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị.' });
    }
    return res.status(200).json(device);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi máy chủ khi truy vấn thông tin thiết bị.',
      error: error.message
    });
  }
});

// 4. Thêm thiết bị mới
app.post('/api/devices', async (req, res) => {
  try {
    const validationError = validateDevicePayload(req.body, false);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedDeviceId = String(req.body.deviceId).trim();
    const existingDevice = await Device.findOne({ deviceId: normalizedDeviceId });
    if (existingDevice) {
      return res.status(409).json({
        message: `Mã thiết bị '${normalizedDeviceId}' đã tồn tại. Không cho phép trùng mã thiết bị.`
      });
    }

    const newDevice = await Device.create({
      ...req.body,
      deviceId: normalizedDeviceId,
      quantity: Number(req.body.quantity)
    });

    return res.status(201).json({
      message: 'Thêm thiết bị mới thành công.',
      data: newDevice
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Mã thiết bị (deviceId) đã tồn tại.' });
    }
    return res.status(400).json({
      message: 'Dữ liệu thiết bị không hợp lệ.',
      error: error.message
    });
  }
});

// 5. Cập nhật thông tin thiết bị
app.put('/api/devices/:id', async (req, res) => {
  try {
    const validationError = validateDevicePayload(req.body, true);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const currentDevice = await findDeviceByIdentifier(req.params.id);
    if (!currentDevice) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị cần cập nhật.' });
    }

    if (req.body.deviceId) {
      const normalizedDeviceId = String(req.body.deviceId).trim();
      const duplicate = await Device.findOne({
        deviceId: normalizedDeviceId,
        _id: { $ne: currentDevice._id }
      });
      if (duplicate) {
        return res.status(409).json({
          message: `Mã thiết bị '${normalizedDeviceId}' đã thuộc về thiết bị khác.`
        });
      }
      req.body.deviceId = normalizedDeviceId;
    }

    if (req.body.quantity !== undefined) {
      req.body.quantity = Number(req.body.quantity);
    }

    const updatedDevice = await Device.findByIdAndUpdate(
      currentDevice._id,
      req.body,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Cập nhật thông tin thiết bị thành công.',
      data: updatedDevice
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Lỗi khi cập nhật thiết bị.',
      error: error.message
    });
  }
});

// 6. Xóa thiết bị
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const device = await findDeviceByIdentifier(req.params.id);
    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị cần xóa.' });
    }

    await Device.findByIdAndDelete(device._id);
    return res.status(200).json({
      message: 'Xóa thiết bị thành công.',
      deletedId: device._id,
      deviceId: device.deviceId
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi máy chủ khi xóa thiết bị.',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});