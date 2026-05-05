import { useState, useCallback } from 'react';
import ElderlyView from './pages/ElderlyView';
import CaregiverView from './pages/CaregiverView';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faPersonCane, faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { medications as initialMeds, elderlyProfile as initialProfile, activityStatus as initialActivity, mockAlerts as initialAlerts } from './data/mockData';
import type { Alert, Medication, ElderlyProfile, ActivityStatus } from './data/mockData';
import './index.css';

type Role = 'select' | 'elderly' | 'caregiver';

function App() {
  const [role, setRole] = useState<Role>('select');
  const [caregiverAlerts, setCaregiverAlerts] = useState<Alert[]>(initialAlerts);
  const [meds, setMeds] = useState<Medication[]>(initialMeds);
  const [elderlyProfile] = useState<ElderlyProfile>(initialProfile);
  const [activity] = useState<ActivityStatus>(initialActivity);

  const handleMedicationStatusChange = useCallback((med: Medication, status: Medication['status']) => {
    setMeds((prev) => prev.map((m) => (m.id === med.id ? { ...m, status } : m)));
    
    if (status === 'missed') {
      const newAlert: Alert = {
        id: `alert-missed-${med.id}-${Date.now()}`,
        type: 'medication',
        message: `${med.name} (${med.time}) chưa được uống!`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setCaregiverAlerts((prev) => [newAlert, ...prev]);
    } else if (status === 'completed') {
      const newAlert: Alert = {
        id: `alert-completed-${med.id}-${Date.now()}`,
        type: 'health',
        message: `Đã uống: ${med.name} (${med.time})`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setCaregiverAlerts((prev) => [newAlert, ...prev]);
    }
  }, []);

  const handleSOS = useCallback(() => {
    const newAlert: Alert = {
      id: `alert-sos-${Date.now()}`,
      type: 'sos',
      message: `Cảnh báo khẩn cấp (SOS) từ ${elderlyProfile.name}!`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setCaregiverAlerts((prev) => [newAlert, ...prev]);
  }, [elderlyProfile.name]);

  const handleAddMedication = useCallback((med: Medication) => {
    setMeds(prev => [...prev, med].sort((a, b) => a.time.localeCompare(b.time)));
  }, []);

  const handleDeleteMedication = useCallback((id: string) => {
    setMeds(prev => prev.filter(m => m.id !== id));
  }, []);

  if (role === 'elderly') {
    return (
      <ElderlyView
        onBack={() => setRole('select')}
        meds={meds}
        onMedicationStatusChange={handleMedicationStatusChange}
        elderlyProfile={elderlyProfile}
        onSOS={handleSOS}
      />
    );
  }

  if (role === 'caregiver') {
    return (
      <CaregiverView
        onBack={() => setRole('select')}
        alerts={caregiverAlerts}
        meds={meds}
        elderlyProfile={elderlyProfile}
        activity={activity}
        onAddMedication={handleAddMedication}
        onDeleteMedication={handleDeleteMedication}
      />
    );
  }

  return (
    <div className="role-selector">
      <div className="role-selector-content">
        <div className="role-logo">
          <span className="logo-icon"><FontAwesomeIcon icon={faHouse} /></span>Alo Nhà
        </div>
        <div className="role-slogan">"Chạm là thấy, gọi là nghe"</div>

        <div className="role-cards">
          <div className="role-card" onClick={() => setRole('elderly')}>
            <div className="role-card-icon elderly"><FontAwesomeIcon icon={faPersonCane} /></div>
            <div className="role-card-info">
              <h3>Người cao tuổi</h3>
              <p>Giao diện đơn giản, dễ sử dụng</p>
            </div>
          </div>
          <div className="role-card" onClick={() => setRole('caregiver')}>
            <div className="role-card-icon caregiver"><FontAwesomeIcon icon={faUserDoctor} /></div>
            <div className="role-card-info">
              <h3>Người thân</h3>
              <p>Theo dõi sức khỏe & nhận cảnh báo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
