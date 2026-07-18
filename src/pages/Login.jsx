import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'shopkeeper') navigate('/shopkeeper');
      else navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    alert("For testing purposes, please use the default password 'password123' for the pre-seeded accounts.\n\nIf you created a new account and forgot your password, please contact the administrator (admin@perkpay.com) to reset it from the database.");
  }

  return (
    <div className="page-container" style={{ justifyContent: 'center', padding: '0 28px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={logoStyles}>P</div>
        <h1 style={{ fontSize: 28, marginTop: 18 }}>PerkPay</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Spend local, earn more.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="label">Email</label>
        <input
          className="input" type="email" required placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label className="label">Password</label>
          <a href="#" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }} style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 500 }}>
            Forgot password?
          </a>
        </div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--text-muted)', fontSize: 14 }}>
        Don't have an account? <Link to="/signup" style={{ color: 'var(--brand)', fontWeight: 600 }}>Sign up</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12.5, color: 'var(--text-faint)' }}>
        Shopkeepers &amp; admins use the same login with their assigned email.
      </p>
    </div>
  );
}

const logoStyles = {
  width: 64, height: 64, margin: '0 auto',
  borderRadius: 18, background: 'var(--brand)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
};
