import { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse, faHand, faPills, faCheckCircle, faCheck,
  faTriangleExclamation, faMicrophone, faPhoneSlash,
  faRightFromBracket, faPhone, faUsers
} from '@fortawesome/free-solid-svg-icons';
import { useRealtimeMeds } from '../hooks/useRealtimeMeds';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';
import { supabase } from '../lib/supabase';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface Caregiver {
  id: string;
  name: string;
  phone: string;
}

interface ElderlyViewProps {
  elderId: string;
  profileName: string;
  onSignOut: () => void;
}

export default function ElderlyView({ elderId, profileName, onSignOut }: ElderlyViewProps) {
  const { meds, updateMedStatus } = useRealtimeMeds(elderId);
  const { createAlert } = useRealtimeAlerts(elderId);

  const [showSOS, setShowSOS] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isListening, setIsListening] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch linked caregivers
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, phone')
      .eq('elder_id', elderId)
      .eq('role', 'caregiver')
      .then(({ data }) => {
        if (data) setCaregivers(data as Caregiver[]);
      });
  }, [elderId]);

  const nextPending = meds.find((m) => m.status === 'pending');

  const handleDone = useCallback(() => {
    if (!nextPending) return;
    updateMedStatus(nextPending.id, 'completed');
    createAlert('health', `Đã uống: ${nextPending.name} (${nextPending.time})`);
    speak(`Đã ghi nhận uống ${nextPending.name}.`);
  }, [nextPending, updateMedStatus, createAlert]);

  const handleSOSClick = useCallback(() => {
    setShowSOS(true);
    createAlert('sos', `Cảnh báo khẩn cấp (SOS) từ ${profileName}!`);
    speak('Đang gửi cảnh báo khẩn cấp đến người thân.');
  }, [createAlert, profileName]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  useEffect(() => {
    if (nextPending) {
      speak(`Bạn có lịch uống ${nextPending.dosage} ${nextPending.name} lúc ${nextPending.time}`);
    }
  }, [nextPending?.id]);

  const toggleListening = () => {
    if (!SpeechRecognition) { alert('Trình duyệt không hỗ trợ.'); return; }
    if (isListening) { setIsListening(false); return; }
    const r = new SpeechRecognition();
    r.lang = 'vi-VN'; r.continuous = false; r.interimResults = false;
    r.onstart = () => { setIsListening(true); speak('Đang nghe'); };
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript.toLowerCase();
      if (t.includes('cứu') || t.includes('sos')) handleSOSClick();
      else if (t.includes('uống')) handleDone();
      else speak('Xin lỗi, chưa hiểu.');
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    r.start();
  };

  const endVideoCall = () => {
    videoStream?.getTracks().forEach(t => t.stop());
    setVideoStream(null);
    setShowVideoCall(false);
  };

  useEffect(() => {
    if (videoRef.current && videoStream) videoRef.current.srcObject = videoStream;
  }, [videoStream, showVideoCall]);

  const greeting = currentTime.getHours() < 12 ? 'Chào buổi sáng'
    : currentTime.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="elderly-view">
      <div className="elderly-header">
        <div className="elderly-header-top">
          <div className="elderly-logo"><FontAwesomeIcon icon={faHouse} /> Alo Nhà</div>
          <button className="elderly-back-btn" onClick={onSignOut}><FontAwesomeIcon icon={faRightFromBracket} /></button>
        </div>
      </div>

      <div className="elderly-greeting">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{greeting}, {profileName.split(' ').pop()} <FontAwesomeIcon icon={faHand} /></h2>
            <p>Chạm là thấy, gọi là nghe</p>
          </div>
          <button onClick={toggleListening} style={{ width: 50, height: 50, borderRadius: '50%', border: 'none', background: isListening ? '#EF4444' : 'rgba(255,255,255,0.2)', color: 'white', fontSize: 20, cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
        </div>
      </div>

      <div className="elderly-content">
        {/* Medication Card */}
        <div className="med-card">
          <div className="med-card-header">
            <div className="med-card-icon"><FontAwesomeIcon icon={faPills} /></div>
            <div>
              <div className="med-card-title">Thuốc hôm nay</div>
              <div className="med-card-subtitle">{meds.filter(m => m.status === 'completed').length}/{meds.length} đã uống</div>
            </div>
          </div>
          {nextPending ? (<>
            <div className="med-next">
              <div className="med-next-info">
                <div className="med-next-time">{nextPending.time}</div>
                <div><div className="med-next-name">{nextPending.name}</div><div className="med-next-dose">{nextPending.dosage}</div></div>
              </div>
            </div>
            <button className="med-done-btn" onClick={handleDone}><FontAwesomeIcon icon={faCheck} /> Đã uống</button>
          </>) : (
            <button className="med-done-btn completed" disabled>
              <FontAwesomeIcon icon={faCheckCircle} /> {meds.length === 0 ? 'Chưa có lịch thuốc' : 'Đã uống hết hôm nay'}
            </button>
          )}
        </div>

        {/* Caregiver Contact List */}
        <div className="contact-section">
          <div className="contact-section-title">
            <FontAwesomeIcon icon={faUsers} /> Người thân đang theo dõi
          </div>
          {caregivers.length === 0 ? (
            <div className="contact-empty">Chưa có người thân nào liên kết</div>
          ) : (
            <div className="contact-grid">
              {caregivers.map((cg) => (
                <a
                  key={cg.id}
                  href={`tel:${cg.phone}`}
                  className="contact-card"
                  aria-label={`Gọi cho ${cg.name}`}
                >
                  <div className="contact-avatar">
                    {cg.name.split(' ').pop()?.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-name">{cg.name}</div>
                  <div className="contact-call-btn">
                    <FontAwesomeIcon icon={faPhone} /> Gọi
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* SOS Button */}
        <div className="sos-section">
          <div className="sos-btn-wrapper">
            <div className="sos-pulse-ring" /><div className="sos-pulse-ring" /><div className="sos-pulse-ring" />
            <button className="sos-btn" onClick={handleSOSClick}>SOS</button>
          </div>
          <div className="sos-label">Nhấn khi cần trợ giúp khẩn cấp</div>
        </div>
      </div>

      {showSOS && (
        <div className="sos-modal-overlay" onClick={() => setShowSOS(false)}>
          <div className="sos-modal" onClick={e => e.stopPropagation()}>
            <div className="sos-modal-icon"><FontAwesomeIcon icon={faTriangleExclamation} /></div>
            <h2>Đang gửi cảnh báo!</h2>
            <p>Người thân sẽ nhận được thông báo ngay lập tức</p>
            <button className="sos-modal-close" onClick={() => setShowSOS(false)}>Đóng</button>
          </div>
        </div>
      )}

      {showVideoCall && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ padding: 30, display: 'flex', justifyContent: 'center' }}>
            <button onClick={endVideoCall} style={{ width: 72, height: 72, borderRadius: '50%', background: '#EF4444', color: 'white', fontSize: 28, border: 'none', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faPhoneSlash} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
