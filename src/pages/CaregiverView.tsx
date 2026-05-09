import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faPills, faTriangleExclamation, faHeartPulse, faStethoscope, faLocationDot, faCheck, faXmark, faExclamation, faHeart, faGear, faTrash, faPlus, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRealtimeMeds } from '../hooks/useRealtimeMeds';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';
import { supabase } from '../lib/supabase';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CaregiverViewProps {
  elderId: string;
  caregiverName: string;
  onSignOut: () => void;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

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

export default function CaregiverView({ elderId, caregiverName, onSignOut }: CaregiverViewProps) {
  const { meds, addMedication, deleteMedication } = useRealtimeMeds(elderId);
  const { alerts, markAsRead } = useRealtimeAlerts(elderId);

  const [elderProfile, setElderProfile] = useState<{ name: string; phone: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newMedDose, setNewMedDose] = useState('1 viên');

  // Fetch elder's profile info
  useEffect(() => {
    supabase
      .from('profiles')
      .select('name, phone')
      .eq('id', elderId)
      .single()
      .then(({ data }) => {
        if (data) setElderProfile(data as { name: string; phone: string });
      });
  }, [elderId]);

  const unreadAlerts = alerts.filter(a => !a.read);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.0382, 105.7827]);

  // Extract the latest location from alerts for persistence across refreshes
  useEffect(() => {
    const locAlert = alerts.find(a => a.message.includes('|'));
    if (locAlert) {
      const parts = locAlert.message.split('|');
      if (parts.length > 1) {
        const coordsStr = parts[parts.length - 1];
        const [latStr, lngStr] = coordsStr.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
        }
      }
    }
  }, [alerts]);

  const handleAddMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;
    addMedication(newMedName, newMedTime, newMedDose);
    setNewMedName('');
    setNewMedTime('08:00');
    setNewMedDose('1 viên');
  };

  return (
    <div className="caregiver-view">
      <div className="cg-header">
        <div className="cg-header-top">
          <div className="cg-header-left">
            <button className="elderly-back-btn" onClick={onSignOut} aria-label="Đăng xuất"><FontAwesomeIcon icon={faRightFromBracket} /></button>
            <span className="cg-logo">Alo Nhà</span>
            <span className="cg-badge">Người thân</span>
          </div>
          <div className="cg-header-right">
            <button className="cg-notif-btn" onClick={() => setShowSettings(true)}><FontAwesomeIcon icon={faGear} /></button>
            <button className="cg-notif-btn" style={{ marginLeft: '10px' }}>
              <FontAwesomeIcon icon={faBell} />
              {unreadAlerts.length > 0 && <span className="cg-notif-dot" />}
            </button>
          </div>
        </div>
        <div className="cg-profile-info">
          <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '4px' }}>Xin chào, {caregiverName} 👋</p>
          <h2>Đang chăm sóc: {elderProfile?.name ?? '...'}</h2>
          <p>{elderProfile?.phone} · {meds.length} thuốc · {meds.filter(m => m.status === 'completed').length} đã uống</p>
        </div>
      </div>

      <div className="cg-content">
        {/* Alerts */}
        {unreadAlerts.length > 0 && (
          <div className="cg-alerts">
            {unreadAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`cg-alert-banner ${alert.type === 'sos' ? 'danger' : alert.type === 'health' ? 'success' : ''}`}>
                <span className="cg-alert-icon">
                  <FontAwesomeIcon icon={alert.type === 'medication' ? faPills : alert.type === 'sos' ? faTriangleExclamation : alert.type === 'health' ? faHeartPulse : faExclamation} />
                </span>
                <span className="cg-alert-text">{alert.message.split('|')[0]}</span>
                <span className="cg-alert-time">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <button
                  onClick={() => markAsRead(alert.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    opacity: 0.7,
                    cursor: 'pointer',
                    marginLeft: '8px',
                    padding: '4px'
                  }}
                  aria-label="Đóng"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="cg-section">
          <div className="cg-section-header"><span className="cg-section-title"><FontAwesomeIcon icon={faPills} /> Lịch uống thuốc</span></div>
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
        {/* Charts */}
        <div className="cg-section">
          <div className="cg-section-header"><span className="cg-section-title"><FontAwesomeIcon icon={faHeart} /> Nhịp tim (Hôm nay)</span></div>
          <div style={{ width: '100%', height: 200, background: 'white', borderRadius: '12px', padding: '10px' }}>
            <ResponsiveContainer>
              <AreaChart data={heartRateData}>
                <defs><linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient></defs>
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
          <div className="cg-section-header"><span className="cg-section-title"><FontAwesomeIcon icon={faStethoscope} /> Huyết áp (7 ngày)</span></div>
          <div style={{ width: '100%', height: 200, background: 'white', borderRadius: '12px', padding: '10px' }}>
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

        {/* Map */}
        <div className="cg-section">
          <div className="cg-section-header"><span className="cg-section-title"><FontAwesomeIcon icon={faLocationDot} /> Vị trí & Vùng an toàn</span></div>
          <div style={{ height: '250px', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <MapRecenter center={mapCenter} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={mapCenter}><Popup>Vị trí hiện tại</Popup></Marker>
              <Circle center={mapCenter} radius={500} pathOptions={{ color: '#059669', fillColor: '#059669', fillOpacity: 0.2 }} />
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2><FontAwesomeIcon icon={faGear} /> Quản lý đơn thuốc</h2>
              <button className="settings-modal-close-icon" onClick={() => setShowSettings(false)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="settings-modal-body">
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Thuốc hiện tại</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--gray-50)', borderRadius: '12px', padding: '8px' }}>
                  {meds.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--gray-500)' }}>Chưa có thuốc.</div>
                  ) : (
                    meds.map(med => (
                      <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '8px', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{med.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{med.time} • {med.dosage} • {med.status === 'completed' ? '✓ Đã uống' : med.status === 'missed' ? '✗ Bỏ lỡ' : 'Chờ uống'}</div>
                        </div>
                        <button onClick={() => deleteMedication(med.id)} style={{ background: '#FEF2F2', border: 'none', color: '#DC2626', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Thêm thuốc mới</h3>
                <form onSubmit={handleAddMedSubmit}>
                  <div className="settings-form-group">
                    <label>Tên thuốc</label>
                    <input type="text" className="settings-input" placeholder="VD: Thuốc Huyết Áp" value={newMedName} onChange={e => setNewMedName(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div className="settings-form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Giờ uống</label>
                      <input type="time" className="settings-input" value={newMedTime} onChange={e => setNewMedTime(e.target.value)} required />
                    </div>
                    <div className="settings-form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>Liều lượng</label>
                      <input type="text" className="settings-input" placeholder="1 viên" value={newMedDose} onChange={e => setNewMedDose(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="settings-btn-primary"><FontAwesomeIcon icon={faPlus} /> Thêm vào lịch</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
