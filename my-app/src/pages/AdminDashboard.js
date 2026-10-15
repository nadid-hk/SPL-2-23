import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";
import {
  FiFileText, FiUserCheck, FiHome, FiCheck, FiX, FiTrash2,
  FiChevronDown, FiSearch, FiAlertCircle, FiInbox, FiUser,
  FiPhone, FiCalendar, FiCreditCard, FiUsers,
} from "react-icons/fi";
import "./AdminDashboard.css"; // keep AFTER App.css / Darkmode.css

const fmtDate = d => new Date(d).toLocaleDateString();

export default function AdminDashboard({ go, user }) {
  const [activeTab, setActiveTab]       = useState("overview");

  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingRegs,  setPendingRegs]  = useState([]);
  const [listings, setListings]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [expiredRankUsers, setExpiredRankUsers] = useState([]);

  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingRegs, setLoadingRegs]   = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingExpired, setLoadingExpired] = useState(true);
  const [loadError, setLoadError]       = useState("");
  const [userSearch, setUserSearch]     = useState("");

  const [expandedPost, setExpandedPost] = useState(null);
  const [expandedReg,  setExpandedReg]  = useState(null);

  // Temporary placeholder admin ID until real auth wiring is in place.
  const adminId = user?.id || "65f1abc234def56789012345";

  const fetchPendingPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pending/posts`);
      const result = await res.json();
      if (res.ok && result.success) setPendingPosts(result.data || []);
      else throw new Error(result.message || "Failed to load pending posts");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const fetchPendingRegs = useCallback(async () => {
    setLoadingRegs(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pending/registrations`);
      const result = await res.json();
      if (res.ok && result.success) setPendingRegs(result.data || []);
      else throw new Error(result.message || "Failed to load pending registrations");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingRegs(false);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const res = await fetch(`${API_BASE}/admin/listings`);
      const result = await res.json();
      if (res.ok && result.success) setListings(result.data || []);
      else throw new Error(result.message || "Failed to load listings");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingListings(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      const result = await res.json();
      if (res.ok && result.success) setUsers(result.data || []);
      else throw new Error(result.message || "Failed to load users");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchExpiredRankUsers = useCallback(async () => {
    setLoadingExpired(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/expired-rank`);
      const result = await res.json();
      if (res.ok && result.success) setExpiredRankUsers(result.data || []);
      else throw new Error(result.message || "Failed to load expired rank accounts");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingExpired(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingPosts();
    fetchPendingRegs();
    fetchListings();
    fetchUsers();
    fetchExpiredRankUsers();
  }, [fetchPendingPosts, fetchPendingRegs, fetchListings, fetchUsers, fetchExpiredRankUsers]);

  const reviewPost = async (id, decision, reason) => {
    try {
      const res = await fetch(`${API_BASE}/admin/posts/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason, adminId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Review failed");


      setPendingPosts(prev => prev.filter(p => p._id !== id));
      setExpandedPost(null);
      if (decision === "approved") fetchListings();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  const approvePost = id => reviewPost(id, "approved");
  const rejectPost = id => {
    const reason = prompt("Reason for rejection (mandatory to inform user):");
    if (reason === null) return; // cancel click protection
    reviewPost(id, "rejected", reason);
  };

  const reviewRegistration = async (id, decision, reason) => {
    try {
      const res = await fetch(`${API_BASE}/admin/registrations/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason, adminId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Review failed");

      const reg = pendingRegs.find(r => r._id === id);
      alert(decision === "approved"
        ? `Registration confirmed!\n${reg?.ownerFullName || "The owner"} can now log in as a Home Owner.`
        : `Registration rejected.${reason ? `\nReason: ${reason}` : ""}`
      );

      setPendingRegs(prev => prev.filter(r => r._id !== id));
      setExpandedReg(null);
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  const approveReg = id => reviewRegistration(id, "approved");
  const rejectReg = id => {
    const reason = prompt("Reason for rejection (optional):");
    reviewRegistration(id, "rejected", reason);
  };

  // Deletes a User account. `isExpiredRank` accounts don't require typing a
  // reason (the passed deadline is reason enough), everything else does —
  // this mirrors the guard enforced server-side in admin.service.js.
  const deleteUser = async (targetUser, isExpiredRank = false) => {
    let reason = null;
    if (!isExpiredRank) {
      reason = prompt(`Reason for removing ${targetUser.name}'s account (required):`);
      if (!reason || !reason.trim()) {
        if (reason !== null) alert("A reason is required to delete this account.");
        return;
      }
    } else if (!window.confirm(`Remove ${targetUser.name}'s expired rank-based account?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/users/${targetUser._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, adminId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Deletion failed");


      setUsers(prev => prev.filter(u => u._id !== targetUser._id));
      setExpiredRankUsers(prev => prev.filter(u => u._id !== targetUser._id));
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (u.name || "").toLowerCase().includes(q) ||
           (u.email || "").toLowerCase().includes(q) ||
           (u.phone || "").toLowerCase().includes(q);
  });

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "posts",    label: "Posts",         count: pendingPosts.length },
    { id: "regs",     label: "Registrations", count: pendingRegs.length },
    { id: "listings", label: "All listings" },
    { id: "users",    label: "Users",         count: expiredRankUsers.length, hint: "expired accounts" },
    { id: "notifications", label: "Notifications" },
  ];

  const stats = [
    { label: "Pending posts",         value: pendingPosts.length, tone: "warn",  icon: <FiFileText />,  tab: "posts"    },
    { label: "Pending registrations", value: pendingRegs.length,  tone: "brand", icon: <FiUserCheck />, tab: "regs"     },
    { label: "Live listings",         value: listings.length,     tone: "ok",    icon: <FiHome />,      tab: "listings" },
  ];

  return (
    <div className="page adm">
      <Navbar
        page="adminDashboard"
        go={go}
        user={user}
      />
      <div className="dashboard-content">

        {/* ── ADMIN HERO ── */}
        <header className="adm-hero">
          <span className="adm-hero-tag">Admin control panel</span>
          <h1>Welcome back, Admin</h1>
          <p>Monitor the platform, approve listings and confirm new home owner accounts.</p>
        </header>

        {loadError && (
          <div className="adm-alert" role="alert">
            <FiAlertCircle />
            <span>{loadError}</span>
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div className="adm-stats">
          {stats.map(stat => (
            <button
              type="button"
              key={stat.label}
              className="adm-stat"
              onClick={() => setActiveTab(stat.tab)}
            >
              <span className={`adm-stat-icon ${stat.tone}`}>{stat.icon}</span>
              <span>
                <div className="adm-stat-value">{stat.value}</div>
                <div className="adm-stat-label">{stat.label}</div>
              </span>
            </button>
          ))}
        </div>

        {/* ── TABS ── */}
        <div className="adm-tabs" role="tablist">
          {tabs.map(tab => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              key={tab.id}
              className={`adm-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="adm-tab-count" title={tab.hint}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            <section className="adm-section">
              <SectionTitle>Quick actions</SectionTitle>
              <div className="adm-quick">
                <Btn variant="primary" size="lg" onClick={() => setActiveTab("posts")}>
                  <FiFileText /> Review {pendingPosts.length} pending post{pendingPosts.length !== 1 ? "s" : ""}
                </Btn>
                <Btn variant="ghost" size="lg" onClick={() => setActiveTab("regs")}>
                  <FiUserCheck /> Review {pendingRegs.length} registration{pendingRegs.length !== 1 ? "s" : ""}
                </Btn>
                <Btn variant="ghost" size="lg" onClick={() => setActiveTab("listings")}>
                  <FiHome /> Manage all listings
                </Btn>
              </div>
            </section>

            <section className="adm-section">
              <SectionTitle>Recent pending posts</SectionTitle>
              {loadingPosts ? (
                <Loading msg="Loading pending posts" />
              ) : pendingPosts.length === 0 ? (
                <EmptyState icon={<FiInbox />} msg="No pending posts" />
              ) : (
                pendingPosts.slice(0, 2).map(post => (
                  <PendingRow key={post._id}
                    title={post.registeredHouse?.housePropertyName || "Unnamed property"}
                    meta={[
                      { icon: <FiUser />,       text: post.ownerName },
                      { icon: <FiCreditCard />, text: `৳${post.monthlyRent.toLocaleString()}/mo` },
                      { icon: <FiCalendar />,   text: fmtDate(post.createdAt) },
                    ]}
                    onApprove={() => approvePost(post._id)}
                    onReject={() => rejectPost(post._id)}
                  />
                ))
              )}
            </section>

            <section className="adm-section">
              <SectionTitle>Recent pending registrations</SectionTitle>
              {loadingRegs ? (
                <Loading msg="Loading pending registrations" />
              ) : pendingRegs.length === 0 ? (
                <EmptyState icon={<FiInbox />} msg="No pending registrations" />
              ) : (
                pendingRegs.slice(0, 2).map(reg => (
                  <PendingRow key={reg._id}
                    title={reg.ownerFullName}
                    meta={[
                      { icon: <FiHome />,     text: reg.housePropertyName },
                      { icon: <FiPhone />,    text: reg.phoneNumber },
                      { icon: <FiCalendar />, text: fmtDate(reg.createdAt) },
                    ]}
                    onApprove={() => approveReg(reg._id)}
                    onReject={() => rejectReg(reg._id)}
                    approveLabel="Confirm"
                  />
                ))
              )}
            </section>
          </div>
        )}

        {/* ── PENDING POSTS ── */}
        {activeTab === "posts" && (
          <section className="adm-section">
            <SectionTitle>Pending post approvals</SectionTitle>
            {loadingPosts ? (
              <Loading msg="Loading pending posts" />
            ) : pendingPosts.length === 0 ? (
              <EmptyState icon={<FiCheck />} msg="All caught up" sub="There are no pending posts to review." />
            ) : (
              pendingPosts.map(post => (
                <Accordion
                  key={post._id}
                  open={expandedPost === post._id}
                  onToggle={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                  title={post.registeredHouse?.housePropertyName || "Unnamed property"}
                  meta={[
                    { icon: <FiUser />,       text: post.ownerName },
                    { icon: <FiCreditCard />, text: `৳${post.monthlyRent.toLocaleString()}/mo` },
                    { icon: <FiCalendar />,   text: fmtDate(post.createdAt) },
                  ]}
                >
                  <InfoRow label="Property"    value={post.registeredHouse?.housePropertyName} />
                  <InfoRow label="Owner"       value={post.ownerName} />
                  <InfoRow label="Phone"       value={post.contactPhone} />
                  <InfoRow label="Rent"        value={`৳${post.monthlyRent.toLocaleString()}/mo`} />
                  <InfoRow label="Address"     value={post.fullAddress} />
                  <InfoRow label="Gate closes" value={post.gateClosedTime} />
                  <InfoRow label="Submitted"   value={new Date(post.createdAt).toLocaleString()} />
                  {post.photos?.length > 0 && (
                    <div className="adm-photos">
                      {post.photos.map((p, i) => (
                        <img key={i} src={p.url} alt={`Listing photo ${i + 1}`} />
                      ))}
                    </div>
                  )}
                  <div className="adm-actions">
                    <Btn variant="approve" onClick={() => approvePost(post._id)}><FiCheck /> Approve post</Btn>
                    <Btn variant="reject"  onClick={() => rejectPost(post._id)}><FiX /> Reject</Btn>
                  </div>
                </Accordion>
              ))
            )}
          </section>
        )}

        {/* ── PENDING REGISTRATIONS ── */}
        {activeTab === "regs" && (
          <section className="adm-section">
            <SectionTitle>Pending home owner registrations</SectionTitle>
            {loadingRegs ? (
              <Loading msg="Loading pending registrations" />
            ) : pendingRegs.length === 0 ? (
              <EmptyState icon={<FiCheck />} msg="All caught up" sub="There are no pending registrations to review." />
            ) : (
              pendingRegs.map(reg => (
                <Accordion
                  key={reg._id}
                  open={expandedReg === reg._id}
                  onToggle={() => setExpandedReg(expandedReg === reg._id ? null : reg._id)}
                  title={reg.ownerFullName}
                  meta={[
                    { icon: <FiPhone />,    text: reg.phoneNumber },
                    { icon: <FiHome />,     text: reg.housePropertyName },
                    { icon: <FiCalendar />, text: fmtDate(reg.createdAt) },
                  ]}
                >
                  <InfoRow label="Owner name" value={reg.ownerFullName} />
                  <InfoRow label="Phone"      value={reg.phoneNumber} />
                  <InfoRow label="Property"   value={reg.housePropertyName} />
                  <InfoRow label="Address"    value={reg.houseAddress} />
                  <InfoRow label="Map pin"    value={reg.houseMap?.coordinates?.slice().reverse().join(", ")} />
                  <InfoRow label="Submitted"  value={new Date(reg.createdAt).toLocaleString()} />
                  <div className="adm-photos">
                    {reg.housePicture?.url && (
                      <img src={reg.housePicture.url} alt="House" />
                    )}
                    {reg.khatianCertificate?.url && (
                      <img src={reg.khatianCertificate.url} alt="Khatian certificate" />
                    )}
                  </div>
                  <div className="adm-actions">
                    <Btn variant="approve" onClick={() => approveReg(reg._id)}><FiCheck /> Confirm registration</Btn>
                    <Btn variant="reject"  onClick={() => rejectReg(reg._id)}><FiX /> Reject</Btn>
                  </div>
                </Accordion>
              ))
            )}
          </section>
        )}

        {/* ── ALL LISTINGS ── */}
        {activeTab === "listings" && (
          <section className="adm-section">
            <SectionTitle sub="These are all currently admin-approved listings.">
              All live listings
            </SectionTitle>
            {loadingListings ? (
              <Loading msg="Loading listings" />
            ) : listings.length === 0 ? (
              <EmptyState icon={<FiHome />} msg="No approved listings yet" />
            ) : (
              listings.map(listing => (
                <div key={listing._id} className="adm-row">
                  <div className="adm-row-main">
                    <span className="adm-row-title">
                      {listing.registeredHouse?.housePropertyName || "Unnamed property"}
                    </span>
                    <Meta items={[
                      { icon: <FiUser />,       text: listing.ownerName },
                      { icon: <FiCreditCard />, text: `৳${listing.monthlyRent.toLocaleString()}/mo` },
                    ]} />
                  </div>
                  <span className="adm-pill ok">Approved</span>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <div>
            <section className="adm-section">
              <SectionTitle sub="Rank-registered accounts can only edit their profile for 6 months after signup. Once that window passes they're listed here for cleanup.">
                Expired rank-based accounts
              </SectionTitle>
              {loadingExpired ? (
                <Loading msg="Checking for expired rank accounts" />
              ) : expiredRankUsers.length === 0 ? (
                <EmptyState icon={<FiCheck />} msg="No expired rank-based accounts" />
              ) : (
                expiredRankUsers.map(u => (
                  <div key={u._id} className="adm-row danger">
                    <div className="adm-row-main">
                      <span className="adm-row-title">{u.name}</span>
                      <Meta items={[
                        { text: `Rank: ${u.rank || "—"}` },
                        { icon: <FiCalendar />, text: `Deadline passed ${fmtDate(u.profileEditDeadline)}` },
                      ]} />
                    </div>
                    <div className="adm-row-actions">
                      <Btn variant="reject" onClick={() => deleteUser(u, true)}><FiTrash2 /> Remove account</Btn>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="adm-section">
              <SectionTitle>All users</SectionTitle>
              <label className="adm-search">
                <FiSearch />
                <input
                  type="text"
                  aria-label="Search users"
                  placeholder="Search by name, email or phone"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
              </label>
              {loadingUsers ? (
                <Loading msg="Loading users" />
              ) : filteredUsers.length === 0 ? (
                <EmptyState icon={<FiUsers />} msg="No matching users" />
              ) : (
                filteredUsers.map(u => (
                  <div key={u._id} className="adm-row">
                    <div className="adm-row-main">
                      <span className="adm-row-title">{u.name}</span>
                      <Meta items={[
                        { text: u.authMethod === "EmailUser" ? u.email : `Rank: ${u.rank || "—"}` },
                        u.phone && { icon: <FiPhone />, text: u.phone },
                        { icon: <FiCalendar />, text: `Joined ${fmtDate(u.createdAt)}` },
                      ]} />
                    </div>
                    <div className="adm-row-actions">
                      <Btn variant="reject" onClick={() => deleteUser(u, false)}><FiTrash2 /> Delete (misconduct)</Btn>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === "notifications" && <AdminNotifications users={users} />}

      </div>

      <footer className="footer">
        <h4>KHOJ Admin</h4>
        <p>Platform management for KHOJ — IUT student housing.</p>
        <p className="adm-footer-note">© 2026 KHOJ. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ── Small helper components ──
function SectionTitle({ children, sub }) {
  return (
    <div className="adm-section-head">
      <h2 className="adm-section-title">{children}</h2>
      {sub && <p className="adm-section-sub">{sub}</p>}
    </div>
  );
}

function Btn({ variant = "ghost", size, onClick, children }) {
  return (
    <button
      type="button"
      className={`adm-btn adm-btn-${variant}${size === "lg" ? " adm-btn-lg" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Meta({ items }) {
  const visible = items.filter(it => it && it.text);
  return (
    <span className="adm-meta">
      {visible.map((it, i) => (
        <span key={i} className="adm-meta-item">{it.icon}{it.text}</span>
      ))}
    </span>
  );
}

function PendingRow({ title, meta, onApprove, onReject, approveLabel = "Approve" }) {
  return (
    <div className="adm-row">
      <div className="adm-row-main">
        <span className="adm-row-title">{title}</span>
        <Meta items={meta} />
      </div>
      <div className="adm-row-actions">
        <Btn variant="approve" onClick={onApprove}><FiCheck /> {approveLabel}</Btn>
        <Btn variant="reject"  onClick={onReject}><FiX /> Reject</Btn>
      </div>
    </div>
  );
}

function Accordion({ open, onToggle, title, meta, children }) {
  return (
    <div className={`adm-acc${open ? " open" : ""}`}>
      <button type="button" className="adm-acc-head" onClick={onToggle} aria-expanded={open}>
        <span className="adm-row-main">
          <span className="adm-row-title">{title}</span>
          <Meta items={meta} />
        </span>
        <span className="adm-acc-toggle">
          <span>{open ? "Hide details" : "View details"}</span>
          <FiChevronDown className="adm-acc-chevron" />
        </span>
      </button>
      {open && <div className="adm-acc-body">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="adm-info-row">
      <span className="adm-info-label">{label}</span>
      <span className="adm-info-value">{value || "—"}</span>
    </div>
  );
}

function Loading({ msg }) {
  return (
    <div role="status" aria-label={msg} aria-busy="true">
      <div className="adm-skel" />
      <div className="adm-skel" />
    </div>
  );
}

function EmptyState({ icon, msg, sub }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-icon">{icon}</div>
      <div className="adm-empty-title">{msg}</div>
      {sub && <div style={{ fontSize: ".85rem", marginTop: ".25rem" }}>{sub}</div>}
    </div>
  );
}

// ── Notifications (admin): send + read-only history. No delete anywhere. ──
function AdminNotifications({ users }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({ to: "", title: "", message: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/admin/all`, { credentials: "include" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Could not load notifications");
      setItems(result.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    setError("");
    if (!form.to || !form.title.trim() || !form.message.trim()) {
      setError("Choose a recipient and fill in the title and message.");
      return;
    }
    setSending(true);
    try {
      const userIds = form.to === "all" ? users.map(u => u._id) : [form.to];
      const res = await fetch(`${API_BASE}/notifications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, title: form.title, message: form.message }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Send failed");
      setForm({ to: "", title: "", message: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const fieldStyle = { width: "100%", padding: ".6rem .8rem", borderRadius: 8, border: "1px solid var(--gray-mid)", background: "var(--white)", color: "var(--dark)", font: "inherit" };

  return (
    <div>
      <section className="adm-section">
        <SectionTitle sub="Appears in the user's bell. Users can mark it as read but cannot delete it.">
          Send notification
        </SectionTitle>
        <div style={{ display: "grid", gap: ".6rem", maxWidth: 520 }}>
          <select aria-label="Recipient" style={fieldStyle} value={form.to}
                  onChange={e => setForm({ ...form, to: e.target.value })}>
            <option value="">Select recipient…</option>
            <option value="all">All users ({users.length})</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name}{u.email ? ` — ${u.email}` : ""}</option>
            ))}
          </select>
          <input aria-label="Title" style={fieldStyle} placeholder="Title" value={form.title}
                 onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea aria-label="Message" style={fieldStyle} rows={3} placeholder="Message" value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })} />
          {error && <div style={{ color: "#c62828", fontSize: ".85rem" }}>{error}</div>}
          <div>
            <Btn variant="primary" onClick={sending ? undefined : send}>
              {sending ? "Sending…" : "Send notification"}
            </Btn>
          </div>
        </div>
      </section>

      <section className="adm-section">
        <SectionTitle sub="Everything sent to users. Read-only — notifications cannot be deleted.">
          Sent notifications
        </SectionTitle>
        {loading ? (
          <Loading msg="Loading notifications" />
        ) : items.length === 0 ? (
          <EmptyState icon={<FiInbox />} msg="Nothing sent yet" />
        ) : (
          items.map(n => (
            <div key={n._id} className="adm-row">
              <div className="adm-row-main">
                <span className="adm-row-title">{n.title}</span>
                <Meta items={[
                  { icon: <FiUser />, text: `To: ${n.user?.name || "Unknown"}${n.user?.email ? ` (${n.user.email})` : ""}` },
                  { icon: <FiCalendar />, text: new Date(n.createdAt).toLocaleString() },
                  { text: n.isRead ? "Read" : "Unread" },
                ]} />
                <p style={{ margin: ".35rem 0 0", fontSize: ".85rem" }}>{n.message}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}