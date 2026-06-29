import { useState } from "react";
import Navbar from "../components/Navbar";

// ── Mock data — replace with API calls once backend is ready ──
const MOCK_PENDING_POSTS = [
  { id: 1, houseName: "Sunrise Hostel",      owner: "Rahim Uddin",   phone: "01711223344", rent: 7500, address: "House 3, Road 2, BoardBazar", submittedAt: "2026-06-18" },
  { id: 2, houseName: "Al-Amin Boarding",    owner: "Kamal Hossain", phone: "01622334455", rent: 6000, address: "House 7, Road 4, BoardBazar", submittedAt: "2026-06-19" },
  { id: 3, houseName: "Green Valley Mess",   owner: "Nargis Begum",  phone: "01933445566", rent: 8500, address: "House 11, Road 1, BoardBazar", submittedAt: "2026-06-19" },
];

const MOCK_PENDING_REGS = [
  { id: 1, ownerName: "Fatema Khanom",  phone: "01711223344", houseName: "Comfort Inn Boarding", address: "House 5, Road 3, BoardBazar", mapPin: "23.94821, 90.37943", submittedAt: "2026-06-17" },
  { id: 2, ownerName: "Jahangir Alam",  phone: "01855667788", houseName: "Metro Student Mess",   address: "House 9, Road 6, BoardBazar", mapPin: "23.94799, 90.37912", submittedAt: "2026-06-18" },
];

const MOCK_ALL_LISTINGS = [
  { id: 1, houseName: "Hasan Villa",        owner: "Hasan Ali",     status: "Available", rent: 7000 },
  { id: 2, houseName: "Nilufar Boarding",   owner: "Nilufar Akter", status: "Rented",    rent: 6500 },
  { id: 3, houseName: "Bismillah Mess",     owner: "Karim Mia",     status: "Available", rent: 5500 },
  { id: 4, houseName: "City View Hostel",   owner: "Ratan Das",     status: "Available", rent: 8000 },
];

export default function AdminDashboard({ go, user }) {
  const [activeTab, setActiveTab]       = useState("overview");
  const [pendingPosts, setPendingPosts] = useState(MOCK_PENDING_POSTS);
  const [pendingRegs,  setPendingRegs]  = useState(MOCK_PENDING_REGS);
  const [listings, setListings]         = useState(MOCK_ALL_LISTINGS);
  const [expandedPost, setExpandedPost] = useState(null);
  const [expandedReg,  setExpandedReg]  = useState(null);

  const approvePost = id => {
    alert(`✅ Post approved! It is now live on the student dashboard.`);
    setPendingPosts(prev => prev.filter(p => p.id !== id));
    setExpandedPost(null);
  };

  const rejectPost = id => {
    const reason = prompt("Reason for rejection (optional):");
    alert(`❌ Post rejected.${reason ? `\nReason: ${reason}` : ""}`);
    setPendingPosts(prev => prev.filter(p => p.id !== id));
    setExpandedPost(null);
  };

  const approveReg = id => {
    const reg = pendingRegs.find(r => r.id === id);
    alert(`✅ Registration confirmed!\n${reg.ownerName} can now log in as a Home Owner.`);
    setPendingRegs(prev => prev.filter(r => r.id !== id));
    setExpandedReg(null);
  };

  const rejectReg = id => {
    const reason = prompt("Reason for rejection (optional):");
    alert(`❌ Registration rejected.${reason ? `\nReason: ${reason}` : ""}`);
    setPendingRegs(prev => prev.filter(r => r.id !== id));
    setExpandedReg(null);
  };

  const toggleListingStatus = id => {
    setListings(prev => prev.map(l =>
      l.id === id ? { ...l, status: l.status === "Available" ? "Rented" : "Available" } : l
    ));
  };

  const tabs = [
    { id: "overview", label: " Overview"         },
    { id: "posts",    label: ` Posts${pendingPosts.length ? ` (${pendingPosts.length})` : ""}` },
    { id: "regs",     label: ` Registrations${pendingRegs.length ? ` (${pendingRegs.length})` : ""}` },
    { id: "listings", label: " All Listings"      },
  ];

  return (
    <div className="page">
      <Navbar page="adminDashboard" go={go} user={user} />
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

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Pending Posts",         value: pendingPosts.length, color: "#e65100", bg: "#fff3e0", icon: "", tab: "posts"    },
            { label: "Pending Registrations", value: pendingRegs.length,  color: "#1a237e", bg: "#e8eaf6", icon: "", tab: "regs"     },
            { label: "Live Listings",         value: listings.length,     color: "#1b5e20", bg: "#e8f5e9", icon: "", tab: "listings" },
            { label: "Available Now",         value: listings.filter(l => l.status === "Available").length, color: "#00695c", bg: "#e0f2f1", icon: "", tab: "listings" },
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
            {pendingPosts.length === 0
              ? <EmptyState icon="" msg="No pending posts." />
              : pendingPosts.slice(0, 2).map(post => (
                  <PendingRow key={post.id}
                    title={` ${post.houseName}`}
                    sub={`${post.owner} · ৳${post.rent.toLocaleString()}/mo · ${post.submittedAt}`}
                    onApprove={() => approvePost(post.id)}
                    onReject={() => rejectPost(post.id)}
                  />
                ))
            }

            <SectionTitle style={{ marginTop: "1.5rem" }}>Recent Pending Registrations</SectionTitle>
            {pendingRegs.length === 0
              ? <EmptyState icon="" msg="No pending registrations." />
              : pendingRegs.slice(0, 2).map(reg => (
                  <PendingRow key={reg.id}
                    title={`👤 ${reg.ownerName}`}
                    sub={`${reg.houseName} · ${reg.phone} · ${reg.submittedAt}`}
                    onApprove={() => approveReg(reg.id)}
                    onReject={() => rejectReg(reg.id)}
                    approveLabel="✅ Confirm"
                    approveColor="#1a237e"
                  />
                ))
            }
          </div>
        )}

        {/* ── PENDING POSTS ── */}
        {activeTab === "posts" && (
          <div>
            <SectionTitle>Pending Post Approvals</SectionTitle>
            {pendingPosts.length === 0
              ? <EmptyState icon="" msg="All caught up! No pending posts." />
              : pendingPosts.map(post => (
                  <div key={post.id} style={{
                    border: "1.5px solid #e0e0e0", borderRadius: 12,
                    marginBottom: ".75rem", background: "#fff", overflow: "hidden"
                  }}>
                    <div
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: ".95rem" }}> {post.houseName}</div>
                        <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                          👤 {post.owner} &nbsp;·&nbsp;  ৳{post.rent.toLocaleString()}/mo &nbsp;·&nbsp;  {post.submittedAt}
                        </div>
                      </div>
                      <span style={{ fontSize: ".8rem", color: "#7c3aed" }}>{expandedPost === post.id ? "▲ collapse" : "▼ details"}</span>
                    </div>

                    {expandedPost === post.id && (
                      <div style={{ padding: "1rem 1.25rem", background: "#f3e5f5", borderTop: "1px solid #e0e0e0" }}>
                        <InfoRow label=" Property"  value={post.houseName} />
                        <InfoRow label=" Owner"     value={post.owner} />
                        <InfoRow label=" Phone"     value={post.phone} />
                        <InfoRow label=" Rent"      value={`৳${post.rent.toLocaleString()}/mo`} />
                        <InfoRow label=" Address"   value={post.address} />
                        <InfoRow label=" Submitted" value={post.submittedAt} />
                        <div style={{ display: "flex", gap: ".6rem", marginTop: "1rem" }}>
                          <ApproveBtn onClick={() => approvePost(post.id)}>✅ Approve Post</ApproveBtn>
                          <RejectBtn  onClick={() => rejectPost(post.id)}>❌ Reject</RejectBtn>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            }
          </div>
        )}

        {/* ── PENDING REGISTRATIONS ── */}
        {activeTab === "regs" && (
          <div>
            <SectionTitle>Pending Home Owner Registrations</SectionTitle>
            {pendingRegs.length === 0
              ? <EmptyState icon="" msg="No pending registrations." />
              : pendingRegs.map(reg => (
                  <div key={reg.id} style={{
                    border: "1.5px solid #c5cae9", borderRadius: 12,
                    marginBottom: ".75rem", background: "#fff", overflow: "hidden"
                  }}>
                    <div
                      onClick={() => setExpandedReg(expandedReg === reg.id ? null : reg.id)}
                      style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: ".95rem" }}> {reg.ownerName}</div>
                        <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                           {reg.phone} &nbsp;·&nbsp;  {reg.houseName} &nbsp;·&nbsp;  {reg.submittedAt}
                        </div>
                      </div>
                      <span style={{ fontSize: ".8rem", color: "#7c3aed" }}>{expandedReg === reg.id ? "▲ collapse" : "▼ details"}</span>
                    </div>

                    {expandedReg === reg.id && (
                      <div style={{ padding: "1rem 1.25rem", background: "#f3e5f5", borderTop: "1px solid #c5cae9" }}>
                        <InfoRow label=" Owner Name" value={reg.ownerName} />
                        <InfoRow label=" Phone"      value={reg.phone} />
                        <InfoRow label=" Property"   value={reg.houseName} />
                        <InfoRow label=" Address"    value={reg.address} />
                        <InfoRow label=" Map Pin"    value={reg.mapPin} />
                        <InfoRow label=" Submitted"  value={reg.submittedAt} />
                        <div style={{ marginTop: ".75rem", padding: ".7rem .9rem", background: "#fff8e1", borderRadius: 8, fontSize: ".8rem", color: "#795548" }}>
                           Khatian Certificate and House Photo available after database integration.
                        </div>
                        <div style={{ display: "flex", gap: ".6rem", marginTop: "1rem" }}>
                          <ApproveBtn color="#1a237e" onClick={() => approveReg(reg.id)}>✅ Confirm Registration</ApproveBtn>
                          <RejectBtn onClick={() => rejectReg(reg.id)}>❌ Reject</RejectBtn>
                        </div>
                      </div>
                    )}
                  </div>
                ))
            }
          </div>
        )}

        {/* ── ALL LISTINGS ── */}
        {activeTab === "listings" && (
          <div>
            <SectionTitle>All Live Listings</SectionTitle>
            <p style={{ fontSize: ".85rem", color: "var(--gray-text)", marginBottom: "1.25rem" }}>
              These are all currently approved listings. You can toggle availability on behalf of any home owner.
            </p>
            {listings.map(listing => (
              <div key={listing.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                border: "1.5px solid #e0e0e0", borderRadius: 12,
                padding: "1rem 1.25rem", marginBottom: ".75rem", background: "#fff",
                flexWrap: "wrap", gap: ".75rem"
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: ".95rem" }}> {listing.houseName}</div>
                  <div style={{ fontSize: ".8rem", color: "var(--gray-text)", marginTop: ".2rem" }}>
                     {listing.owner} &nbsp;·&nbsp;  ৳{listing.rent.toLocaleString()}/mo
                  </div>
                </div>
                <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
                  <span style={{
                    padding: ".28rem .8rem", borderRadius: 20, fontSize: ".78rem", fontWeight: 700,
                    background: listing.status === "Available" ? "#e8f5e9" : "#fce4ec",
                    color:      listing.status === "Available" ? "#2e7d32" : "#c62828"
                  }}>
                    {listing.status === "Available" ? "🟢 Available" : "🔴 Rented"}
                  </span>
                  <button
                    onClick={() => toggleListingStatus(listing.id)}
                    style={{
                      background: listing.status === "Available" ? "#fce4ec" : "#e8f5e9",
                      color:      listing.status === "Available" ? "#c62828" : "#2e7d32",
                      border: `1.5px solid ${listing.status === "Available" ? "#ef9a9a" : "#a5d6a7"}`,
                      borderRadius: 8, padding: ".38rem .85rem",
                      fontWeight: 600, fontSize: ".78rem", cursor: "pointer"
                    }}
                  >
                    {listing.status === "Available" ? "Mark Rented" : "Mark Available"}
                  </button>
                </div>
              </div>
            ))}
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

function ApproveBtn({ children, onClick, color = "#2e7d32" }) {
  return (
    <button onClick={onClick} style={{
      background: color, color: "#fff", border: "none",
      borderRadius: 8, padding: ".45rem 1rem",
      fontWeight: 700, fontSize: ".82rem", cursor: "pointer"
    }}>
      {children}
    </button>
  );
}

function RejectBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#c62828", color: "#fff", border: "none",
      borderRadius: 8, padding: ".45rem 1rem",
      fontWeight: 700, fontSize: ".82rem", cursor: "pointer"
    }}>
      {children}
    </button>
  );
}

function PendingRow({ title, sub, onApprove, onReject, approveLabel = "✅ Approve", approveColor = "#2e7d32" }) {
  return (
    <div style={{ border: "1.5px solid #e0e0e0", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: ".75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem", background: "#fff" }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{title}</div>
        <div style={{ fontSize: ".78rem", color: "var(--gray-text)", marginTop: ".2rem" }}>{sub}</div>
      </div>
      <div style={{ display: "flex", gap: ".5rem" }}>
        <ApproveBtn onClick={onApprove} color={approveColor}>{approveLabel}</ApproveBtn>
        <RejectBtn  onClick={onReject}>❌ Reject</RejectBtn>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: ".75rem", fontSize: ".83rem", marginBottom: ".45rem" }}>
      <span style={{ color: "var(--gray-text)", minWidth: 110 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--gray-text)" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: ".6rem" }}>{icon}</div>
      <div style={{ fontWeight: 700 }}>{msg}</div>
    </div>
  );
}