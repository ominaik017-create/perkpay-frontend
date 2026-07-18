import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, formatPoints } from '../../api';
import { useAuth } from '../../AuthContext';
import BottomNav from '../../components/BottomNav';
import TopBar from '../../components/TopBar';

const SCANNER_ID = 'qr-scanner-region';

export default function Scan() {
  const { user, refreshUser } = useAuth();
  // scanning | review | paying | waiting | done | error
  const [phase, setPhase] = useState('scanning');
  const [order, setOrder] = useState(null);
  const [applyRewards, setApplyRewards] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  useEffect(() => {
    if (phase !== 'scanning') return;
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;
    let stopped = false;

    // Guards against calling .stop() twice — once right after a
    // successful scan, and again when this effect's cleanup runs on
    // the next render. A double-stop can throw synchronously (not just
    // reject a promise), which .catch() alone doesn't catch — that was
    // crashing the whole page to a blank white screen with no error
    // shown at all.
    async function safeStop() {
      if (stopped) return;
      stopped = true;
      try {
        if (scanner.getState && scanner.getState() === 2 /* SCANNING */) {
          await scanner.stop();
        }
      } catch (_) { /* ignore — camera may already be stopped/gone */ }
      try { scanner.clear(); } catch (_) {}
    }

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 240 },
      async (decodedText) => {
        await safeStop();
        handleScanned(decodedText.trim());
      },
    ).catch(() => {
      setError('Camera access denied. Enable camera permissions to scan.');
      setPhase('error');
    });

    return () => { safeStop(); };
  }, [phase]);

  async function handleScanned(orderId) {
    try {
      const data = await api.initiateOrder(orderId);
      setOrder(data);
      setPhase('review');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  }

  async function handleContinue() {
    setError('');
    setPhase('paying');
    try {
      const data = await api.lockAmount(order.orderId, applyRewards);

      // Fully paid with reward points — no gateway needed at all.
      if (data.success) {
        await refreshUser();
        setResult(data);
        setPhase('done');
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        order_id: data.razorpayOrderId,
        amount: data.amountPaise,
        currency: 'INR',
        name: 'PerkPay Test Merchant',
        description: 'Test payment for PerkPay',
        theme: { color: '#5B3FE0' },
        prefill: { email: user?.email || '', contact: '' },
        notes: { order_id: order.orderId, shop_id: order.shopId },
        handler: () => {
          // Razorpay confirms payment client-side here, but the webhook
          // is the real source of truth — poll our own status endpoint
          // until it flips, rather than trusting the client callback alone.
          setPhase('waiting');
          startPolling(order.orderId);
        },
        modal: { ondismiss: () => setPhase('review') },
      });
      rzp.on('payment.failed', () => {
        setError('Payment failed or was cancelled. Please try again.');
        setPhase('review');
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setPhase('review');
    }
  }

  function startPolling(orderId) {
    clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const data = await api.paymentStatus(orderId);
        if (['success', 'partial_paid', 'reward_paid'].includes(data.status)) {
          clearInterval(pollRef.current);
          await refreshUser();
          setResult(data);
          setPhase('done');
        } else if (data.status === 'failed' || data.status === 'expired') {
          clearInterval(pollRef.current);
          setError('Payment failed to confirm. If money was deducted, it will be refunded — contact the shop if it persists.');
          setPhase('error');
        } else if (attempts >= 20) {
          // ~40s of polling with no webhook — surface this rather than spin forever.
          clearInterval(pollRef.current);
          setError('Still waiting for confirmation from the payment provider. This can take a minute — check back in Profile > Transaction history shortly.');
          setPhase('error');
        }
      } catch (_) {}
    }, 2000);
  }

  if (phase === 'scanning') {
    return (
      <div className="page-container">
        <TopBar title="Scan to pay" />
        <div className="scroll-area" style={{ paddingTop: 0 }}>
          <div id={SCANNER_ID} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }} />
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 16 }}>
            Point your camera at the shopkeeper's QR code.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="page-container">
        <TopBar title="Scan to pay" />
        <div className="scroll-area" style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontSize: 40 }}>⚠</p>
          <p style={{ color: 'var(--danger)', marginTop: 12, fontWeight: 600 }}>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { setError(''); setPhase('scanning'); }}>
            Scan again
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="page-container">
        <TopBar title="Confirming payment" />
        <div className="scroll-area" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ width: 40, height: 40, margin: '0 auto', border: '3px solid var(--brand-light)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ marginTop: 18, color: 'var(--text-muted)' }}>Confirming your payment with the bank…</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="page-container">
        <TopBar title="Payment successful" />
        <div className="scroll-area" style={{ textAlign: 'center', paddingTop: 50 }}>
          <div style={successCircle}>✓</div>
          <h2 style={{ marginTop: 20 }}>Payment received!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>at {result?.shopName || order?.shopName}</p>

          <div className="card" style={{ padding: 18, marginTop: 22, textAlign: 'left' }}>
            <Row label="Points earned this visit" value={`+${formatPoints(result?.earnedPoints ?? 0)}`} highlight bold />
            <Row label={`Your ${result?.shopName || order?.shopName} balance`} value={`${formatPoints(result?.shopBalance ?? 0)} pts`} bold />
            <Row label="Total coins earned (lifetime)" value={formatPoints(user?.points_balance ?? 0)} />
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 14 }}>
            These points can only be redeemed at {result?.shopName || order?.shopName}.
          </p>

          <button className="btn btn-primary" style={{ marginTop: 22 }} onClick={() => { setResult(null); setPhase('scanning'); }}>
            Scan another
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // review / paying
  const previewRemaining = order ? (applyRewards ? order.amount - order.maxDiscount : order.amount) : 0;

  return (
    <div className="page-container">
      <TopBar title="Confirm payment" />
      <div className="scroll-area" style={{ paddingTop: 0 }}>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Paying to</p>
          <h2 style={{ marginTop: 4 }}>{order.shopName}</h2>
          <p style={{ fontSize: 32, fontWeight: 700, marginTop: 14 }}>₹{order.amount}</p>
        </div>

        {order.maxDiscount > 0 && (
          <div className="card" style={{ padding: 16, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14.5 }}>Use my points</p>
              <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>
                Save up to ₹{order.maxDiscount} · you have {formatPoints(order.customerPoints)} pts
              </p>
            </div>
            <input type="checkbox" checked={applyRewards} onChange={(e) => setApplyRewards(e.target.checked)} style={{ width: 22, height: 22 }} />
          </div>
        )}

        <div className="card" style={{ padding: 16, marginTop: 14 }}>
          <Row label="Bill amount" value={`₹${order.amount}`} />
          {applyRewards && <Row label="Reward discount" value={`− ₹${order.maxDiscount}`} highlight />}
          <Row label="Amount to pay" value={`₹${previewRemaining}`} bold />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} disabled={phase === 'paying'} onClick={handleContinue}>
          {phase === 'paying' ? 'Opening payment…' : previewRemaining === 0 ? 'Pay with points' : `Pay ₹${previewRemaining}`}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

function Row({ label, value, bold, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 600, color: highlight ? 'var(--success)' : 'var(--text)' }}>{value}</span>
    </div>
  );
}

const successCircle = {
  width: 72, height: 72, borderRadius: '50%', background: 'var(--success)', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto',
};
