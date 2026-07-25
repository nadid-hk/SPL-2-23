import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8000/api";

export default function Dashboard({ go, user }) {
  const handleProfileClick = () => go("profile");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchApprovedPosts = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch(`${API_BASE}/posts/approved`);
        const result = await res.json();
        if (res.ok && result.success) {
          setPosts(result.data || []);
        } else {
          throw new Error(result.message || "Could not load listings.");
        }
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedPosts();
  }, []);

  // NOTE: "Recommended" and "Student Posts" used to be two separate mock
  // arrays (`houses` and `studentPosts`) with different shapes. In the real
  // backend there's only one concept — an admin-approved Post — so both
  // sections now render from the same `posts` list. If you want a distinct
  // "recommended for you" ranking later, that's a query/sort concern on
  // /api/posts/approved (e.g. nearest to campus, newest first), not a
  // separate collection.
  // const recommended = posts.slice(0, 4);

  return (
    <div className="page">
      <Navbar page="dashboard" go={go} user={user} onProfileClick={handleProfileClick} />

      <div className="dashboard-content">
        {/* WELCOME HERO */}
        <div className="welcome-hero">
          <span className="eyebrow">Welcome Back</span>
          <h1>Hello, <span>{user?.name || "User"}!</span></h1>
          <p>Discover your next home near IUT. Curated listings just for you.</p>
        </div>

        {errorMessage && (
          <div style={{ background: "#ffebee", color: "#c62828", padding: "1rem", borderRadius: 8, margin: "1.5rem 0", fontSize: "0.9rem" }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ── HOUSE LISTINGS ── */}
        <div className="section-header">
          {/* This section will be added further if we get enough time to solve */}
          {/* <div>
            <div className="section-title">Recommended Houses For You</div>
            <div className="section-bar" />
          </div> */}
        </div>

        {/* {loading ? (
          <EmptyState msg="Loading listings..." />
        ) : recommended.length === 0 ? (
          <EmptyState msg="No approved listings yet — check back soon." />
        ) : (
          <div className="listings-grid">
            {recommended.map(post => (
              <HouseCard key={post._id} post={post} onClick={() => go("detail", post)} />
            ))}
          </div>
        )} */}

        {/* ── STUDENT POSTS ── */}
        <div className="section-header" style={{ marginTop: "3rem" }}>
          <div>
            <div className="section-title">Listing Of Houses</div>
            <div className="section-bar" />
          </div>
          <button className="btn-primary" style={{ padding: ".6rem 1.2rem", fontSize: ".85rem" }} onClick={() => go("post")}>
            + Post a House
          </button>
        </div>

        {loading ? (
          <EmptyState msg="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState msg="No posts yet. Be the first to post your property!" />
        ) : (
          <div className="listings-grid">
            {posts.map(post => (
              <PostCard key={post._id} post={post} go={go} />
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <h4>KHOJ</h4>
        <p>Connecting IUT students with trusted housing near campus.</p>
        <p style={{ marginTop: ".5rem", fontSize: ".76rem", opacity: 0.6 }}>© 2026 KHOJ. All rights reserved.</p>
      </footer>
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--gray-text)" }}>
      <div style={{ fontWeight: 700 }}>{msg}</div>
    </div>
  );
}

/* ── HOUSE CARD ──
   `isRented` comes from Post.isRented (the real, authoritative field —
   it belongs on the listing itself), set via the owner's/admin's
   "Mark as Rented / Available" action on the Detail page. */
function HouseCard({ post, onClick }) {
  const houseName = post.registeredHouse?.housePropertyName || "Unnamed Property";
  const image = post.photos?.[0]?.url;
  const isRented = post.isRented || false; // FIX: real field lives on Post, not registeredHouse

  return (
    <div className="prop-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="prop-card-img" style={{ position: 'relative', overflow: 'hidden' }}>
        {image ? (
          <img
            src={image}
            alt={houseName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--gray-bg)' }} />
        )}

        <span
          className={`prop-status-badge ${isRented ? "rented" : "available"}`}
          style={{
            position: 'absolute', top: 10, right: 10,
            fontSize: '.72rem', fontWeight: 700, padding: '.25rem .7rem', borderRadius: 20,
            background: isRented ? '#fce4ec' : '#e8f5e9',
            color: isRented ? '#c62828' : '#2e7d32',
            border: `1px solid ${isRented ? '#ef9a9a' : '#a5d6a7'}`
          }}
        >
          {isRented ? '🔴 Rented' : '🟢 Available'}
        </span>
      </div>

      <div className="prop-card-body">
        <div className="prop-card-name">{houseName}</div>
        <div className="prop-meta">
          <div className="prop-meta-row"><span></span> ৳{post.monthlyRent?.toLocaleString()} / month</div>
          <div className="prop-meta-row"><span></span> {post.fullAddress}</div>
        </div>
        <button className="btn-detail">Get Details</button>
      </div>
    </div>
  );
}

/* ── STUDENT POST CARD ── */
function PostCard({ post, go }) {
  const houseName = post.registeredHouse?.housePropertyName || "Unnamed Property";
  const image = post.photos?.[0]?.url;
  const has24_7 = post.utilities?.includes("24/7 Electricity");
  const isRented = post.isRented || false; // FIX: real field lives on Post, not registeredHouse

  return (
    <div className="prop-card">
      <div className="prop-card-img" style={{ position: 'relative', overflow: 'hidden' }}>
        {image ? (
          <img
            src={image}
            alt={houseName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--gray-bg)' }} />
        )}

        <span
          className={`prop-status-badge ${isRented ? "rented" : "available"}`}
          style={{
            position: 'absolute', top: 10, right: 10,
            fontSize: '.72rem', fontWeight: 700, padding: '.25rem .7rem', borderRadius: 20,
            background: isRented ? '#fce4ec' : '#e8f5e9',
            color: isRented ? '#c62828' : '#2e7d32',
            border: `1px solid ${isRented ? '#ef9a9a' : '#a5d6a7'}`
          }}
        >
          {isRented ? '🔴 Rented' : '🟢 Available'}
        </span>
      </div>
      <div className="prop-card-body">
        <div className="prop-card-name">{houseName}</div>
        <div className="prop-meta">
          <div className="prop-meta-row"><span></span> ৳{post.monthlyRent?.toLocaleString()} / month</div>
          <div className="prop-meta-row"><span></span> Posted by: {post.ownerName}</div>
          <div className="prop-meta-row"><span></span> {has24_7 ? "24/7 Electricity" : "No 24/7 backup"}</div>
        </div>
        {/* FIX: this used to just alert() a few fields instead of opening
            the real Detail page — the button never received `go` and never
            called it. Now it navigates the same way HouseCard's "Get
            Details" button does. */}
        <button
          className="btn-detail"
          onClick={() => go && go("detail", post)}
        >
          View Post
        </button>
      </div>
    </div>
  );
}