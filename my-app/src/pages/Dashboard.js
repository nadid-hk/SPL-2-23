import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import SearchMap from "../components/SearchMap";
import { API_BASE } from "../config";
import { FiAlertTriangle, FiUser, FiZap, FiMapPin, FiPlus } from "react-icons/fi";
import { FaBangladeshiTakaSign, FaPersonWalking } from "react-icons/fa6";
import { BsCircleFill } from "react-icons/bs";

export default function Dashboard({ go, user }) {
  const handleProfileClick = () => go("profile");

  const [posts, setPosts] = useState([]);
  const [iutGate, setIutGate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeId, setActiveId] = useState(null);

  // Re-run when the logged-in user changes (e.g. right after signup/login)
  const userId = user?._id || user?.id;

  useEffect(() => {
    // Abort the request if the user changes or the page unmounts, so a slow
    // response from a previous session can never overwrite the new one.
    const controller = new AbortController();

    const fetchApprovedPosts = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const res = await fetch(`${API_BASE}/posts/approved`, { signal: controller.signal });
        const result = await res.json();
        if (res.ok && result.success) {//  FIX: /api/posts/approved now returns { posts, iutGate }
          // instead of a bare array (see post.controller.js) so the map
          // card can place the gate pin without hardcoding coordinates on
          // the frontend. Previously this did `setPosts(result.data || [])`
          // which is why nothing ever rendered once the shape changed.
          setPosts(result.data?.posts || []);
          setIutGate(result.data?.iutGate || null);
        } else {
          throw new Error(result.message || "Could not load listings.");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setErrorMessage(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchApprovedPosts();
    return () => controller.abort();
  }, [userId]);

  // ── NEW: map pins built straight from Post data (not HomeRegister) —
  // this is the fix for "the map should reflect posts, not home
  // registrations." Every approved Post already carries its own
  // exactLocation (copied from the registered house at post-creation time,
  // see post.service.js) plus the pre-computed `distance` block from
  // HouseDistance. Posts with no usable coordinates are simply skipped so a
  // bad/missing pin can't crash the map.
  const pins = useMemo(() => {
    return posts
      .filter((p) => Array.isArray(p.exactLocation?.coordinates) && p.exactLocation.coordinates.length === 2)
      .map((p) => {
        const [lng, lat] = p.exactLocation.coordinates;
        return {
          id: p._id,
          title: p.registeredHouse?.housePropertyName || "Unnamed Property",
          rent: p.monthlyRent,
          lat,
          lng,
          thumb: p.photos?.[0]?.url || null,
          ratingAvg: null,
          reviewCount: null,
          distanceFromGateMeters: p.distance?.meters ?? null,
        };
      });
  }, [posts]);

  // SearchMap calls `go("detail", pin.id)` on pin click — Dashboard's own
  // convention (see PostCard/HouseCard below) passes the full post object
  // instead, so Detail.js gets everything it needs without a re-fetch.
  // This little wrapper bridges the two without touching SearchMap itself.
  const goToDetailById = (page, id) => {
    const fullPost = posts.find((p) => p._id === id);
    go(page, fullPost || id);
  };

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
          <h1>Hello, <span>{user?.name || user?.fullName || user?.email?.split("@")[0] || "User"}!</span></h1>
          <p>Discover your next home near IUT. Curated listings just for you.</p>
        </div>

        {errorMessage && (
          <div className="notice error" style={{ margin: "1.5rem 0" }}>
            <FiAlertTriangle /> <span>{errorMessage}</span>
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

        {/* ── STUDENT POSTS + MAP CARD (Airbnb-style split view) ── */}
        <div className="section-header" style={{ marginTop: "3rem" }}>
          <div>
            <div className="section-title">Listing Of Houses</div>
            <div className="section-bar" />
          </div>
          <button className="btn-primary" style={{ padding: ".6rem 1.2rem", fontSize: ".85rem", display: "inline-flex", alignItems: "center", gap: ".4rem" }} onClick={() => go("post")}>
            <FiPlus /> Post a House
          </button>
        </div>

        {loading ? (
          <EmptyState msg="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState msg="No posts yet. Be the first to post your property!" />
        ) : (
          <div className="search-split">
            <div className="search-results-col">
              <div className="listings-grid split">
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    go={go}
                    active={post._id === activeId}
                    onHover={() => setActiveId(post._id)}
                    onHoverEnd={() => setActiveId(null)}
                  />
                ))}
              </div>
            </div>

            <div className="search-map-col">
              <SearchMap
                pins={pins}
                go={goToDetailById}
                activeId={activeId}
                onActive={setActiveId}
                gate={iutGate}
              />
            </div>
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

function StatusBadge({ isRented, style }) {
  return (
    <span
      className={`prop-status-badge ${isRented ? "rented" : "available"}`}
      style={{
        position: "absolute", top: 10, right: 10,
        display: "inline-flex", alignItems: "center", gap: ".35rem",
        fontSize: ".72rem", fontWeight: 700, padding: ".25rem .7rem", borderRadius: 20,
        ...style,
      }}
    >
      <BsCircleFill size={7} /> {isRented ? "Rented" : "Available"}
    </span>
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

        <StatusBadge isRented={isRented} />
      </div>

      <div className="prop-card-body">
        <div className="prop-card-name">{houseName}</div>
        <div className="prop-meta">
          <div className="prop-meta-row"><FaBangladeshiTakaSign /> ৳{post.monthlyRent?.toLocaleString()} / month</div>
          <div className="prop-meta-row"><FiMapPin /> {post.fullAddress}</div>
        </div>
        <button className="btn-detail">Get Details</button>
      </div>
    </div>
  );
}

/* ── STUDENT POST CARD ──
   `active` + `onHover`/`onHoverEnd` sync this card's highlight state with
   its pin on the SearchMap (hover a card -> its price pin lifts on the map,
   and vice versa via SearchMap's onActive). */
function PostCard({ post, go, active, onHover, onHoverEnd }) {
  const houseName = post.registeredHouse?.housePropertyName || "Unnamed Property";
  const image = post.photos?.[0]?.url;
  const has24_7 = post.utilities?.includes("24/7 Electricity");
  const isRented = post.isRented || false; // FIX: real field lives on Post, not registeredHouse
  const distanceLabel =
    post.distance?.meters != null
      ? post.distance.meters < 1000
        ? `${Math.round(post.distance.meters / 10) * 10} m from IUT`
        : `${post.distance.km} km from IUT`
      : null;

  return (
    <div
      className={`prop-card${active ? " active" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
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

        <StatusBadge isRented={isRented} />
      </div>
      <div className="prop-card-body">
        <div className="prop-card-name">{houseName}</div>
        <div className="prop-meta">
          <div className="prop-meta-row"><FaBangladeshiTakaSign /> ৳{post.monthlyRent?.toLocaleString()} / month</div>
          <div className="prop-meta-row"><FiUser /> Posted by: {post.ownerName}</div>
          <div className="prop-meta-row"><FiZap /> {has24_7 ? "24/7 Electricity" : "No 24/7 backup"}</div>
          {distanceLabel && (
            <div className="prop-meta-row"><FaPersonWalking /> {distanceLabel}</div>
          )}
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