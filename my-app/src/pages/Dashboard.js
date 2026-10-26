import { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "../components/Navbar";
import SearchMap from "../components/SearchMap";
import { API_BASE } from "../config";
import { FiAlertTriangle, FiUser, FiZap, FiMapPin, FiPlus, FiChevronDown, FiCheck, FiX } from "react-icons/fi";
import { FaBangladeshiTakaSign, FaPersonWalking } from "react-icons/fa6";
import { BsCircleFill } from "react-icons/bs";

// ── Filter options ──
// `value` must match exactly what is stored in Post.utilities / Post.features
// (and what the backend whitelist in the filter controller accepts).
const UTILITY_OPTIONS = [
  { key: "electricity24_7",   label: "24/7 Electricity (Backup available)", value: "24/7 Electricity" },
  { key: "ips",               label: "IPS Available",                       value: "IPS" },
  { key: "lift",              label: "Lift / Elevator",                     value: "Lift" },
  { key: "security",          label: "Security Guard",                      value: "Security Guard" },
  { key: "gas",               label: "Gas Available",                       value: "Gas" },
  { key: "waterBillIncluded", label: "Water Bill Included in Rent",         value: "Water Bill Included" },
];

const AMENITIES = [
  "Oven", "Fridge", "Washing Machine", "AC",
  "Balcony", "Attached Bath", "Shared Kitchen",
  "Wi-Fi", "Rooftop Access", "Generator",
];

const PRICE_PRESETS = [
  { label: "Any price",         min: "",      max: "" },
  { label: "Under ৳5,000",      min: "",      max: "5000" },
  { label: "৳5,000 – ৳10,000",  min: "5000",  max: "10000" },
  { label: "৳10,000 – ৳15,000", min: "10000", max: "15000" },
  { label: "Above ৳15,000",     min: "15000", max: "" },
];

const EMPTY_FILTER = { min: "", max: "", utilities: [], features: [] };

/* ── FILTER BAR ──
   Three dropdown lists (Price / Utilities / Amenities). Clicking an item
   applies it immediately: `filter` is the single source of truth and the
   Dashboard refetches whenever it changes. */
function FilterBar({ filter, setFilter }) {
  const [openMenu, setOpenMenu] = useState(null); // "price" | "utilities" | "amenities" | null
  const [minIn, setMinIn] = useState(filter.min);
  const [maxIn, setMaxIn] = useState(filter.max);
  const [priceError, setPriceError] = useState("");
  const barRef = useRef(null);

  // Close the open list when clicking anywhere outside the bar
  useEffect(() => {
    const onDown = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Keep the custom inputs in sync when the filter changes from outside
  // (preset click, chip removed, "Clear all")
  useEffect(() => {
    setMinIn(filter.min);
    setMaxIn(filter.max);
  }, [filter.min, filter.max]);

  // Custom min/max: applied automatically shortly after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      if (minIn !== "" && maxIn !== "" && Number(minIn) > Number(maxIn)) {
        setPriceError("Min cannot be greater than max.");
        return;
      }
      setPriceError("");
      setFilter((f) => (f.min === minIn && f.max === maxIn ? f : { ...f, min: minIn, max: maxIn }));
    }, 500);
    return () => clearTimeout(t);
  }, [minIn, maxIn, setFilter]);

  const toggleIn = (key, value) =>
    setFilter((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const priceActive = filter.min !== "" || filter.max !== "";
  const priceLabel = priceActive
    ? `৳${filter.min || "0"} – ${filter.max ? "৳" + filter.max : "any"}`
    : "Price";

  const isFiltered = priceActive || filter.utilities.length > 0 || filter.features.length > 0;

  const toggleMenu = (name) => setOpenMenu((m) => (m === name ? null : name));

  // Chips for everything currently applied
  const chips = [
    ...(priceActive ? [{ id: "price", label: priceLabel, remove: () => setFilter((f) => ({ ...f, min: "", max: "" })) }] : []),
    ...filter.utilities.map((v) => ({
      id: "u-" + v,
      label: UTILITY_OPTIONS.find((o) => o.value === v)?.label || v,
      remove: () => toggleIn("utilities", v),
    })),
    ...filter.features.map((v) => ({ id: "f-" + v, label: v, remove: () => toggleIn("features", v) })),
  ];

  return (
    <div ref={barRef} className="filter-bar">
      <div className="filter-row-wrap">

        {/* PRICE */}
        <div className="filter-menu">
          <button type="button" className={`filter-btn${priceActive || openMenu === "price" ? " active" : ""}`} onClick={() => toggleMenu("price")}>
            <FaBangladeshiTakaSign /> {priceLabel} <FiChevronDown />
          </button>
          {openMenu === "price" && (
            <div className="filter-panel">
              {PRICE_PRESETS.map((p) => {
                const selected = filter.min === p.min && filter.max === p.max;
                return (
                  <button
                    type="button" key={p.label} className={`filter-option${selected ? " selected" : ""}`}
                    onClick={() => setFilter((f) => ({ ...f, min: p.min, max: p.max }))}
                  >
                    <span className={`filter-tick${selected ? " selected" : ""}`}>{selected && <FiCheck size={12} />}</span>
                    {p.label}
                  </button>
                );
              })}
              <div className="filter-custom">
                <div className="filter-custom-label">Custom range</div>
                <div className="filter-custom-inputs">
                  <input
                    type="number" min="0" placeholder="Min" value={minIn}
                    onChange={(e) => setMinIn(e.target.value)}
                  />
                  <span>–</span>
                  <input
                    type="number" min="0" placeholder="Max" value={maxIn}
                    onChange={(e) => setMaxIn(e.target.value)}
                  />
                </div>
                {priceError && <div className="filter-error">{priceError}</div>}
              </div>
            </div>
          )}
        </div>

        {/* UTILITIES */}
        <div className="filter-menu">
          <button type="button" className={`filter-btn${filter.utilities.length > 0 || openMenu === "utilities" ? " active" : ""}`} onClick={() => toggleMenu("utilities")}>
            <FiZap /> Utilities{filter.utilities.length > 0 && ` (${filter.utilities.length})`} <FiChevronDown />
          </button>
          {openMenu === "utilities" && (
            <div className="filter-panel">
              {UTILITY_OPTIONS.map((u) => {
                const selected = filter.utilities.includes(u.value);
                return (
                  <button type="button" key={u.key} className={`filter-option${selected ? " selected" : ""}`} onClick={() => toggleIn("utilities", u.value)}>
                    <span className={`filter-tick${selected ? " selected" : ""}`}>{selected && <FiCheck size={12} />}</span>
                    {u.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AMENITIES */}
        <div className="filter-menu">
          <button type="button" className={`filter-btn${filter.features.length > 0 || openMenu === "amenities" ? " active" : ""}`} onClick={() => toggleMenu("amenities")}>
            Amenities{filter.features.length > 0 && ` (${filter.features.length})`} <FiChevronDown />
          </button>
          {openMenu === "amenities" && (
            <div className="filter-panel">
              {AMENITIES.map((a) => {
                const selected = filter.features.includes(a);
                return (
                  <button type="button" key={a} className={`filter-option${selected ? " selected" : ""}`} onClick={() => toggleIn("features", a)}>
                    <span className={`filter-tick${selected ? " selected" : ""}`}>{selected && <FiCheck size={12} />}</span>
                    {a}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={() => setFilter(EMPTY_FILTER)}
            className="filter-clear"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Applied filters */}
      {chips.length > 0 && (
        <div className="filter-chips">
          {chips.map((c) => (
            <span
              key={c.id}
              className="filter-chip"
            >
              {c.label}
              <button type="button" onClick={c.remove} aria-label={`Remove ${c.label}`}
                className="filter-chip-x">
                <FiX size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ go, user }) {
  const handleProfileClick = () => go("profile");

  const [posts, setPosts] = useState([]);
  const [iutGate, setIutGate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeId, setActiveId] = useState(null);
  // Single filter state: every click in the FilterBar updates it and the
  // fetch effect below runs automatically (no Apply button needed).
  const [filter, setFilter] = useState(EMPTY_FILTER);

  // Re-run when the logged-in user changes (e.g. right after signup/login)
  const userId = user?._id || user?.id;

  // ── Map pins built straight from Post data (not HomeRegister).
  // Every approved Post carries its own exactLocation plus the pre-computed
  // `distance` block. Posts with no usable coordinates are skipped so a
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
  // convention passes the full post object instead, so Detail.js gets
  // everything it needs without a re-fetch. This wrapper bridges the two.
  const goToDetailById = (page, id) => {
    const fullPost = posts.find((p) => p._id === id);
    go(page, fullPost || id);
  };

  // Single fetch effect: loads /posts/approved when no filter is applied,
  // otherwise calls the combined filter endpoint (price + utilities + amenities).
  useEffect(() => {
    const controller = new AbortController();

    const fetchPosts = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const params = new URLSearchParams();
        if (filter.min !== "") params.set("minRent", filter.min);
        if (filter.max !== "") params.set("maxRent", filter.max);
        if (filter.utilities.length) params.set("utilities", filter.utilities.join(","));
        if (filter.features.length) params.set("features", filter.features.join(","));

        // Router is mounted with: app.use("/api/filterPost", filterPost)
        // and assumed to define router.get("/", filterPosts).
        // If your route is router.get("/filter", ...), use `${API_BASE}/filterPost/filter`.
        const FILTER_URL = `${API_BASE}/filterPost`;
        const url = params.toString()
          ? `${FILTER_URL}?${params}`
          : `${API_BASE}/posts/approved`;

        const res = await fetch(url, { signal: controller.signal });
        const result = await res.json();

        // 404 = filters matched nothing -> show the empty state, not an error box
        if (res.status === 404) {
          setPosts([]);
          return;
        }
        if (res.ok && result.success) {
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
    fetchPosts();
    return () => controller.abort();
  }, [userId, filter]);

  const isFiltered =
    filter.min !== "" || filter.max !== "" ||
    filter.utilities.length > 0 || filter.features.length > 0;

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
        </div>

        {/* ── POSTS + MAP CARD (Airbnb-style split view) ── */}
        <div className="section-header" style={{ marginTop: "3rem" }}>
          <div>
            <div className="section-title">Listing Of Houses</div>
            <div className="section-bar" />
          </div>
          <button className="btn-primary" style={{ padding: ".6rem 1.2rem", fontSize: ".85rem", display: "inline-flex", alignItems: "center", gap: ".4rem" }} onClick={() => go("post")}>
            <FiPlus /> Post a House
          </button>
        </div>

        {/* FILTERS: Price / Utilities / Amenities dropdown lists, apply on click */}
        <FilterBar filter={filter} setFilter={setFilter} />

        {loading ? (
          <EmptyState msg="Loading posts..." />
        ) : posts.length === 0 ? (
          <EmptyState msg={isFiltered ? "No listings match your filters." : "No posts yet. Be the first to post your property!"} />
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
   `isRented` comes from Post.isRented (the real, authoritative field),
   set via the owner's/admin's "Mark as Rented / Available" action on the
   Detail page. */
function HouseCard({ post, onClick }) {
  const houseName = post.registeredHouse?.housePropertyName || "Unnamed Property";
  const image = post.photos?.[0]?.url;
  const isRented = post.isRented || false;

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

/* ── POST CARD ──
   `active` + `onHover`/`onHoverEnd` sync this card's highlight state with
   its pin on the SearchMap (hover a card -> its price pin lifts on the map,
   and vice versa via SearchMap's onActive). */
function PostCard({ post, go, active, onHover, onHoverEnd }) {
  const houseName = post.registeredHouse?.housePropertyName || "Unnamed Property";
  const image = post.photos?.[0]?.url;
  const has24_7 = post.utilities?.includes("24/7 Electricity");
  const isRented = post.isRented || false;
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
          <div className="prop-meta-row">
            <FiUser />{" "}
            {post.postedAs === "student"
              ? `Posted by: ${post.posterName || "Student"}${post.studentDepartment ? ` (${post.studentDepartment})` : ""}`
              : `Posted by: ${post.posterName || post.ownerName || "Homeowner"} (Homeowner)`}
          </div>
          <div className="prop-meta-row"><FiZap /> {has24_7 ? "24/7 Electricity" : "No 24/7 backup"}</div>
          {distanceLabel && (
            <div className="prop-meta-row"><FaPersonWalking /> {distanceLabel}</div>
          )}
        </div>
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