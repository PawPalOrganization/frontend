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

async function mobilePut(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
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

const getClinicTitle = (appt) =>
  appt.clinic?.title ?? appt.clinicBranch?.clinic?.title ?? appt.branch?.clinic?.title ?? `Clinic #${appt.clinicId ?? '?'}`;

const getBranchTitle = (appt) =>
  appt.clinicBranch?.title ?? appt.branch?.title ?? null;

const getApptDate = (appt) =>
  appt.date ?? appt.appointmentDate ?? appt.scheduledAt ?? appt.startTime ?? appt.finishedAt;

export default function ReviewTester() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [userToken, setUserToken] = useState('');
  const [userName, setUserName] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  // per-appointment create-review form state: { [appointmentId]: { rating, comment, submitting, error } }
  const [createState, setCreateState] = useState({});
  // per-review edit state: { [reviewId]: { editing, rating, comment, submitting, error } }
  const [editState, setEditState] = useState({});

  const loadData = useCallback(async (token) => {
    setDataLoading(true);
    setDataError('');
    try {
      const [apptRes, reviewsRes] = await Promise.allSettled([
        mobileGet('/api/appointments?filter=past', token),
        mobileGet('/api/reviews?sort=latest&page=1&limit=50', token),
      ]);

      const rawAppts = apptRes.status === 'fulfilled' ? apptRes.value : null;
      const apptArr = rawAppts
        ? (Array.isArray(rawAppts) ? rawAppts : Array.isArray(rawAppts.data) ? rawAppts.data : Array.isArray(rawAppts.items) ? rawAppts.items : [])
        : [];
      const rawReviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value : null;
      const reviewsArr = rawReviews
        ? (Array.isArray(rawReviews) ? rawReviews : Array.isArray(rawReviews.data) ? rawReviews.data : [])
        : [];

      setAppointments(apptArr);
      setMyReviews(reviewsArr);

      if (apptRes.status === 'rejected') {
        setDataError(`Failed to load appointments: ${apptRes.reason?.message || 'Unknown error'}`);
      } else if (reviewsRes.status === 'rejected') {
        setDataError(`Failed to load reviews: ${reviewsRes.reason?.message || 'Unknown error'}`);
      }

      // Reset per-appointment create forms to a blank 5-star / empty-comment default
      const initCreate = {};
      for (const appt of apptArr) {
        initCreate[appt.id] = { rating: 5, comment: '', submitting: false, error: '' };
      }
      setCreateState(initCreate);
      setEditState({});
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
    setAppointments([]);
    setMyReviews([]);
    setCreateState({});
    setEditState({});
    setEmail('');
    setPassword('');
    setLoginError('');
  }

  function setCreateField(appointmentId, patch) {
    setCreateState((prev) => ({ ...prev, [appointmentId]: { ...(prev[appointmentId] ?? { rating: 5, comment: '' }), ...patch } }));
  }

  async function handleCreateReview(appointmentId) {
    const s = createState[appointmentId] ?? { rating: 5, comment: '' };
    setCreateField(appointmentId, { submitting: true, error: '' });
    try {
      await mobilePost('/api/reviews', { appointmentId, rating: s.rating, comment: s.comment || undefined }, userToken);
      await loadData(userToken);
    } catch (err) {
      setCreateField(appointmentId, { submitting: false, error: err.message || 'Failed to create review.' });
    }
  }

  function startEdit(review) {
    setEditState((prev) => ({
      ...prev,
      [review.id]: { editing: true, rating: review.rating, comment: review.comment || '', submitting: false, error: '' },
    }));
  }

  function cancelEdit(reviewId) {
    setEditState((prev) => ({ ...prev, [reviewId]: { ...(prev[reviewId] ?? {}), editing: false } }));
  }

  function setEditField(reviewId, patch) {
    setEditState((prev) => ({ ...prev, [reviewId]: { ...(prev[reviewId] ?? {}), ...patch } }));
  }

  async function handleUpdateReview(reviewId) {
    const s = editState[reviewId];
    if (!s) return;
    setEditField(reviewId, { submitting: true, error: '' });
    try {
      await mobilePut(`/api/reviews/${reviewId}`, { rating: s.rating, comment: s.comment || undefined }, userToken);
      await loadData(userToken);
    } catch (err) {
      setEditField(reviewId, { submitting: false, error: err.message || 'Failed to update review (edit window may have expired — 24h after the visit).' });
    }
  }

  function StarPicker({ value, onChange, disabled }) {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            style={{ background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', padding: 0, fontSize: '1.1rem', color: n <= value ? '#F39C12' : '#D1D5DB' }}
          >
            <i className={`bi ${n <= value ? 'bi-star-fill' : 'bi-star'}`} />
          </button>
        ))}
      </div>
    );
  }

  const reviewedAppointmentIds = new Set(myReviews.map((r) => r.appointmentId));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Review Tester</h1>
          <p className={styles.subtitle}>
            Simulate a mobile user creating and editing clinic reviews — for testing the review moderation cycle only.
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

          {/* ── Past appointments (create review) ── */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={sectionTitle}><i className="bi bi-calendar-check" /> Past Appointments ({appointments.length})</p>
              <button type="button" style={linkBtn} onClick={() => loadData(userToken)}>
                <i className="bi bi-arrow-clockwise" /> Refresh
              </button>
            </div>

            {!dataLoading && appointments.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                No past appointments found for this user. A finished appointment is required before a review can be
                created — finish one via the clinic portal first.
              </p>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
              {appointments.map((appt) => {
                const s = createState[appt.id] ?? { rating: 5, comment: '', submitting: false, error: '' };
                const alreadyReviewed = !!appt.reviewId || reviewedAppointmentIds.has(appt.id);
                const canReview = appt.canReview === true && !alreadyReviewed;
                return (
                  <div key={appt.id} style={requestCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                          <i className="bi bi-hospital" style={{ marginRight: 6 }} />
                          {getClinicTitle(appt)}{getBranchTitle(appt) ? ` — ${getBranchTitle(appt)}` : ''}
                        </p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                          Appointment #{appt.id} · {getApptDate(appt) ? new Date(getApptDate(appt)).toLocaleString() : 'no date'} · status: {appt.status ?? 'unknown'}
                        </p>
                      </div>
                      {alreadyReviewed ? (
                        <span style={{ ...pendingBadge, background: '#d1fae5', color: '#065f46' }}>Reviewed</span>
                      ) : appt.canReview === true ? (
                        <span style={pendingBadge}>Can review</span>
                      ) : (
                        <span style={{ ...pendingBadge, background: '#f3f4f6', color: '#6b7280' }}>Not eligible</span>
                      )}
                    </div>

                    {canReview && (
                      <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.5rem' }}>
                        <StarPicker value={s.rating} onChange={(n) => setCreateField(appt.id, { rating: n })} disabled={s.submitting} />
                        <textarea
                          style={{ ...input, minHeight: 60, resize: 'vertical' }}
                          placeholder="Comment (optional)"
                          value={s.comment}
                          onChange={(e) => setCreateField(appt.id, { comment: e.target.value })}
                          disabled={s.submitting}
                        />
                        {s.error && <div className="alert alert-danger py-1" style={{ fontSize: '0.8rem', margin: 0 }}>{s.error}</div>}
                        <div>
                          <Button variant="primary" size="small" icon="bi-send" onClick={() => handleCreateReview(appt.id)} loading={s.submitting}>
                            Submit Review
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── My reviews (edit) ── */}
          <div style={{ ...card, marginTop: '1.25rem' }}>
            <p style={sectionTitle}><i className="bi bi-star" /> My Reviews ({myReviews.length})</p>

            {!dataLoading && myReviews.length === 0 && (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                No reviews yet — submit one above, or run through the admin Reviews tab to confirm it shows up there.
              </p>
            )}

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {myReviews.map((review) => {
                const e = editState[review.id];
                const isEditing = e?.editing;
                return (
                  <div key={review.id} style={requestCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                          <i className="bi bi-hospital" style={{ marginRight: 6 }} />
                          {review.clinic?.title ?? `Clinic #${review.clinicId ?? '?'}`}
                          {review.clinicBranch?.title ? ` — ${review.clinicBranch.title}` : ''}
                        </p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
                          Review #{review.id} · appointment #{review.appointmentId} · {review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                      {!isEditing && (
                        <button type="button" style={linkBtn} onClick={() => startEdit(review)}>
                          <i className="bi bi-pencil" /> Edit
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.5rem' }}>
                        <StarPicker value={e.rating} onChange={(n) => setEditField(review.id, { rating: n })} disabled={e.submitting} />
                        <textarea
                          style={{ ...input, minHeight: 60, resize: 'vertical' }}
                          value={e.comment}
                          onChange={(ev) => setEditField(review.id, { comment: ev.target.value })}
                          disabled={e.submitting}
                        />
                        {e.error && <div className="alert alert-danger py-1" style={{ fontSize: '0.8rem', margin: 0 }}>{e.error}</div>}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="primary" size="small" icon="bi-check-lg" onClick={() => handleUpdateReview(review.id)} loading={e.submitting}>
                            Save
                          </Button>
                          <Button variant="outline" size="small" onClick={() => cancelEdit(review.id)} disabled={e.submitting}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.4rem' }}>
                        <StarPicker value={review.rating} onChange={() => {}} disabled />
                        {review.comment && <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#374151' }}>{review.comment}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Inline styles (no extra scss needed — matches DataShareTester's convention) ──

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
  fontFamily: 'inherit',
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
