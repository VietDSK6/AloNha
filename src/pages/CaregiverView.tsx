import { useState, useEffect } from 'react';
import {
  medications,
  healthMetrics,
  activityStatus as initialActivity,
  elderlyProfile,
  mockAlerts as initialAlerts,
  generateHeartRateHistory,
  type Alert,
  type Medication,
  type ActivityStatus,
} from '../data/mockData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faPills, faTriangleExclamation, faHeartPulse, faStethoscope, faPersonRunning, faCircle, faLocationDot, faStar, faCheck, faXmark, faExclamation, faHeart } from '@fortawesome/free-solid-svg-icons';

interface CaregiverViewProps {
  onBack: () => void;
  externalAlerts?: Alert[];
}

export default function CaregiverView({ onBack, externalAlerts = [] }: CaregiverViewProps) {
  const [alerts, setAlerts] = useState<Alert[]>([...initialAlerts, ...externalAlerts]);
  const [heartRate, setHeartRate] = useState(healthMetrics.heartRate);
  const [activity, setActivity] = useState<ActivityStatus>(initialActivity);
  const [meds] = useState<Medication[]>(medications);
  const [hrHistory] = useState(generateHeartRateHistory);

  // Merge external alerts
  useEffect(() => {
    if (externalAlerts.length > 0) {
      setAlerts((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const newAlerts = externalAlerts.filter((a) => !ids.has(a.id));
        return [...newAlerts, ...prev];
      });
    }
  }, [externalAlerts]);

  // Simulate real-time heart rate
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate(72 + Math.floor(Math.random() * 12 - 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulate activity warning toggle
  useEffect(() => {
    const timeout = setTimeout(() => {
      setActivity({
        status: 'warning',
        message: 'Cảnh báo: Không có vận động trong 6 giờ qua',
        lastMovement: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      });
    }, 20000);
    return () => clearTimeout(timeout);
  }, []);

  const unreadAlerts = alerts.filter((a) => !a.read);

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
            <button className="cg-notif-btn" aria-label="Thông báo">
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
        {/* Alert Banners */}
        {unreadAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`cg-alert-banner ${alert.type === 'sos' ? 'danger' : ''}`}
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
              {new Date(alert.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {/* Health Cards */}
        <div className="cg-health-grid">
          <div className="cg-health-card heart">
            <div className="cg-health-card-icon"><FontAwesomeIcon icon={faHeart} /></div>
            <div className="cg-health-card-label">Nhịp tim</div>
            <div className="cg-health-card-value">
              {heartRate} <span>bpm</span>
            </div>
            <div className={`cg-health-card-status ${heartRate > 90 ? 'warning' : 'normal'}`}>
              {heartRate > 90 ? '⚠️ Cao' : '✓ Bình thường'}
            </div>
            <div className="cg-hr-chart">
              {hrHistory.slice(-12).map((d, i) => (
                <div key={i} className="cg-hr-bar" style={{ height: `${((d.value - 60) / 30) * 100}%` }} title={`${d.time}: ${d.value} bpm`} />
              ))}
            </div>
          </div>

          <div className="cg-health-card bp">
            <div className="cg-health-card-icon"><FontAwesomeIcon icon={faStethoscope} /></div>
            <div className="cg-health-card-label">Huyết áp</div>
            <div className="cg-health-card-value">
              {healthMetrics.bloodPressureSystolic}/{healthMetrics.bloodPressureDiastolic}
              <span> mmHg</span>
            </div>
            <div className="cg-health-card-status normal">✓ Bình thường</div>
          </div>
        </div>

        {/* Activity Monitor */}
        <div className="cg-section">
          <div className="cg-section-header">
            <span className="cg-section-title"><FontAwesomeIcon icon={faPersonRunning} /> Hoạt động</span>
            <span className={`cg-section-badge ${activity.status}`}>
              {activity.status === 'normal' ? '✓ Bình thường' : '⚠️ Cảnh báo'}
            </span>
          </div>
          <div className="cg-activity-detail">
            <span><FontAwesomeIcon icon={faCircle} style={{ color: activity.status === 'normal' ? 'var(--success)' : 'var(--warning)', fontSize: '12px' }} /></span>
            {activity.message}
          </div>
        </div>

        {/* Medication Tracker */}
        <div className="cg-section">
          <div className="cg-section-header">
            <span className="cg-section-title"><FontAwesomeIcon icon={faPills} /> Lịch uống thuốc</span>
          </div>
          {meds.map((med) => (
            <div key={med.id} className="cg-med-item">
              <div className={`cg-med-check ${med.status}`}>
                {med.status === 'completed' ? <FontAwesomeIcon icon={faCheck} /> : med.status === 'missed' ? <FontAwesomeIcon icon={faXmark} /> : ''}
              </div>
              <div className="cg-med-info">
                <div className="cg-med-name">{med.name}</div>
                <div className="cg-med-time">{med.time} · {med.dosage}</div>
              </div>
              <span className={`cg-med-status ${med.status}`}>
                {med.status === 'completed' ? 'Đã uống' : med.status === 'missed' ? 'Bỏ lỡ' : 'Chờ uống'}
              </span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="cg-section">
          <div className="cg-section-header">
            <span className="cg-section-title"><FontAwesomeIcon icon={faLocationDot} /> Vị trí hiện tại</span>
          </div>
          <div className="cg-map-frame">
            <div className="cg-map-pin"><FontAwesomeIcon icon={faLocationDot} /></div>
            <div className="cg-map-label">144 Xuân Thủy, Cầu Giấy, Hà Nội</div>
          </div>
        </div>

        {/* Premium CTA */}
        <div className="cg-premium">
          <h3><FontAwesomeIcon icon={faStar} /> Nâng cấp Premium</h3>
          <p>Theo dõi sức khỏe nâng cao, báo cáo tuần & nhiều hơn</p>
          <div className="cg-premium-price">
            99.000đ <span>/tháng</span>
          </div>
          <button className="cg-premium-btn" onClick={() => alert('Tính năng đang phát triển!')}>
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
}
