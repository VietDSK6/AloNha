import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faArrowLeft, faHand, faPills, faCheckCircle, faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { medications as initialMeds, elderlyProfile, type Medication } from '../data/mockData';

interface ElderlyViewProps {
  onBack: () => void;
  onMedicationMissed?: (med: Medication) => void;
}

export default function ElderlyView({ onBack, onMedicationMissed }: ElderlyViewProps) {
  const [meds, setMeds] = useState<Medication[]>(initialMeds);
  const [showSOS, setShowSOS] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Simulate missed medication alert after 10 seconds
  useEffect(() => {
    const pending = meds.find((m) => m.status === 'pending');
    if (!pending) return;
    const timeout = setTimeout(() => {
      const updated = meds.map((m) =>
        m.id === pending.id ? { ...m, status: 'missed' as const } : m
      );
      setMeds(updated);
      onMedicationMissed?.(pending);
    }, 15000);
    return () => clearTimeout(timeout);
  }, [meds, onMedicationMissed]);

  const nextPending = meds.find((m) => m.status === 'pending');

  const handleDone = useCallback(() => {
    if (!nextPending) return;
    setMeds((prev) =>
      prev.map((m) => (m.id === nextPending.id ? { ...m, status: 'completed' as const } : m))
    );
  }, [nextPending]);

  const greeting = currentTime.getHours() < 12 ? 'Chào buổi sáng' : currentTime.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="elderly-view">
      <div className="elderly-header">
        <div className="elderly-header-top">
          <div className="elderly-logo"><FontAwesomeIcon icon={faHouse} /> Alo Nhà</div>
          <button className="elderly-back-btn" onClick={onBack} aria-label="Quay lại">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        </div>
      </div>

      <div className="elderly-greeting">
        <h2>{greeting}, {elderlyProfile.name.split(' ').pop()} <FontAwesomeIcon icon={faHand} /></h2>
        <p>Chạm là thấy, gọi là nghe</p>
      </div>

      <div className="elderly-content">
        {/* Medication Card */}
        <div className="med-card">
          <div className="med-card-header">
            <div className="med-card-icon"><FontAwesomeIcon icon={faPills} /></div>
            <div>
              <div className="med-card-title">Thuốc hôm nay</div>
              <div className="med-card-subtitle">
                {meds.filter((m) => m.status === 'completed').length}/{meds.length} đã uống
              </div>
            </div>
          </div>

          {nextPending ? (
            <>
              <div className="med-next">
                <div className="med-next-info">
                  <div className="med-next-time">{nextPending.time}</div>
                  <div>
                    <div className="med-next-name">{nextPending.name}</div>
                    <div className="med-next-dose">{nextPending.dosage}</div>
                  </div>
                </div>
              </div>
              <button className="med-done-btn" onClick={handleDone}>
                <FontAwesomeIcon icon={faCheck} /> Đã uống
              </button>
            </>
          ) : (
            <button className="med-done-btn completed" disabled>
              <FontAwesomeIcon icon={faCheckCircle} /> Đã uống hết thuốc hôm nay
            </button>
          )}
        </div>

        {/* SOS Button */}
        <div className="sos-section">
          <div className="sos-btn-wrapper">
            <div className="sos-pulse-ring" />
            <div className="sos-pulse-ring" />
            <div className="sos-pulse-ring" />
            <button className="sos-btn" onClick={() => setShowSOS(true)} aria-label="Gọi cấp cứu SOS">
              SOS
            </button>
          </div>
          <div className="sos-label">Nhấn khi cần trợ giúp khẩn cấp</div>
        </div>

        {/* Contact Grid */}
        <div className="contact-grid">
          {elderlyProfile.contacts.map((c) => (
            <a key={c.id} className="contact-btn" href={`tel:${c.phone}`} style={{ textDecoration: 'none' }}>
              <div className="contact-avatar"><FontAwesomeIcon icon={c.avatar} /></div>
              <span>Gọi {c.relation === 'Con trai' ? 'Con' : 'Cháu'}</span>
              <small>{c.name}</small>
            </a>
          ))}
        </div>
      </div>

      {/* SOS Modal */}
      {showSOS && (
        <div className="sos-modal-overlay" onClick={() => setShowSOS(false)}>
          <div className="sos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sos-modal-icon"><FontAwesomeIcon icon={faTriangleExclamation} /></div>
            <h2>Đang gửi cảnh báo!</h2>
            <p>Đang gửi cảnh báo và vị trí đến người thân...</p>
            <p className="sos-modal-sub">Gia đình sẽ nhận được thông báo ngay lập tức</p>
            <button className="sos-modal-close" onClick={() => setShowSOS(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
