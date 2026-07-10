import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { api } from '../../api';

export default function AdminShell() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('shops'); // shops | shopkeepers | payouts

  return (
    <div className="page-container" style={{ maxWidth: 560 }}>
      <header style={{ padding: '20px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Admin</p>
          <h2 style={{ fontSize: 19 }}>{user?.name}</h2>
        </div>
        <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }} onClick={logout}>Log out</button>
      </header>

      <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px' }}>
        <TabBtn active={tab === 'shops'} onClick={() => setTab('shops')}>Shops</TabBtn>
        <TabBtn active={tab === 'shopkeepers'} onClick={() => setTab('shopkeepers')}>Shopkeepers</TabBtn>
        <TabBtn active={tab === 'payouts'} onClick={() => setTab('payouts')}>Payouts</TabBtn>
      </div>

      <div className="scroll-area" style={{ paddingTop: 0 }}>
        {tab === 'shops' && <ShopsPanel />}
        {tab === 'shopkeepers' && <ShopkeepersPanel />}
        {tab === 'payouts' && <PayoutsPanel />}
      </div>
    </div>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 600, fontSize: 13.5,
        background: active ? 'var(--brand)' : 'var(--bg-subtle)',
        color: active ? '#fff' : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------
function ShopsPanel() {
  const [shops, setShops] = useState([]);
  const [shopkeepers, setShopkeepers] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '', category: 'cafe', earn_points_per_100: '10', redeem_points_per_rupee: '10', owner_id: '', upi_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [s, k] = await Promise.all([api.listShops(), api.listShopkeepers()]);
    setShops(s.shops);
    setShopkeepers(k.shopkeepers);
  }

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function useMyLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      update('lat', pos.coords.latitude.toFixed(6));
      update('lng', pos.coords.longitude.toFixed(6));
    });
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createShop({
        name: form.name,
        address: form.address,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        category: form.category,
        earn_points_per_100: parseInt(form.earn_points_per_100, 10),
        redeem_points_per_rupee: parseInt(form.redeem_points_per_rupee, 10),
        owner_id: form.owner_id || null,
        upi_id: form.upi_id,
      });
      setForm({ name: '', address: '', lat: '', lng: '', category: 'cafe', earn_points_per_100: '10', redeem_points_per_rupee: '10', owner_id: '', upi_id: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="card" style={{ padding: 18 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Register a new shop</p>

        <label className="label">Shop name</label>
        <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} style={{ marginBottom: 12 }} />

        <label className="label">Address</label>
        <input className="input" required value={form.address} onChange={(e) => update('address', e.target.value)} style={{ marginBottom: 12 }} />

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Latitude</label>
            <input className="input" required type="number" step="any" value={form.lat} onChange={(e) => update('lat', e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Longitude</label>
            <input className="input" required type="number" step="any" value={form.lng} onChange={(e) => update('lng', e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn btn-secondary" style={{ marginBottom: 12, fontSize: 12.5, padding: '8px 12px' }} onClick={useMyLocation}>
          Use my current location
        </button>

        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={(e) => update('category', e.target.value)} style={{ marginBottom: 12 }}>
          <option value="cafe">Cafe</option>
          <option value="restaurant">Restaurant</option>
          <option value="salon">Salon</option>
          <option value="other">Other</option>
        </select>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Earn pts / ₹100</label>
            <input className="input" required type="number" value={form.earn_points_per_100} onChange={(e) => update('earn_points_per_100', e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label">Pts to redeem ₹1</label>
            <input className="input" required type="number" value={form.redeem_points_per_rupee} onChange={(e) => update('redeem_points_per_rupee', e.target.value)} />
          </div>
        </div>

        <label className="label">Shopkeeper's UPI ID <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional, for reference)</span></label>
        <input className="input" placeholder="e.g. shopname@okhdfcbank"
          value={form.upi_id} onChange={(e) => update('upi_id', e.target.value)} style={{ marginBottom: 4 }} />
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 12 }}>
          Payments are collected via Razorpay, not sent directly to this VPA — this is just on file for reference/payouts.
        </p>

        <label className="label">Assign shopkeeper (owner)</label>
        <select className="input" value={form.owner_id} onChange={(e) => update('owner_id', e.target.value)} style={{ marginBottom: 6 }}>
          <option value="">— None yet —</option>
          {shopkeepers.map((sk) => (
            <option key={sk.id} value={sk.id}>{sk.name} ({sk.email})</option>
          ))}
        </select>

        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={saving}>
          {saving ? 'Creating…' : 'Create shop'}
        </button>
      </form>

      <h3 style={{ fontSize: 15, marginTop: 24, marginBottom: 10 }}>All shops ({shops.length})</h3>
      {shops.map((s) => (
        <ShopCard key={s.id} shop={s} onChanged={load} />
      ))}
    </>
  );
}

function ShopCard({ shop: s, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [routeForm, setRouteForm] = useState({
    legalBusinessName: '', businessType: 'individual', email: '', phone: '',
    contactName: '', pan: '', addressLine: '', city: '', state: '', postalCode: '',
    category: 'food', subcategory: 'restaurant',
  });
  const [routeError, setRouteError] = useState('');
  const [routeSaving, setRouteSaving] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  function updateRoute(field, value) { setRouteForm((f) => ({ ...f, [field]: value })); }

  async function submitRoute(e) {
    e.preventDefault();
    setRouteError('');
    setRouteSaving(true);
    try {
      await api.onboardShopToRoute(s.id, routeForm);
      alert('Route account created. Razorpay will email the shopkeeper a link to accept terms before payouts can start.');
      setExpanded(false);
      onChanged();
    } catch (err) {
      setRouteError(err.message);
    } finally {
      setRouteSaving(false);
    }
  }

  async function checkStatus() {
    setCheckingStatus(true);
    try {
      const data = await api.routeStatus(s.id);
      alert(`Route account status: ${data.status}`);
      onChanged();
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingStatus(false);
    }
  }

  const routeBadge = {
    not_created: { label: 'Pooled account (no Route)', color: 'var(--text-faint)' },
    created: { label: 'Route: pending activation', color: 'var(--warning)' },
    activated: { label: 'Route: active — direct payouts', color: 'var(--success)' },
    needs_clarification: { label: 'Route: needs info', color: 'var(--danger)' },
  }[s.razorpay_account_status || 'not_created'];

  return (
    <div className="card" style={{ padding: 14, marginBottom: 8 }}>
      <p style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</p>
      <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{s.address}</p>
      {s.upi_id && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>UPI: {s.upi_id}</p>}
      <p style={{ fontSize: 12, color: 'var(--brand)', marginTop: 4, fontWeight: 600 }}>
        {s.owner_id ? 'Owner assigned' : 'No shopkeeper assigned yet'}
      </p>
      <p style={{ fontSize: 12, color: routeBadge.color, marginTop: 4, fontWeight: 600 }}>
        {routeBadge.label}
      </p>

      {!s.razorpay_account_id && (
        <button className="btn btn-secondary" style={{ marginTop: 10, fontSize: 12.5, padding: '7px 12px' }} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Cancel' : 'Set up direct payouts (Route)'}
        </button>
      )}
      {s.razorpay_account_id && s.razorpay_account_status !== 'activated' && (
        <button className="btn btn-ghost" style={{ marginTop: 10, fontSize: 12.5, padding: '7px 12px' }} onClick={checkStatus} disabled={checkingStatus}>
          {checkingStatus ? 'Checking…' : 'Check activation status'}
        </button>
      )}

      {expanded && (
        <form onSubmit={submitRoute} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10 }}>
            This creates a Razorpay linked account for {s.name}. The shopkeeper will get an email from Razorpay to accept terms before payouts activate.
          </p>
          <Field label="Legal business name" value={routeForm.legalBusinessName} onChange={(v) => updateRoute('legalBusinessName', v)} />
          <Field label="Contact person name" value={routeForm.contactName} onChange={(v) => updateRoute('contactName', v)} />
          <Field label="Contact email" value={routeForm.email} onChange={(v) => updateRoute('email', v)} type="email" />
          <Field label="Contact phone" value={routeForm.phone} onChange={(v) => updateRoute('phone', v)} />
          <Field label="PAN" value={routeForm.pan} onChange={(v) => updateRoute('pan', v)} />
          <Field label="Address line" value={routeForm.addressLine} onChange={(v) => updateRoute('addressLine', v)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="City" value={routeForm.city} onChange={(v) => updateRoute('city', v)} />
            <Field label="State" value={routeForm.state} onChange={(v) => updateRoute('state', v)} />
          </div>
          <Field label="Postal code" value={routeForm.postalCode} onChange={(v) => updateRoute('postalCode', v)} />
          <label className="label">Business type</label>
          <select className="input" value={routeForm.businessType} onChange={(e) => updateRoute('businessType', e.target.value)} style={{ marginBottom: 12 }}>
            <option value="individual">Individual</option>
            <option value="proprietorship">Proprietorship</option>
            <option value="partnership">Partnership</option>
            <option value="private_limited">Private Limited</option>
          </select>
          {routeError && <p className="error-text">{routeError}</p>}
          <button className="btn btn-primary btn-block" disabled={routeSaving}>
            {routeSaving ? 'Creating account…' : 'Create Route account'}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ flex: 1 }}>
      <label className="label">{label}</label>
      <input className="input" required type={type} value={value} onChange={(e) => onChange(e.target.value)} style={{ marginBottom: 12 }} />
    </div>
  );
}

// ---------------------------------------------------------
function ShopkeepersPanel() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    const { shopkeepers } = await api.listShopkeepers();
    setList(shopkeepers);
  }

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createShopkeeper(form);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="card" style={{ padding: 18 }}>
        <p style={{ fontWeight: 700, marginBottom: 12 }}>Create shopkeeper login</p>
        <label className="label">Name</label>
        <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} style={{ marginBottom: 12 }} />
        <label className="label">Email</label>
        <input className="input" required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} style={{ marginBottom: 12 }} />
        <label className="label">Temporary password</label>
        <input className="input" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} style={{ marginBottom: 12 }} />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Creating…' : 'Create account'}</button>
      </form>

      <h3 style={{ fontSize: 15, marginTop: 24, marginBottom: 10 }}>Shopkeeper accounts ({list.length})</h3>
      {list.map((sk) => (
        <div key={sk.id} className="card" style={{ padding: 14, marginBottom: 8 }}>
          <p style={{ fontWeight: 600, fontSize: 14.5 }}>{sk.name}</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{sk.email}</p>
        </div>
      ))}
    </>
  );
}

// ---------------------------------------------------------
function PayoutsPanel() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const { payouts } = await api.listPayouts();
      setPayouts(payouts);
    } finally {
      setLoading(false);
    }
  }

  function startSettle(p) {
    setSettlingId(p.shopId);
    setAmount(String(p.pending));
    setNote('');
    setError('');
  }

  async function confirmSettle(shopId) {
    setError('');
    try {
      await api.settlePayout(shopId, { amount: parseFloat(amount), note });
      setSettlingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p style={{ color: 'var(--text-faint)', fontSize: 13.5 }}>Loading…</p>;

  return (
    <>
      <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 14 }}>
        Since payments collect into your main Razorpay account, transfer
        each shop's earned amount to their UPI ID yourself (outside the
        app), then log it here. Shops with an activated Route account
        settle automatically and won't appear in this list.
      </p>

      {payouts.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--text-faint)' }}>No pending payouts.</p>
      ) : payouts.map((p) => (
        <div key={p.shopId} className="card" style={{ padding: 14, marginBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: 14.5 }}>{p.shopName}</p>
          {p.upiId && <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Pay to: {p.upiId}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <div>
              <p style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>COLLECTED</p>
              <p style={{ fontWeight: 600 }}>₹{p.totalCollected}</p>
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>ALREADY PAID</p>
              <p style={{ fontWeight: 600 }}>₹{p.totalSettled}</p>
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>PENDING</p>
              <p style={{ fontWeight: 700, color: p.pending > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{p.pending}</p>
            </div>
          </div>

          {settlingId === p.shopId ? (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <label className="label">Amount transferred (₹)</label>
              <input className="input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ marginBottom: 10 }} />
              <label className="label">Note (optional — e.g. UPI ref number)</label>
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} style={{ marginBottom: 10 }} />
              {error && <p className="error-text">{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => confirmSettle(p.shopId)}>Confirm payout logged</button>
                <button className="btn btn-ghost" onClick={() => setSettlingId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            p.pending > 0 && (
              <button className="btn btn-secondary" style={{ marginTop: 12, width: '100%' }} onClick={() => startSettle(p)}>
                Mark payout as sent
              </button>
            )
          )}
        </div>
      ))}
    </>
  );
}
