import { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faArrowLeft, faHand, faPills, faCheckCircle, faCheck, faTriangleExclamation, faMicrophone, faPhoneSlash } from '@fortawesome/free-solid-svg-icons';
import type { Medication, ElderlyProfile } from '../data/mockData';

// Polyfill for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface ElderlyViewProps {
  onBack: () => void;
  meds: Medication[];
  elderlyProfile: ElderlyProfile;
  onMedicationStatusChange: (med: Medication, status: Medication['status']) => void;
  onSOS: () => void;
}

export default function ElderlyView({ onBack, meds, elderlyProfile, onMedicationStatusChange, onSOS }: ElderlyViewProps) {
  const [showSOS, setShowSOS] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Accessibility & Video Call States
  const [isListening, setIsListening] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Medication timing logic (simulate missed meds)
  useEffect(() => {
    const pending = meds.find((m) => m.status === 'pending');
    if (!pending) return;
    const timeout = setTimeout(() => {
      onMedicationStatusChange(pending, 'missed');
    }, 15000); // Trigger missed after 15s for demo
    return () => clearTimeout(timeout);
  }, [meds, onMedicationStatusChange]);

  const nextPending = meds.find((m) => m.status === 'pending');

  const handleDone = useCallback(() => {
    if (!nextPending) return;
    onMedicationStatusChange(nextPending, 'completed');
  }, [nextPending, onMedicationStatusChange]);

  const handleSOSClick = useCallback(() => {
    setShowSOS(true);
    onSOS();
    speak('Đang gửi cảnh báo khẩn cấp đến người thân.');
  }, [onSOS]);

  // Accessibility: Text-to-Speech (TTS)
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9; // Slightly slower for elderly
      window.speechSynthesis.speak(utterance);
    }
  };

  // Announce next medication when it changes
  useEffect(() => {
    if (nextPending) {
      speak(`Bạn có lịch uống ${nextPending.dosage} ${nextPending.name} vào lúc ${nextPending.time}`);
    }
  }, [nextPending?.id]); // Only run when the ID changes

  // Accessibility: Voice Commands
  const toggleListening = () => {
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      speak('Đang nghe');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice command:', transcript);

      if (transcript.includes('cứu') || transcript.includes('cấp cứu') || transcript.includes('sos')) {
        handleSOSClick();
      } else if (transcript.includes('uống thuốc') || transcript.includes('đã uống')) {
        handleDone();
        speak('Đã ghi nhận uống thuốc.');
      } else if (transcript.includes('gọi')) {
        speak('Đang mở danh bạ người thân.');
      } else {
        speak('Xin lỗi, tôi chưa hiểu lệnh của bạn.');
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // Video Call Simulation
  // const startVideoCall = async (contactName: string) => {
  //   speak(`Đang gọi video cho ${contactName}`);
  //   setShowVideoCall(true);
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  //     setVideoStream(stream);
  //   } catch (err) {
  //     console.error("Camera error:", err);
  //     alert("Không thể truy cập camera.");
  //   }
  // };

  const endVideoCall = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setShowVideoCall(false);
  };

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, showVideoCall]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{greeting}, {elderlyProfile.name.split(' ').pop()} <FontAwesomeIcon icon={faHand} /></h2>
            <p>Chạm là thấy, gọi là nghe</p>
          </div>
          <button
            onClick={toggleListening}
            style={{
              width: '50px', height: '50px', borderRadius: '50%', border: 'none',
              background: isListening ? '#EF4444' : 'rgba(255,255,255,0.2)',
              color: 'white', fontSize: '20px', cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            aria-label="Ra lệnh bằng giọng nói"
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
        </div>
      </div>

      <div className="elderly-content">
        {/* Medication Card */}
        <div className="med-card" onClick={() => speak("Danh sách thuốc hôm nay")}>
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
            <button className="sos-btn" onClick={handleSOSClick} aria-label="Gọi cấp cứu SOS">
              SOS
            </button>
          </div>
          <div className="sos-label">Nhấn khi cần trợ giúp khẩn cấp</div>
        </div>

        {/* Contact Grid */}
        <div className="contact-grid">
          {elderlyProfile.contacts.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: '8px' }}>
              <a className="contact-btn" href={`tel:${c.phone}`} style={{ textDecoration: 'none', flex: 1 }} onClick={() => speak(`Đang gọi ${c.name}`)}>
                <div className="contact-avatar"><FontAwesomeIcon icon={c.avatar} /></div>
                <span>Gọi {c.relation === 'Con trai' ? 'Con' : 'Cháu'}</span>
                <small>{c.name}</small>
              </a>
            </div>
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

      {/* Mock Video Call Modal */}
      {showVideoCall && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, textAlign: 'center', color: 'white' }}>
              <h3>Đang gọi video...</h3>
              <p style={{ opacity: 0.8 }}>Chờ người thân bắt máy</p>
            </div>
          </div>
          <div style={{ padding: '30px', display: 'flex', justifyContent: 'center', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
            <button
              onClick={endVideoCall}
              style={{
                width: '72px', height: '72px', borderRadius: '50%', background: '#EF4444',
                color: 'white', fontSize: '28px', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
              }}
            >
              <FontAwesomeIcon icon={faPhoneSlash} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
