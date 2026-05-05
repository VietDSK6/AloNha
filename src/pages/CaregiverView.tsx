import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faPills, faTriangleExclamation, faHeartPulse, faStethoscope, faLocationDot, faCheck, faXmark, faExclamation, faHeart, faGear, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Alert, Medication, ElderlyProfile, ActivityStatus } from '../data/mockData';

// Fix Leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CaregiverViewProps {
  onBack: () => void;
  alerts: Alert[];
  meds: Medication[];
  elderlyProfile: ElderlyProfile;
  activity: ActivityStatus;
  onAddMedication: (med: Medication) => void;
  onDeleteMedication: (id: string) => void;
}

// Mock Analytics Data
const heartRateData = [
  { time: '08:00', value: 72 }, { time: '10:00', value: 75 },
  { time: '12:00', value: 80 }, { time: '14:00', value: 78 },
  { time: '16:00', value: 74 }, { time: '18:00', value: 76 }
];

const bloodPressureData = [
  { day: 'T2', sys: 120, dia: 80 }, { day: 'T3', sys: 122, dia: 82 },
  { day: 'T4', sys: 118, dia: 79 }, { day: 'T5', sys: 125, dia: 85 },
  { day: 'T6', sys: 121, dia: 81 }, { day: 'T7', sys: 119, dia: 80 }
];

export default function CaregiverView({ onBack, alerts, meds, elderlyProfile, onAddMedication, onDeleteMedication }: CaregiverViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings Form State
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newMedDose, setNewMedDose] = useState('1 viên');

  const unreadAlerts = alerts.filter(a => !a.read);
  const mapCenter: [number, number] = [21.0382, 105.7827]; // Coordinates for 144 Xuan Thuy

  const handleAddMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;
    onAddMedication({
      id: `med-${Date.now()}`,
      name: newMedName,
      time: newMedTime,
      dosage: newMedDose,
      status: 'pending'
    });
    setNewMedName('');
    setNewMedTime('08:00');
    setNewMedDose('1 viên');
  };

  return (
    <div className="caregiver-view">
      {/* Header */}
      <div className="cg-header">
        <div className="cg-header-top">
          <div className="cg-header-left">
            <button className="elderly-back-btn" onClick={onBack} aria-label="Quay lại"><FontAwesomeIcon icon={faArrowLeft} /></button>
            <span className="cg-logo">Alo Nhà</span>
            <span className="cg-badge">Người thân</span>
          </div>
          <div className="cg-header-right">
            <button className="cg-notif-btn" onClick={() => setShowSettings(true)} aria-label="Cài đặt">
              <FontAwesomeIcon icon={faGear} />
            </button>
            <button className="cg-notif-btn" aria-label="Thông báo" style={{ marginLeft: '10px' }}>
              <FontAwesomeIcon icon={faBell} />
              {unreadAlerts.length > 0 && <span className="cg-notif-dot" />}
            </button>
          </div>
        </div>
        
        <div className="cg-profile-info">
          <h2><FontAwesomeIcon icon={elderlyProfile.avatar} /> {elderlyProfile.name}</h2>
          <p>{elderlyProfile.age} tuổi · Đang được theo dõi</p>
        </div>
      </div>

      <div className="cg-content">
        {/* Alerts */}
        {unreadAlerts.length > 0 && (
          <div className="cg-alerts">
            {unreadAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`cg-alert-banner ${alert.type === 'sos' ? 'danger' : alert.type === 'health' ? 'success' : ''}`}
              >
                <span className="cg-alert-icon">
                  <FontAwesomeIcon icon={
                    alert.type === 'medication' ? faPills :
                    alert.type === 'sos' ? faTriangleExclamation :
                    alert.type === 'health' ? faHeartPulse : faExclamation
                  } />
                </span>
                <span className="cg-alert-text">{alert.message}</span>
                <span className="cg-alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Health Charts */}
        <div className="cg-section">
          <div className="cg-section-header">
            <span className="cg-section-title"><FontAwesomeIcon icon={faHeart} /> Biểu đồ Nhịp tim (Hôm nay)</span>
          </div>
          <div style={{ width: '100%', height: 200, background: 'white', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <ResponsiveContainer>
              <AreaChart data={heartRateData}>
                <defs>
                  <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} fontSize={12} width={30} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="value" stroke="#EF4444" fillOpacity={1} fill="url(#colorHeart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cg-section">
          <div className="cg-section-header">
            <span className="cg-section-title"><FontAwesomeIcon icon={faStethoscope} /> Biểu đồ Huyết áp (7 ngày)</span>
          </div>
          <div style={{ width: '100%', height: 200, background: 'white', borderRadius: '12px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <ResponsiveContainer>
              <LineChart data={bloodPressureData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis domain={[60, 150]} axisLine={false} tickLine={false} fontSize={12} width={30} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="sys" stroke="#3B82F6" strokeWidth={2} name="Tâm thu" />
                <Line type="monotone" dataKey="dia" stroke="#10B981" strokeWidth={2} name="Tâm trương" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medication Tracker */}
        <div className="cg-section">
          <div className="cg-section-header">
            <span className="cg-section-title"><FontAwesomeIcon icon={faPills} /> Lịch uống thuốc</span>
          </div>
          {meds.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>Chưa có lịch thuốc.</p>
          ) : (
            meds.map((med) => (
              <div key={med.id} className="cg-med-item">
                <div className={`cg-med-check ${med.status}`}>
                  {med.status === 'completed' ? <FontAwesomeIcon icon={faCheck} /> : med.status === 'missed' ? <FontAwesomeIcon icon={faXmark} /> : ''}
                </div>
                <div className="cg-med-info">
                  <div className="cg-med-name">{med.name}</div>
                  <div className="cg-med-meta">{med.time} · {med.dosage}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leaflet Map Geofencing */}
        <div className="cg-section">
          <div className="cg-section-header">
            <span className="cg-section-title"><FontAwesomeIcon icon={faLocationDot} /> Vị trí hiện tại & Vùng an toàn</span>
          </div>
          <div style={{ height: '250px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={mapCenter}>
                <Popup>
                  {elderlyProfile.name} đang ở đây.<br/>144 Xuân Thủy, Cầu Giấy.
                </Popup>
              </Marker>
              <Circle center={mapCenter} radius={500} pathOptions={{ color: 'var(--success)', fillColor: 'var(--success)', fillOpacity: 0.2 }} />
            </MapContainer>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '8px' }}>Cảnh báo sẽ được gửi nếu rời khỏi vòng tròn 500m.</p>
        </div>
      </div>

      {/* Settings Modal for Remote Config */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2><FontAwesomeIcon icon={faGear} /> Cấu hình từ xa</h2>
              <button className="settings-modal-close-icon" onClick={() => setShowSettings(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            
            <div className="settings-modal-body">
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '16px' }}>Quản lý đơn thuốc</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                  {meds.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>Chưa có thuốc nào.</div>
                  ) : (
                    meds.map(med => (
                      <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '8px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--gray-800)' }}>{med.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{med.time} • {med.dosage}</div>
                        </div>
                        <button onClick={() => onDeleteMedication(med.id)} style={{ background: 'var(--danger-surface)', border: 'none', color: 'var(--danger)', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ background: 'var(--white)', borderTop: '1px solid var(--gray-200)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '16px' }}>Thêm thuốc mới</h3>
                <form onSubmit={handleAddMedSubmit}>
                  <div className="settings-form-group">
                    <label>Tên thuốc</label>
                    <input type="text" className="settings-input" placeholder="VD: Thuốc mỡ, Thuốc Huyết Áp" value={newMedName} onChange={e => setNewMedName(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div className="settings-form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Giờ uống</label>
                      <input type="time" className="settings-input" value={newMedTime} onChange={e => setNewMedTime(e.target.value)} required />
                    </div>
                    <div className="settings-form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Liều lượng</label>
                      <input type="text" className="settings-input" placeholder="VD: 1 viên" value={newMedDose} onChange={e => setNewMedDose(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="settings-btn-primary">
                    <FontAwesomeIcon icon={faPlus} /> Thêm vào lịch
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
