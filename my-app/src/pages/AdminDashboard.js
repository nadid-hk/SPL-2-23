import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8000/api";

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

  // App-level simulated notifications state (local toast list — actual
  // persisted notifications live in the Notification collection and are
  // fetched per-user from /api/notifications/:userId elsewhere in the app)
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const clearNotification = (indexToClear) => {
    setNotifications(prev => prev.filter((_, idx) => idx !== indexToClear));
  };

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

      const post = pendingPosts.find(p => p._id === id);
      addNotification({
        type: decision === "approved" ? "success" : "reject",
        houseName: post?.registeredHouse?.housePropertyName || "This listing",
        message: decision === "approved"
          ? "The listing was approved and is now live."
          : `Rejected.${reason ? ` Reason: "${reason}"` : ""}`,
        time: "Just Now"
      });

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
        ? `✅ Registration confirmed!\n${reg?.ownerFullName || "The owner"} can now log in as a Home Owner.`
        : `❌ Registration rejected.${reason ? `\nReason: ${reason}` : ""}`
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

      addNotification({
        type: "reject",
        houseName: targetUser.name,
        message: isExpiredRank
          ? "Expired rank-based account removed."
          : `Account removed for misconduct.${reason ? ` Reason: "${reason}"` : ""}`,
        time: "Just Now"
      });

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
    { id: "overview", label: " Overview"         },
    { id: "posts",    label: ` Posts${pendingPosts.length ? ` (${pendingPosts.length})` : ""}` },
    { id: "regs",     label: ` Registrations${pendingRegs.length ? ` (${pendingRegs.length})` : ""}` },
    { id: "listings", label: " All Listings"      },
    { id: "users",    label: ` Users${expiredRankUsers.length ? ` (${expiredRankUsers.length} expired)` : ""}` },
  ];

  return (
    <div className="page">
      <Navbar 
        page="adminDashboard" 
        go={go} 
        user={user} 
        notifications={notifications}
        clearNotification={clearNotification}
      />
      <div className="dashboard-content">

        {/* ── ADMIN HERO ── */}
        <div className="welcome-hero" style={{
          background: "linear-gradient(135deg, #1a237e 0%, #4a148c 100%)",
          color: "#fff",
          borderRadius: 16,
          padding: "2rem 2.5rem",
          marginBottom: "2rem"
        }}>
          <span className="eyebrow" style={{ color: "rgba(255,255,255,.7)" }}>Admin Control Panel</span>
          <h1 style={{ color: "#fff" }}>Welcome, <span style={{ color: "#ce93d8" }}>{user?.name || "Admin"}</span></h1>
          <p style={{ color: "rgba(255,255,255,.75)", marginTop: ".4rem" }}>
            Monitor the platform, approve listings and confirm new home owner accounts.
          </p>
        </div>

        {loadError && (
          <div style={{ background: "#ffebee", color: "#c62828", padding: "1rem", borderRadius: 8, marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            ⚠️ {loadError}
          </div>
        )}

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Pending Posts",         value: pendingPosts.length, color: "#e65100", bg: "#fff3e0", icon: "", tab: "posts"    },
            { label: "Pending Registrations", value: pendingRegs.length,  color: "#1a237e", bg: "#e8eaf6", icon: "", tab: "regs"     },
            { label: "Live Listings",         value: listings.length,     color: "#1b5e20", bg: "#e8f5e9", icon: "", tab: "listings" },
          ].map(stat => (
            <div
              key={stat.label}
              onClick={() => setActiveTab(stat.tab)}
              style={{
                background: stat.bg,
                borderRadius: 14,
                padding: "1.2rem 1rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform .15s",
                border: `1.5px solid ${stat.bg}`
              }}
            >
              <div style={{ fontSize: "1.6rem" }}>{stat.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: ".75rem", color: stat.color, fontWeight: 600, marginTop: ".25rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", borderBottom: "2px solid #e0e0e0", marginBottom: "1.5rem", gap: 0, overflowX: "auto" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: ".75rem 1.25rem",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "3px solid #4a148c" : "3px solid transparent",
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? "#4a148c" : "var(--gray-text)",
                cursor: "pointer",
                fontSize: ".875rem",
                whiteSpace: "nowrap",
                transition: "all .2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
              <ActionBtn color="#e65100" onClick={() => setActiveTab("posts")}>
                 Review {pendingPosts.length} Pending Post{pendingPosts.length !== 1 ? "s" : ""}
              </ActionBtn>
              <ActionBtn color="#1a237e" onClick={() => setActiveTab("regs")}>
                 Review {pendingRegs.length} Registration{pendingRegs.length !== 1 ? "s" : ""}
              </ActionBtn>
              <ActionBtn color="#2e7d32" onClick={() => setActiveTab("listings")}>
                 Manage All Listings
              </ActionBtn>
            </div>

            <SectionTitle>Recent Pending Posts</SectionTitle>
            {loadingPosts ? (
              <EmptyState icon="" msg="Loading pending posts..." />
            ) : pendingPosts.length === 0 ? (
              <EmptyState icon="" msg="No pending posts." />
            ) : (
              pendingPosts.slice(0, 2).map(post => (
                <PendingRow key={post._id}
                  title={` ${post.registeredHouse?.housePropertyName || "Unnamed Property"}`}
                  sub={`${post.ownerName} · ৳${post.monthlyRent.toLocaleString()}/mo · ${new Date(post.createdAt).toLocaleDateString()}`}
                  onApprove={() => approvePost(post._id)}
                  onReject={() => rejectPost(post._id)}
                />
              ))
            )}

            <SectionTitle style={{ marginTop: "1.5rem" }}>Recent Pending Registrations</SectionTitle>
            {loadingRegs ? (
              <EmptyState icon="" msg="Loading pending registrations..." />
            ) : pendingRegs.length === 0 ? (
              <EmptyState icon="" msg="No pending registrations." />
            ) : (
              pendingRegs.slice(0, 2).map(reg => (
                <PendingRow key={reg._id}
                  title={`👤 ${reg.ownerFullName}`}
                  sub={`${reg.housePropertyName} · ${reg.phoneNumber} · ${new Date(reg.createdAt).toLocaleDateString()}`}
                  onApprove={() => approveReg(reg._id)}
                  onReject={() => rejectReg(reg._id)}
                  approveLabel="✅ Confirm"
                  approveColor="#1a237e"
                />
              ))
            )}
          </div>
        )}

        {/* ── PENDING POSTS ── */}
        {activeTab === "posts" && (
          <div>
            <SectionTitle>Pending Post Approvals</SectionTitle>
            {loadingPosts ? (
              <EmptyState icon="" msg="Loading pending posts..." />
            ) : pendingPosts.length === 0 ? (
              <EmptyState icon="" msg="All caught up! No pending posts." />
            ) : (
              pendingPosts.map(post => (
                <div key={post._id} style={{
                  border: "1.5px solid #e0e0e0", borderRadius: 12,
                  marginBottom: ".75rem", background: "#fff", overflow: "hidden"
                }}>
                  <div
                    onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                    style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".95rem" }}> {post.registeredHouse?.housePropertyName || "Unnamed Property"}</div>
                      <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                        👤 {post.ownerName} &nbsp;·&nbsp;  ৳{post.monthlyRent.toLocaleString()}/mo &nbsp;·&nbsp;  {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontSize: ".8rem", color: "#7c3aed" }}>{expandedPost === post._id ? "▲ collapse" : "▼ details"}</span>
                  </div>

                  {expandedPost === post._id && (
                    <div style={{ padding: "1rem 1.25rem", background: "#f3e5f5", borderTop: "1px solid #e0e0e0" }}>
                      <InfoRow label=" Property"  value={post.registeredHouse?.housePropertyName || "—"} />
                      <InfoRow label=" Owner"     value={post.ownerName} />
                      <InfoRow label=" Phone"     value={post.contactPhone} />
                      <InfoRow label=" Rent"      value={`৳${post.monthlyRent.toLocaleString()}/mo`} />
                      <InfoRow label=" Address"   value={post.fullAddress} />
                      <InfoRow label=" Gate Closes" value={post.gateClosedTime} />
                      <InfoRow label=" Submitted" value={new Date(post.createdAt).toLocaleString()} />
                      {post.photos?.length > 0 && (
                        <div style={{ display: "flex", gap: ".5rem", margin: ".6rem 0" }}>
                          {post.photos.map((p, i) => (
                            <img key={i} src={p.url} alt={`Listing photo ${i + 1}`} style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8 }} />
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: ".6rem", marginTop: "1rem" }}>
                        <ApproveBtn onClick={() => approvePost(post._id)}>✅ Approve Post</ApproveBtn>
                        <RejectBtn  onClick={() => rejectPost(post._id)}>❌ Reject</RejectBtn>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── PENDING REGISTRATIONS ── */}
        {activeTab === "regs" && (
          <div>
            <SectionTitle>Pending Home Owner Registrations</SectionTitle>
            {loadingRegs ? (
              <EmptyState icon="" msg="Loading pending registrations..." />
            ) : pendingRegs.length === 0 ? (
              <EmptyState icon="" msg="No pending registrations." />
            ) : (
              pendingRegs.map(reg => (
                <div key={reg._id} style={{
                  border: "1.5px solid #c5cae9", borderRadius: 12,
                  marginBottom: ".75rem", background: "#fff", overflow: "hidden"
                }}>
                  <div
                    onClick={() => setExpandedReg(expandedReg === reg._id ? null : reg._id)}
                    style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".95rem" }}> {reg.ownerFullName}</div>
                      <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                         {reg.phoneNumber} &nbsp;·&nbsp;  {reg.housePropertyName} &nbsp;·&nbsp;  {new Date(reg.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ fontSize: ".8rem", color: "#7c3aed" }}>{expandedReg === reg._id ? "▲ collapse" : "▼ details"}</span>
                  </div>

                  {expandedReg === reg._id && (
                    <div style={{ padding: "1rem 1.25rem", background: "#f3e5f5", borderTop: "1px solid #c5cae9" }}>
                      <InfoRow label=" Owner Name" value={reg.ownerFullName} />
                      <InfoRow label=" Phone"      value={reg.phoneNumber} />
                      <InfoRow label=" Property"   value={reg.housePropertyName} />
                      <InfoRow label=" Address"    value={reg.houseAddress} />
                      <InfoRow label=" Map Pin"    value={reg.houseMap?.coordinates?.slice().reverse().join(", ")} />
                      <InfoRow label=" Submitted"  value={new Date(reg.createdAt).toLocaleString()} />
                      <div style={{ display: "flex", gap: ".5rem", margin: ".6rem 0" }}>
                        {reg.housePicture?.url && (
                          <img src={reg.housePicture.url} alt="House" style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8 }} />
                        )}
                        {reg.khatianCertificate?.url && (
                          <img src={reg.khatianCertificate.url} alt="Khatian Certificate" style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8 }} />
                        )}
                      </div>
                      <div style={{ display: "flex", gap: ".6rem", marginTop: "1rem" }}>
                        <ApproveBtn color="#1a237e" onClick={() => approveReg(reg._id)}>✅ Confirm Registration</ApproveBtn>
                        <RejectBtn onClick={() => rejectReg(reg._id)}>❌ Reject</RejectBtn>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ALL LISTINGS ── */}
        {activeTab === "listings" && (
          <div>
            <SectionTitle>All Live Listings</SectionTitle>
            <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1.25rem" }}>
              These are all currently admin-approved listings.
            </p>
            {loadingListings ? (
              <EmptyState icon="" msg="Loading listings..." />
            ) : listings.length === 0 ? (
              <EmptyState icon="" msg="No approved listings yet." />
            ) : (
              listings.map(listing => (
                <div key={listing._id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: "1.5px solid #e0e0e0", borderRadius: 12,
                  padding: "1rem 1.25rem", marginBottom: ".75rem", background: "#fff",
                  flexWrap: "wrap", gap: ".75rem"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".95rem" }}> {listing.registeredHouse?.housePropertyName || "Unnamed Property"}</div>
                    <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                       {listing.ownerName} &nbsp;·&nbsp;  ৳{listing.monthlyRent.toLocaleString()}/mo
                    </div>
                  </div>
                  <span style={{
                    padding: ".28rem .8rem", borderRadius: 20, fontSize: ".78rem", fontWeight: 700,
                    background: "#e8f5e9", color: "#2e7d32"
                  }}>
                    🟢 Approved
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <div>
            <SectionTitle>Expired Rank-Based Accounts</SectionTitle>
            <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1rem" }}>
              Rank-registered accounts can only edit their profile for 6 months after signup.
              Once that window passes they're listed here for cleanup.
            </p>
            {loadingExpired ? (
              <EmptyState icon="" msg="Checking for expired rank accounts..." />
            ) : expiredRankUsers.length === 0 ? (
              <EmptyState icon="" msg="No expired rank-based accounts." />
            ) : (
              expiredRankUsers.map(u => (
                <div key={u._id} style={{
                  border: "1.5px solid #ffcdd2", borderRadius: 12,
                  padding: "1rem 1.25rem", marginBottom: ".75rem",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: ".5rem", background: "#fff5f5"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{u.name}</div>
                    <div style={{ fontSize: ".78rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                      Rank: {u.rank || "—"} &nbsp;·&nbsp; Deadline passed {new Date(u.profileEditDeadline).toLocaleDateString()}
                    </div>
                  </div>
                  <RejectBtn onClick={() => deleteUser(u, true)}>🗑️ Remove Account</RejectBtn>
                </div>
              ))
            )}

            <SectionTitle style={{ marginTop: "2rem" }}>All Users</SectionTitle>
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{
                width: "100%", maxWidth: 360, padding: ".55rem .8rem",
                border: "1.5px solid #e0e0e0", borderRadius: 8,
                fontSize: ".85rem", marginBottom: "1.1rem"
              }}
            />
            {loadingUsers ? (
              <EmptyState icon="" msg="Loading users..." />
            ) : filteredUsers.length === 0 ? (
              <EmptyState icon="" msg="No matching users." />
            ) : (
              filteredUsers.map(u => (
                <div key={u._id} style={{
                  border: "1.5px solid #e0e0e0", borderRadius: 12,
                  padding: "1rem 1.25rem", marginBottom: ".75rem",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexWrap: "wrap", gap: ".5rem", background: "#fff"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{u.name}</div>
                    <div style={{ fontSize: ".78rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                      {u.authMethod === "EmailUser" ? u.email : `Rank: ${u.rank || "—"}`}
                      {u.phone ? ` · ${u.phone}` : ""} &nbsp;·&nbsp; joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <RejectBtn onClick={() => deleteUser(u, false)}>🗑️ Delete (Misconduct)</RejectBtn>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      <footer className="footer">
        <h4>KHOJ Admin</h4>
        <p>Platform management for KHOJ — IUT student housing.</p>
        <p style={{ marginTop: ".5rem", fontSize: ".76rem", opacity: 0.6 }}>© 2026 KHOJ. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ── Small helper components ──
function SectionTitle({ children, style }) {
  return (
    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: ".85rem", color: "var(--dark)", ...style }}>
      {children}
      <div style={{ height: 3, width: 40, background: "#4a148c", borderRadius: 2, marginTop: ".3rem" }} />
    </div>
  );
}

function ActionBtn({ children, onClick, color = "#4a148c" }) {
  return (
    <button onClick={onClick} style={{
      background: color, color: "#fff", border: "none",
      borderRadius: 10, padding: ".65rem 1.3rem",
      fontWeight: 700, fontSize: ".85rem", cursor: "pointer"
    }}>
      {children}
    </button>
  );
}

function ApproveBtn({ children, onClick, color = "#2e7d32" }) { return <button onClick={onClick} style={{ background: color, color: "#fff", border: "none", borderRadius: 8, padding: ".45rem 1rem", fontWeight: 700, fontSize: ".82rem", cursor: "pointer" }}>{children}</button>; }
function RejectBtn({ children, onClick }) { return <button onClick={onClick} style={{ background: "#c62828", color: "#fff", border: "none", borderRadius: 8, padding: ".45rem 1rem", fontWeight: 700, fontSize: ".82rem", cursor: "pointer" }}>{children}</button>; }
function PendingRow({ title, sub, onApprove, onReject, approveLabel = "✅ Approve", approveColor = "#2e7d32" }) { return <div style={{ border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: ".75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem", background: "#fff" }}><div><div style={{ fontWeight: 700, fontSize: ".9rem" }}>{title}</div><div style={{ fontSize: ".78rem", color: "var(--gray-text)", marginTop: ".2rem" }}>{sub}</div></div><div style={{ display: "flex", gap: ".5rem" }}> <ApproveBtn onClick={onApprove} color={approveColor}>{approveLabel}</ApproveBtn> <RejectBtn onClick={onReject}>❌ Reject</RejectBtn></div></div>; }
function InfoRow({ label, value }) { return <div style={{ display: "flex", gap: ".75rem", fontSize: ".83rem", marginBottom: ".45rem" }}><span style={{ color: "var(--gray-text)", minWidth: 110 }}>{label}</span><span style={{ fontWeight: 600 }}>{value}</span></div>; }
function EmptyState({ icon, msg }) { return <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--gray-text)" }}><div style={{ fontSize: "2.5rem", marginBottom: ".6rem" }}>{icon}</div><div style={{ fontWeight: 700 }}>{msg}</div></div>; }