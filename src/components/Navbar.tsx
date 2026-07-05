// src/components/Navbar.tsx
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(0,217,163,0.4); }
          50% { box-shadow: 0 0 18px 6px rgba(0,217,163,0.8); }
        }
        .brand-gradient {
          background: linear-gradient(135deg, #00d9a3 0%, #6c5ce7 50%, #f5b700 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .nav-link {
          color: #8892b0;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: color 200ms ease;
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #00d9a3, #6c5ce7);
          transition: width 300ms ease;
        }
        .nav-link:hover {
          color: #eef1fb;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .live-dot {
          animation: glow-pulse 1.5s ease-in-out infinite;
          background: #00d9a3;
          border-radius: 50%;
          width: 8px;
          height: 8px;
        }
        .navbar-glass {
          background: rgba(11,15,23,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(35,44,71,0.8);
        }
        .pro-badge {
          background: linear-gradient(135deg, #f5b700, #ffd76a);
          color: #0b0f17;
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .cta-btn {
          background: linear-gradient(135deg, #00d9a3, #00b894);
          color: #0b0f17;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 200ms ease;
          box-shadow: 0 0 0px rgba(0,217,163,0);
          letter-spacing: 0.03em;
        }
        .cta-btn:hover {
          box-shadow: 0 0 20px 4px rgba(0,217,163,0.35);
          transform: translateY(-1px);
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #8892b0;
          margin: 5px 0;
          transition: all 200ms;
          border-radius: 2px;
        }
      `}</style>

      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50">
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
            
            {/* Logo */}
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: "linear-gradient(135deg, #00d9a3 0%, #6c5ce7 100%)",
                borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 16px rgba(0,217,163,0.3)",
                flexShrink: 0
              }}>
                <span style={{ fontSize: "18px" }}>🏏</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span className="brand-gradient" style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  CricZoo
                </span>
                <span style={{ fontSize: "0.55rem", color: "#545e7d", letterSpacing: "0.15em", fontWeight: 600, textTransform: "uppercase", marginTop: "1px" }}>
                  LIVE CRICKET
                </span>
              </div>
              <span className="pro-badge">PRO</span>
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }} className="desktop-nav">
              <Link to="/" className="nav-link" style={{ textDecoration: "none" }}>Home</Link>
              <a href="#live" className="nav-link" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="live-dot"></span>
                Live
              </a>
              <a href="#upcoming" className="nav-link" style={{ textDecoration: "none" }}>Upcoming</a>
              <a href="#results" className="nav-link" style={{ textDecoration: "none" }}>Results</a>
              <a href="#rankings" className="nav-link" style={{ textDecoration: "none" }}>Rankings</a>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 200ms"
              }}>
                <span style={{ fontSize: "14px" }}>🔔</span>
                <span style={{ width: "6px", height: "6px", background: "#f5b700", borderRadius: "50%", boxShadow: "0 0 6px #f5b700" }}></span>
              </div>
              <button className="cta-btn">Go Pro</button>
              
              {/* Mobile hamburger */}
              <button
                className="hamburger"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "none" }}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{
            background: "rgba(14,20,36,0.98)",
            borderTop: "1px solid rgba(35,44,71,0.6)",
            padding: "16px 24px",
            display: "flex", flexDirection: "column", gap: "16px"
          }}>
            {["Home", "Live", "Upcoming", "Results", "Rankings"].map(item => (
              <Link
                key={item}
                to={item === "Home" ? "/" : `#${item.toLowerCase()}`}
                style={{ color: "#8892b0", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </>
  );
}
