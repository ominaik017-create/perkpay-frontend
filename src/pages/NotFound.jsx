import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function goHome() {
    if (!user) navigate('/login');
    else if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'shopkeeper') navigate('/shopkeeper');
    else navigate('/');
  }

  return (
    <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 400 }}>
        {/* Modern 404 Art */}
        <div style={badgeStyle}>404</div>
        
        <h1 style={{ fontSize: 32, fontWeight: 700, marginTop: 20, color: 'var(--text)' }}>
          Page not found
        </h1>
        
        <p style={{ color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6, fontSize: 15 }}>
          Sorry, we couldn’t find the page you’re looking for. It might have been moved or doesn't exist.
        </p>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={goHome} className="btn btn-primary btn-block">
            Go back home
          </button>
          
          <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600, fontSize: 14 }}>
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 16px',
  borderRadius: 30,
  background: 'var(--brand-light)',
  color: 'var(--brand)',
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: 1,
};
