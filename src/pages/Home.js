import Navbar from "../components/Navbar";

export default function Home({ go }) {
  return (
    <div className="page">
      <Navbar page="home" go={go} />

      <div style={{ flex: 1 }}>
        {/* HERO */}
        <section className="hero">
          <span className="eyebrow">Student Housing Platform</span>
          <h1>
            Welcome to the <span>KHOJ</span><br />
            Near Affordable Yours
          </h1>
          <p>
            Find the perfect house near IUT.
          </p>
          <button className="btn-primary" onClick={() => go("login")}>
            Explore Now →
          </button>
        </section>

        {/* CARDS */}
        <section className="cards-section">
          <div className="cards-grid">
            <div className="card">
              {/* <div className="card-icon"></div> */}
              <h3>Are you new here?</h3>
              <p>
                Rent a house by just a few taps. Create an account and start
                browsing affordable rooms near IUT.
              </p>
              <button className="btn-link" onClick={() => go("signup")}>
                Create an account →
              </button>
            </div>

            <div className="card">
              {/* <div className="card-icon"></div> */}
              <h3>Do you own a house in BoardBazar?</h3>
              <p>Share your house with the IUT students</p>
              <button className="btn-link" onClick={() => go("home-register")}>
                Home Register →
              </button>
            </div>

            <div className="card">
              {/* <div className="card-icon"></div> */}
              <h3>Already have an account?</h3>
              <p>
                Log in to your account to see what's happening
              </p>
              <button className="btn-link" onClick={() => go("login")}>
                Login →
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer className="footer">
        <h4>About KHOJ</h4>
        <p>Will be updated later.</p>
        <p style={{ marginTop: ".6rem", fontSize: ".78rem", opacity: .6 }}>
          © 2026 KHOJ.
        </p>
      </footer>
    </div>
  );
}
