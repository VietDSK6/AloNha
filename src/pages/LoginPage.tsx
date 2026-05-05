import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faPhone, faLock, faUser, faPersonCane, faUserDoctor, faLink } from '@fortawesome/free-solid-svg-icons';
import type { Profile } from '../hooks/useAuth';

interface LoginPageProps {
  onSignUp: (phone: string, password: string, name: string, role: 'elderly' | 'caregiver', linkCode?: string) => Promise<Profile | null>;
  onSignIn: (phone: string, password: string) => Promise<void>;
}

export default function LoginPage({ onSignUp, onSignIn }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'elderly' | 'caregiver' | null>(null);
  const [linkCode, setLinkCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await onSignIn(phone, password);
      } else {
        if (!role) {
          setError('Vui lòng chọn vai trò');
          setLoading(false);
          return;
        }
        if (role === 'caregiver' && !linkCode) {
          setError('Vui lòng nhập số điện thoại của người cao tuổi');
          setLoading(false);
          return;
        }
        await onSignUp(phone, password, name, role, role === 'caregiver' ? linkCode : undefined);
        if (role === 'elderly') setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };



  // Show success screen after elderly signup
  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo"><FontAwesomeIcon icon={faHouse} /> Alo Nhà</div>
            <p>Đăng ký thành công! 🎉</p>
          </div>
          <div className="link-code-section">
            <h3>Chào mừng bạn!</h3>
            <p className="link-code-desc">
              Để người thân theo dõi sức khỏe cho bạn, hãy cho họ biết <strong>số điện thoại</strong> của bạn (<strong>{phone}</strong>) để họ nhập khi đăng ký.
            </p>
          </div>
          <button className="login-btn" onClick={() => window.location.reload()}>
            Vào ứng dụng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo"><FontAwesomeIcon icon={faHouse} /> Alo Nhà</div>
          <p className="login-slogan">"Chạm là thấy, gọi là nghe"</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Đăng nhập
          </button>
          <button
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'signup' && (
            <div className="login-field">
              <label><FontAwesomeIcon icon={faUser} /> Họ và tên</label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn Minh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="login-field">
            <label><FontAwesomeIcon icon={faPhone} /> Số điện thoại</label>
            <input
              type="tel"
              placeholder="VD: 0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label><FontAwesomeIcon icon={faLock} /> Mật khẩu</label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="login-field">
                <label>Bạn là ai?</label>
                <div className="role-select-grid">
                  <button
                    type="button"
                    className={`role-select-btn ${role === 'elderly' ? 'active' : ''}`}
                    onClick={() => setRole('elderly')}
                  >
                    <FontAwesomeIcon icon={faPersonCane} />
                    <span>Người cao tuổi</span>
                  </button>
                  <button
                    type="button"
                    className={`role-select-btn ${role === 'caregiver' ? 'active' : ''}`}
                    onClick={() => setRole('caregiver')}
                  >
                    <FontAwesomeIcon icon={faUserDoctor} />
                    <span>Người thân</span>
                  </button>
                </div>
              </div>

              {role === 'caregiver' && (
                <div className="login-field">
                  <label><FontAwesomeIcon icon={faLink} /> Số điện thoại của người cao tuổi</label>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại của Ba/Mẹ"
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value)}
                    required
                  />
                </div>
              )}
            </>
          )}

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>
      </div>
    </div>
  );
}
