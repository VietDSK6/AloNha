import { useState, useCallback } from 'react';
import ElderlyView from './pages/ElderlyView';
import CaregiverView from './pages/CaregiverView';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faPersonCane, faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import type { Alert, Medication } from './data/mockData';
import './index.css';

type Role = 'select' | 'elderly' | 'caregiver';

function App() {
  const [role, setRole] = useState<Role>('select');
  const [caregiverAlerts, setCaregiverAlerts] = useState<Alert[]>([]);

  const handleMedicationMissed = useCallback((med: Medication) => {
    const newAlert: Alert = {
      id: `alert-missed-${med.id}-${Date.now()}`,
      type: 'medication',
      message: `${med.name} (${med.time}) chưa được uống!`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setCaregiverAlerts((prev) => [newAlert, ...prev]);
  }, []);

  if (role === 'elderly') {
    return (
      <ElderlyView
        onBack={() => setRole('select')}
        onMedicationMissed={handleMedicationMissed}
      />
    );
  }

  if (role === 'caregiver') {
    return (
      <CaregiverView
        onBack={() => setRole('select')}
        externalAlerts={caregiverAlerts}
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
