import Navbar from "../components/Navbar";
import { houses, studentPosts } from "../db";

export default function Dashboard({ go, user }) {
  const handleProfileClick = () => go("profile");

  // Dynamically inject our specific local images into the mock data arrays for rendering
  const mappedHouses = houses.map((house, idx) => {
    const localImages = [
      "/images/spacejoy-nEtpvJjnPVo-unsplash.jpg",
      "/images/minh-pham-OtXADkUh3-I-unsplash.jpg",
      "/images/pexels-leroy-joubert-970853-35831703.jpg",
      "/images/pexels-quang-nguyen-vinh-222549-14021929.jpg"
    ];
    return { ...house, image: localImages[idx % localImages.length] };
  });

  const mappedPosts = studentPosts.map((post, idx) => {
    const localImages = [
      "/images/pexels-leroy-joubert-970853-35831703.jpg",
      "/images/spacejoy-nEtpvJjnPVo-unsplash.jpg"
    ];
    return { ...post, image: localImages[idx % localImages.length] };
  });

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

        {/* ── HOUSE LISTINGS ── */}
        <div className="section-header">
          <div>
            <div className="section-title">Recommended Houses For You</div>
            <div className="section-bar" />
          </div>
        </div>

        <div className="listings-grid">
          {mappedHouses.map(house => (
            <HouseCard key={house.id} house={house} onClick={() => go("detail", house)} />
          ))}
        </div>

        {/* ── STUDENT POSTS ── */}
        <div className="section-header" style={{ marginTop: "3rem" }}>
          <div>
            <div className="section-title">Student Posts</div>
            <div className="section-bar" />
          </div>
          <button className="btn-primary" style={{ padding: ".6rem 1.2rem", fontSize: ".85rem" }} onClick={() => go("post")}>
            + Post a House
          </button>
        </div>

        <div className="listings-grid">
          {mappedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>

      <footer className="footer">
        <h4>KHOJ</h4>
        <p>Connecting IUT students with trusted housing near campus.</p>
        <p style={{ marginTop: ".5rem", fontSize: ".76rem", opacity: 0.6 }}>© 2026 KHOJ. All rights reserved.</p>
      </footer>
    </div>
  );
}

/* ── HOUSE CARD ── */
function HouseCard({ house, onClick }) {
  return (
    <div className="prop-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="prop-card-img" style={{ position: 'relative', overflow: 'hidden' }}>
        <img 
          src={house.image} 
          alt={house.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
        />
        <span className={`prop-status-badge ${house.status === "Available" ? "available" : "rented"}`}>
          {house.status}
        </span>
      </div>

      <div className="prop-card-body">
        <div className="prop-card-name">{house.name}</div>
        <div className="prop-meta">
          <div className="prop-meta-row"><span></span> {house.rent.toLocaleString()} / month</div>
          <div className="prop-meta-row"><span></span> {house.rating} ({house.reviewCount} reviews)</div>
          <div className="prop-meta-row"><span></span> {house.location}</div>
        </div>
        <button className="btn-detail">Get Details</button>
      </div>
    </div>
  );
}

/* ── STUDENT POST CARD ── */
function PostCard({ post }) {
  return (
    <div className="prop-card">
      <div className="prop-card-img" style={{ overflow: 'hidden' }}>
        <img 
          src={post.image} 
          alt={post.houseName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
        />
      </div>
      <div className="prop-card-body">
        <div className="prop-card-name">{post.houseName}</div>
        <div className="prop-meta">
          <div className="prop-meta-row"><span></span> {post.rent.toLocaleString()} / month</div>
          <div className="prop-meta-row"><span></span> Posted by: {post.postedBy}</div>
          <div className="prop-meta-row"><span></span> {post.electricity24_7 ? "24/7 Electricity" : "No 24/7 backup"}</div>
        </div>
        <button className="btn-detail" onClick={() => alert(`House: ${post.houseName}\nRent: ${post.rent}/month\nPosted by: ${post.postedBy}\nGate closes: ${post.gateCloseTime}`)}>
          View Post
        </button>
      </div>
    </div>
  );
}