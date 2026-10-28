import { useState, useEffect, Fragment } from "react";
import Navbar from "../components/Navbar";

const HEADLINES = [
  ["Welcome to the KHOJ", "Near Affordable Yours"],
  ["Need a roommate?", "Post it on KHOJ ","find your match"],
  ["Sign in to KHOJ and find the", "best room near your campus"],
];

const HEADLINE_TIME = 8000; // ms before switching to the next headline
const WORD_DELAY = 0.7;    // seconds between each word appearing

export default function Home({ go }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % HEADLINES.length);
    }, HEADLINE_TIME);
    return () => clearInterval(timer);
  }, []);

  let wordCount = 0; // used to stagger each word

  return (
    <div className="page">
      <style>{`
        .hero-headline {
          min-height: 2.4em;
          animation: headlineFade 0.6s ease;
        }
        @keyframes headlineFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* word wrapper: only fades in, inherits all text styling */
        .hero-headline .hw {
          font: inherit;
          color: inherit;
          opacity: 0;
          animation: wordIn 0.4s ease forwards;
        }
        @keyframes wordIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <Navbar page="home" go={go} />

      <div style={{ flex: 1 }}>
        {/* HERO */}
        <section className="hero">
          <span className="eyebrow">Student Housing Platform</span>
          <h1 key={index} className="hero-headline">
            {HEADLINES[index].map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {line.split(" ").map((word, wi) => (
                  <Fragment key={wi}>
                    <b
                      className="hw"
                      style={{ animationDelay: `${wordCount++ * WORD_DELAY}s` }}
                    >
                      {word === "KHOJ" ? <span>KHOJ</span> : word}
                    </b>{" "}
                  </Fragment>
                ))}
              </Fragment>
            ))}
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
              <h3>Do you own a house in BoardBazar?</h3>
              <p>Share your house with the IUT students</p>
              <button className="btn-link" onClick={() => go("home-register")}>
                Home Register →
              </button>
            </div>

            <div className="card">
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
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h4>KHOJ</h4>
          <p>Connecting IUT students with trusted housing near campus.</p>
          <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--gray-mid)", fontSize: ".8rem", color: "var(--gray-text)" }}>
            <span>© {new Date().getFullYear()} KHOJ. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}