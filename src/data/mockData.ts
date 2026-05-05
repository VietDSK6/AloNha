import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faPersonCane, faUserTie, faChild, faUserDoctor } from '@fortawesome/free-solid-svg-icons';

export interface Medication {
  id: string;
  name: string;
  time: string;
  dosage: string;
  status: 'pending' | 'completed' | 'missed';
}

export interface HealthMetric {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  lastUpdated: string;
}

export interface ActivityStatus {
  status: 'normal' | 'warning';
  message: string;
  lastMovement: string;
}

export interface ElderlyProfile {
  id: string;
  name: string;
  age: number;
  avatar: IconDefinition;
  contacts: Contact[];
}

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  avatar: IconDefinition;
}

export interface CaregiverProfile {
  id: string;
  name: string;
  relation: string;
  avatar: IconDefinition;
}

export interface Alert {
  id: string;
  type: 'sos' | 'medication' | 'activity' | 'health';
  message: string;
  timestamp: string;
  read: boolean;
}

// ---------- Mock Data ----------

export const elderlyProfile: ElderlyProfile = {
  id: 'elderly-001',
  name: 'Bà Nguyễn Thị Mai',
  age: 72,
  avatar: faPersonCane,
  contacts: [
    {
      id: 'contact-001',
      name: 'Minh',
      relation: 'Con trai',
      phone: '0901234567',
      avatar: faUserTie,
    },
    {
      id: 'contact-002',
      name: 'An',
      relation: 'Cháu',
      phone: '0912345678',
      avatar: faChild,
    },
  ],
};

export const caregiverProfile: CaregiverProfile = {
  id: 'caregiver-001',
  name: 'Nguyễn Văn Minh',
  relation: 'Con trai',
  avatar: faUserDoctor,
};

export const medications: Medication[] = [
  {
    id: 'med-001',
    name: 'Thuốc Huyết Áp',
    time: '07:00',
    dosage: '1 viên',
    status: 'completed',
  },
  {
    id: 'med-002',
    name: 'Thuốc Tim Mạch',
    time: '11:00',
    dosage: '1 viên',
    status: 'pending',
  },
  {
    id: 'med-003',
    name: 'Thuốc Tiểu Đường',
    time: '17:00',
    dosage: '2 viên',
    status: 'pending',
  },
  {
    id: 'med-004',
    name: 'Thuốc Bổ Sung Canxi',
    time: '21:00',
    dosage: '1 viên',
    status: 'pending',
  },
];

export const healthMetrics: HealthMetric = {
  heartRate: 75,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  lastUpdated: new Date().toISOString(),
};

export const activityStatus: ActivityStatus = {
  status: 'normal',
  message: 'Bình thường',
  lastMovement: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
};

export const mockAlerts: Alert[] = [
  {
    id: 'alert-001',
    type: 'medication',
    message: 'Bà Mai chưa uống Thuốc Tim Mạch (11:00)',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'alert-002',
    type: 'health',
    message: 'Nhịp tim cao bất thường: 95 bpm',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

// Generate realistic heart rate data for chart
export function generateHeartRateHistory(): { time: string; value: number }[] {
  const data: { time: string; value: number }[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseRate = 72;
    const variation = Math.sin(i * 0.5) * 8 + (Math.random() - 0.5) * 6;
    data.push({
      time: time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(baseRate + variation),
    });
  }
  return data;
}
