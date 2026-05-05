import { useAuth } from './hooks/useAuth';
import ElderlyView from './pages/ElderlyView';
import CaregiverView from './pages/CaregiverView';
import LoginPage from './pages/LoginPage';
import './index.css';

function App() {
  const { profile, loading, elderId, signUp, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  // Not logged in → show login
  if (!profile) {
    return <LoginPage onSignUp={signUp} onSignIn={signIn} />;
  }

  // Logged in as elderly
  if (profile.role === 'elderly' && elderId) {
    return (
      <ElderlyView
        elderId={elderId}
        profileName={profile.name}
        onSignOut={signOut}
      />
    );
  }

  // Logged in as caregiver
  if (profile.role === 'caregiver' && elderId) {
    return (
      <CaregiverView
        elderId={elderId}
        caregiverName={profile.name}
        onSignOut={signOut}
      />
    );
  }

  // Edge case: caregiver not linked yet
  return (
    <div className="loading-screen">
      <p>Chưa liên kết với người cao tuổi nào.</p>
      <button onClick={signOut} style={{ marginTop: '16px', padding: '12px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        Đăng xuất
      </button>
    </div>
  );
}

export default App;
