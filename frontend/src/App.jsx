import React, { useState, useEffect } from 'react';

const runtimeApiUrl =
  typeof window !== 'undefined' &&
  window.__ENV__ &&
  window.__ENV__.VITE_API_URL
    ? window.__ENV__.VITE_API_URL
    : '';

const API_BASE_URL = (
  runtimeApiUrl ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');

const STATUS_OPTIONS = [
  'Đang sử dụng',
  'Hư hỏng',
  'Đang sửa chữa',
  'Ngừng sử dụng'
];

const initialFormState = {
  deviceId: '',
  name: '',
  deviceType: '',
  room: '',
  brand: '',
  model: '',
  quantity: 1,
  status: 'Đang sử dụng',
  purchaseDate: new Date().toISOString().split('T')[0],
  description: ''
};

export default function App() {
  const [devices, setDevices] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const fetchDevices = async (keyword = '') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = keyword.trim()
        ? `${API_BASE_URL}/api/devices?search=${encodeURIComponent(keyword.trim())}`
        : `${API_BASE_URL}/api/devices`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải danh sách thiết bị');
      }
      setDevices(data);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối đến máy chủ Backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDevices(searchKeyword);
  };

  const handleResetSearch = () => {
    setSearchKeyword('');
    fetchDevices('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const url = editingId
        ? `${API_BASE_URL}/api/devices/${editingId}`
        : `${API_BASE_URL}/api/devices`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Thao tác thất bại');
      }

      showNotification(
        result.message || (editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!')
      );
      setFormData(initialFormState);
      setEditingId(null);
      fetchDevices(searchKeyword);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (device) => {
    setEditingId(device._id);
    setFormData({
      deviceId: device.deviceId || '',
      name: device.name || '',
      deviceType: device.deviceType || '',
      room: device.room || '',
      brand: device.brand || '',
      model: device.model || '',
      quantity: device.quantity ?? 1,
      status: device.status || 'Đang sử dụng',
      purchaseDate: device.purchaseDate
        ? new Date(device.purchaseDate).toISOString().split('T')[0]
        : '',
      description: device.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setErrorMsg('');
  };

  const handleDelete = async (device) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thiết bị "${device.name}" (${device.deviceId})?`)) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${device._id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Không thể xóa thiết bị');
      }
      showNotification(result.message || 'Đã xóa thiết bị thành công!');
      fetchDevices(searchKeyword);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không tải được chi tiết thiết bị');
      }
      setSelectedDevice(data);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Đang sử dụng':
        return 'badge badge-active';
      case 'Hư hỏng':
        return 'badge badge-broken';
      case 'Đang sửa chữa':
        return 'badge badge-repair';
      case 'Ngừng sử dụng':
        return 'badge badge-stopped';
      default:
        return 'badge';
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>Quản Lý Thiết Bị Phòng Học</h1>
          <p>Hệ thống quản lý và theo dõi tình trạng thiết bị trên nền tảng đám mây</p>
        </div>
        <div>
          <small>API: {API_BASE_URL}</small>
        </div>
      </header>

      {loading && <div className="alert alert-loading">Đang xử lý dữ liệu...</div>}
      {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Form Thêm / Cập nhật thiết bị */}
      <section className="card">
        <h2>{editingId ? 'Cập Nhật Thông Tin Thiết Bị' : 'Thêm Thiết Bị Mới'}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Mã thiết bị (deviceId) *</label>
            <input
              type="text"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleInputChange}
              placeholder="VD: TB004"
              required
            />
          </div>

          <div className="form-group">
            <label>Tên thiết bị *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="VD: Máy chiếu Sony"
              required
            />
          </div>

          <div className="form-group">
            <label>Loại thiết bị *</label>
            <input
              type="text"
              name="deviceType"
              value={formData.deviceType}
              onChange={handleInputChange}
              placeholder="VD: Máy chiếu, Máy tính..."
              required
            />
          </div>

          <div className="form-group">
            <label>Phòng học *</label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleInputChange}
              placeholder="VD: P.A102"
              required
            />
          </div>

          <div className="form-group">
            <label>Hãng sản xuất *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="VD: Sony, Dell, Epson..."
              required
            />
          </div>

          <div className="form-group">
            <label>Model *</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="VD: VPL-EX455"
              required
            />
          </div>

          <div className="form-group">
            <label>Số lượng *</label>
            <input
              type="number"
              name="quantity"
              min="0"
              value={formData.quantity}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Tình trạng thiết bị *</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ngày mua / tiếp nhận *</label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Mô tả / Ghi chú</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Ghi chú thêm về thiết bị..."
            />
          </div>

          <div className="form-group full-width" style={{ flexDirection: 'row', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {editingId ? 'Lưu cập nhật' : 'Thêm thiết bị'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Thanh tìm kiếm & Danh sách thiết bị */}
      <section className="card">
        <h2>Danh Sách Thiết Bị Phòng Học ({devices.length})</h2>
        <form onSubmit={handleSearch} className="toolbar" style={{ marginTop: '12px' }}>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm kiếm theo mã thiết bị, tên, loại thiết bị hoặc phòng học..."
          />
          <button type="submit" className="btn btn-primary">
            Tìm kiếm
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleResetSearch}>
            Làm mới
          </button>
        </form>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Mã TB</th>
                <th>Tên thiết bị</th>
                <th>Loại thiết bị</th>
                <th>Phòng học</th>
                <th>Số lượng</th>
                <th>Tình trạng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    Không có thiết bị nào phù hợp.
                  </td>
                </tr>
              ) : (
                devices.map((item) => (
                  <tr key={item._id}>
                    <td><strong>{item.deviceId}</strong></td>
                    <td>{item.name}</td>
                    <td>{item.deviceType}</td>
                    <td>{item.room}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <span className={getStatusBadgeClass(item.status)}>{item.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewDetail(item._id)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEdit(item)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Xem chi tiết thiết bị */}
      {selectedDevice && (
        <div className="modal-backdrop" onClick={() => setSelectedDevice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Chi Tiết Thiết Bị: {selectedDevice.deviceId}</h3>
            <hr style={{ margin: '12px 0' }} />
            <div className="detail-list">
              <p><strong>Mã thiết bị:</strong> {selectedDevice.deviceId}</p>
              <p><strong>Tên thiết bị:</strong> {selectedDevice.name}</p>
              <p><strong>Loại thiết bị:</strong> {selectedDevice.deviceType}</p>
              <p><strong>Phòng học:</strong> {selectedDevice.room}</p>
              <p><strong>Hãng sản xuất:</strong> {selectedDevice.brand}</p>
              <p><strong>Model:</strong> {selectedDevice.model}</p>
              <p><strong>Số lượng:</strong> {selectedDevice.quantity}</p>
              <p>
                <strong>Tình trạng:</strong>{' '}
                <span className={getStatusBadgeClass(selectedDevice.status)}>
                  {selectedDevice.status}
                </span>
              </p>
              <p>
                <strong>Ngày mua/tiếp nhận:</strong>{' '}
                {selectedDevice.purchaseDate
                  ? new Date(selectedDevice.purchaseDate).toLocaleDateString('vi-VN')
                  : 'N/A'}
              </p>
              <p><strong>Mô tả / Ghi chú:</strong> {selectedDevice.description || 'Không có'}</p>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setSelectedDevice(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}