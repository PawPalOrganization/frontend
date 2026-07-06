import { useState, useEffect, useCallback } from 'react';
import Button from '../../components/common/Button/Button';
import styles from './ClinicStaffRoles.module.scss';

const BASE = '';

async function mobilePost(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

async function mobileGet(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

export default function DataShareTester() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [userToken, setUserToken] = useState('');
  const [userName, setUserName] = useState('');

  const [pets, setPets] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedShares, setApprovedShares] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // per-request state: { [requestId]: { selectedPetIds: Set, acting: bool, error: string } }
  const [requestState, setRequestState] = useState({});

  const loadData = useCallback(async (token) => {
    setDataLoading(true);
    setDataError('');
    try {
      // Fetch independently — one failure shouldn't block the rest
      const [petsRes, pendingRes, approvedRes] = await Promise.allSettled([
        mobileGet('/api/pets', token),
        mobileGet('/api/clinic-share-requests', token),
        mobileGet('/api/clinic-share-requests/approved', token),
      ]);

      const rawPets = petsRes.status === 'fulfilled' ? petsRes.value : null;
      const petsArr = rawPets
        ? (Array.isArray(rawPets) ? rawPets : Array.isArray(rawPets.data) ? rawPets.data : Array.isArray(rawPets.items) ? rawPets.items : [])
        : [];
      if (import.meta.env.DEV) console.log('[ShareTester] pets raw:', rawPets, '→', petsArr);
      const pendingArr = pendingRes.status === 'fulfilled'
        ? (pendingRes.value.data ?? pendingRes.value ?? [])
        : [];
      const approvedArr = approvedRes.status === 'fulfilled'
        ? (approvedRes.value.data ?? approvedRes.value ?? [])
        : [];

      setPets(petsArr);
      setPendingRequests(pendingArr);
      setApprovedShares(approvedArr);

      // Surface the pending-requests error (most important); ignore approved 500
      if (pendingRes.status === 'rejected') {
        setDataError(`Failed to load pending requests: ${pendingRes.reason?.message || 'Unknown error'}`);
      }

      // Pre-select all pets per request for convenience
      const init = {};
      for (const req of pendingArr) {
        init[req.id] = { selectedPetIds: new Set(petsArr.map((p) => p.id)), acting: false, error: '' };
      }
      setRequestState(init);
    } catch (err) {
      setDataError(err.message || 'Failed to load data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userToken) loadData(userToken);
  }, [userToken, loadData]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await mobilePost('/api/auth/login', { email, password, deviceToken: 'admin-test' });
      const token = res.data?.token ?? res.token;
      const user = res.data?.user ?? res.user;
      if (!token) throw new Error('No token in response.');
      setUserToken(token);
      setUserName(user?.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : email);
    } catch (err) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    setUserToken('');
    setUserName('');
    setPets([]);
    setPendingRequests([]);
    setApprovedShares([]);
    setRequestState({});
    setEmail('');
    setPassword('');
    setLoginError('');
  }

  function togglePet(requestId, petId) {
    setRequestState((prev) => {
      const s = prev[requestId] ?? { selectedPetIds: new Set(), acting: false, error: '' };
      const next = new Set(s.selectedPetIds);
      next.has(petId) ? next.delete(petId) : next.add(petId);
      return { ...prev, [requestId]: { ...s, selectedPetIds: next } };
    });
  }

  function setReqActing(requestId, acting) {
    setRequestState((prev) => ({ ...prev, [requestId]: { ...(prev[requestId] ?? {}), acting } }));
  }

  function setReqError(requestId, error) {
    setRequestState((prev) => ({ ...prev, [requestId]: { ...(prev[requestId] ?? {}), acting: false, error } }));
  }

  async function handleApprove(requestId) {
    const s = requestState[requestId];
    if (!s || s.selectedPetIds.size === 0) {
      setReqError(requestId, 'Select at least one pet to share.');
      return;
    }
    setReqActing(requestId, true);
    try {
      await mobilePost(`/api/clinic-share-requests/${requestId}/approve`, { petIds: Array.from(s.selectedPetIds) }, userToken);
      await loadData(userToken);
    } catch (err) {
      setReqError(requestId, err.message || 'Approve failed.');
    }
  }

  async function handleDeny(requestId) {
    setReqActing(requestId, true);
    try {
      await mobilePost(`/api/clinic-share-requests/${requestId}/deny`, null, userToken);
      await loadData(userToken);
    } catch (err) {
      setReqError(requestId, err.message || 'Deny failed.');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Data Share Tester</h1>
          <p className={styles.subtitle}>
            Simulate the mobile user approving or denying clinic data-share requests — for testing only.
          </p>
        </div>
        {userToken && (
          <Button variant="outline" icon="bi-box-arrow-right" onClick={handleLogout}>
            Sign out ({userName})
          </Button>
        )}
      </div>

      {/* ── Login ── */}
      {!userToken && (
        <div style={card}>
          <p style={sectionTitle}><i className="bi bi-person-circle" /> Log in as a PawPal user</p>
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
            {loginError && <div className="alert alert-danger py-2">{loginError}</div>}
            <div>
              <label style={label}>Email or Phone</label>
              <input style={input} type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com or 01234567890" required />
            </div>
            <div>
              <label style={label}>Password</label>
              <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" variant="primary" icon="bi-box-arrow-in-right" loading={loginLoading}>
              Log in as User
            </Button>
          </form>
        </div>
      )}

      {/* ── Logged in ── */}
      {userToken && (
        <>
          {dataLoading && (
            <div style={{ color: '#6b7280', fontSize: '0.875rem', margin: '1rem 0' }}>
              <i className="bi bi-hourglass-split" /> Loading data…
            </div>
          )}

          {dataError && (
            <div className="alert alert-danger py-2" style={{ marginBottom: '1rem' }}>
              <i className="bi bi-exclamation-circle-fill" /> {dataError}
              <button type="button" style={linkBtn} onClick={() => loadData(userToken)}>Retry</button>
            </div>
          )}

          {/* Pets owned by user */}
          {!dataLoading && pets.length === 0 && (
            <div className="alert alert-warning py-2" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              <i className="bi bi-exclamation-triangle" /> This user has no pets. Add pets via the mobile app before approving share requests.
            </div>
          )}

          {/* ── Pending requests ── */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={sectionTitle}><i className="bi bi-hourglass" /> Pending Share Requests ({pendingRequests.length})</p>
              <button type="button" style={linkBtn} onClick={() => loadData(userToken)}>
                <i className="bi bi-arrow-clockwise" /> Refresh
              </button>
            </div>

            {!dataLoading && pendingRequests.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                No pending requests. Go to the clinic portal, search a phone number, and click "Request Access" first.
              </p>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
              {pendingRequests.map((req) => {
                const s = requestState[req.id] ?? { selectedPetIds: new Set(), acting: false, error: '' };
                const clinic = req.clinic ?? req.clinicBranch?.clinic ?? {};
                return (
                  <div key={req.id} style={requestCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                          <i className="bi bi-hospital" style={{ marginRight: 6 }} />
                          {clinic.title ?? req.clinicName ?? `Clinic #${req.clinicId ?? '?'}`}
                        </p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                          Request ID: {req.id} · {req.createdAt ? new Date(req.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                      <span style={pendingBadge}>Pending</span>
                    </div>

                    {/* Pet picker */}
                    {pets.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                          Select pets to share:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {pets.map((pet) => {
                            const checked = s.selectedPetIds.has(pet.id);
                            return (
                              <button
                                key={pet.id}
                                type="button"
                                onClick={() => togglePet(req.id, pet.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                                  padding: '0.35rem 0.75rem',
                                  border: checked ? '2px solid #0d9aff' : '1.5px solid #d1d5db',
                                  borderRadius: '2rem',
                                  background: checked ? 'rgba(13,154,255,0.08)' : '#fff',
                                  color: checked ? '#0d9aff' : '#374151',
                                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: checked ? 600 : 400,
                                }}
                              >
                                {checked && <i className="bi bi-check2" />}
                                {pet.imageUrl
                                  ? <img src={pet.imageUrl} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                                  : <i className="bi bi-heart-fill" style={{ fontSize: '0.7rem' }} />}
                                {pet.name}
                              </button>
                            );
                          })}
                        </div>
                        {s.selectedPetIds.size === 0 && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                            Select at least one pet to approve.
                          </p>
                        )}
                      </div>
                    )}

                    {s.error && (
                      <div className="alert alert-danger py-1" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                        {s.error}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant="primary"
                        size="small"
                        icon="bi-check-lg"
                        onClick={() => handleApprove(req.id)}
                        loading={s.acting}
                        disabled={s.acting || pets.length === 0}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        icon="bi-x-lg"
                        onClick={() => handleDeny(req.id)}
                        loading={s.acting}
                        disabled={s.acting}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Approved shares ── */}
          {approvedShares.length > 0 && (
            <div style={{ ...card, marginTop: '1.25rem' }}>
              <p style={sectionTitle}><i className="bi bi-check-circle text-success" /> Approved Shares ({approvedShares.length})</p>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {approvedShares.map((share) => {
                  const clinic = share.clinic ?? share.clinicBranch?.clinic ?? {};
                  const sharedPets = share.pets ?? share.sharedPets ?? [];
                  return (
                    <div key={share.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.875rem', border: '1px solid #d1fae5', borderRadius: '0.5rem', background: '#f0fdf4' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#065f46' }}>
                          <i className="bi bi-hospital" style={{ marginRight: 6 }} />
                          {clinic.title ?? `Clinic #${share.clinicId ?? '?'}`}
                        </span>
                        {sharedPets.length > 0 && (
                          <span style={{ marginLeft: 8, fontSize: '0.78rem', color: '#6b7280' }}>
                            · {sharedPets.map((p) => p.name).join(', ')}
                          </span>
                        )}
                      </div>
                      <span style={{ ...pendingBadge, background: '#d1fae5', color: '#065f46' }}>Approved</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Inline styles (no extra scss needed) ──────────────────────────────────────

const card = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.875rem',
  padding: '1.25rem',
};

const requestCard = {
  background: '#fafbff',
  border: '1px solid #e4e7ec',
  borderRadius: '0.75rem',
  padding: '1rem',
};

const sectionTitle = {
  margin: '0 0 0.875rem',
  fontWeight: 600,
  fontSize: '0.95rem',
  color: '#111827',
};

const label = {
  display: 'block',
  marginBottom: '0.3rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#374151',
};

const input = {
  display: 'block',
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1.5px solid #d1d5db',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#0d9aff',
  cursor: 'pointer',
  fontSize: '0.8rem',
  padding: '0 0.25rem',
  textDecoration: 'underline',
};

const pendingBadge = {
  display: 'inline-block',
  padding: '0.2rem 0.6rem',
  borderRadius: '2rem',
  fontSize: '0.72rem',
  fontWeight: 600,
  background: '#fef3c7',
  color: '#92400e',
};
