import React, { useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/themeStore";
import LiveTicker from "./LiveTicker";

const NAV_MAIN = [
  { to: "/app",        label: "Dashboard",   icon: <HomeIcon /> },
  { to: "/app/market", label: "Markets",     icon: <ChartIcon /> },
  { to: "/app/demo",   label: "Paper Trade", icon: <DemoIcon /> },
];
const NAV_TOOLS = [
  { to: "/app/prediction", label: "AI Prediction",   icon: <BrainIcon /> },
  { to: "/app/signals",    label: "Signals",          icon: <SignalIcon /> },
  { to: "/app/patterns",   label: "Patterns",         icon: <CandleIcon /> },
  { to: "/app/risk",       label: "Risk Analyzer",    icon: <ShieldIcon /> },
];
const NAV_EXT = [
  { to: "/app/journal",    label: "Journal",    icon: <BookIcon /> },
  { to: "/app/psychology", label: "Psychology", icon: <MindIcon /> },
  { to: "/app/strategy",   label: "Strategy",   icon: <BarIcon /> },
];

function NavItem({ to, label, icon, collapsed }) {
  return (
    <NavLink
      to={to}
      end={to === "/app"}
      title={collapsed ? label : undefined}
      className="flex items-center gap-2.5 px-3 py-2 text-xs transition-all duration-100"
      style={({ isActive }) => ({
        color: isActive ? "#ffffff" : "#666666",
        background: isActive ? "#1a1a1a" : "transparent",
        borderLeft: isActive ? "2px solid #ffffff" : "2px solid transparent",
        fontWeight: isActive ? 600 : 400,
      })}
      onMouseEnter={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background = "#111111"; e.currentTarget.style.color = "#cccccc"; }}
      onMouseLeave={e => { if (!e.currentTarget.dataset.active) e.currentTarget.style.background = "transparent"; }}
    >
      <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">{icon}</span>
      {!collapsed && <span className="truncate font-medium">{label}</span>}
    </NavLink>
  );
}

export default function Layout() {
  const { user, token, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar — always black ── */}
      <aside
        className={`${collapsed ? "w-[52px]" : "w-[220px]"} flex flex-col shrink-0 transition-all duration-200`}
        style={{ background: "#000000", borderRight: "1px solid #1a1a1a" }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between h-11 px-2 shrink-0"
          style={{ borderBottom: "1px solid #1a1a1a" }}
        >
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 min-w-0 ml-1">
              <div
                className="w-5 h-5 rounded flex items-center justify-center font-black text-[10px] shrink-0"
                style={{ background: "#ffffff", color: "#000000" }}
              >T</div>
              <span className="font-bold text-xs tracking-wide" style={{ color: "#ffffff" }}>TradeMind</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded ml-auto transition-colors hover:bg-white/10"
            style={{ color: "#666666" }}
            title="Toggle sidebar"
          >
            <CollapseIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1">
          {NAV_MAIN.map((i) => <NavItem key={i.to} {...i} collapsed={collapsed} />)}

          <div className="my-1" style={{ borderTop: "1px solid #1a1a1a" }} />
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 pt-3 pb-1" style={{ color: "#444444" }}>
              AI Tools
            </p>
          )}
          {NAV_TOOLS.map((i) => <NavItem key={i.to} {...i} collapsed={collapsed} />)}

          <div className="my-1" style={{ borderTop: "1px solid #1a1a1a" }} />
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 pt-3 pb-1" style={{ color: "#444444" }}>
              Analytics
            </p>
          )}
          {NAV_EXT.map((i) => <NavItem key={i.to} {...i} collapsed={collapsed} />)}
        </nav>

        {/* Bottom */}
        <div className="shrink-0 py-1" style={{ borderTop: "1px solid #1a1a1a" }}>
          {token ? (
            <>
              {!collapsed && (
                <div className="px-3 py-2">
                  <p className="text-[10px]" style={{ color: "#444" }}>Signed in as</p>
                  <p className="text-xs font-semibold truncate" style={{ color: "#ccc" }}>
                    {user?.name?.split("@")[0]}
                  </p>
                </div>
              )}
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-red-500/10"
                style={{ color: "#ef5350" }}
                title="Sign Out"
              >
                <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center"><LogoutIcon /></span>
                {!collapsed && <span className="font-medium">Sign out</span>}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/10"
              style={{ color: "#888", textDecoration: "none" }}
              title="Sign In"
            >
              <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center"><LoginIcon /></span>
              {!collapsed && <span className="font-medium">Sign in</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ── Main — always white ── */}
      <main
        className="flex-1 overflow-y-auto flex flex-col min-w-0"
        style={{
          background: "#ffffff",
          color: "#0a0a0a",
          "--bg":      "#ffffff",
          "--bg2":     "#f7f7f7",
          "--bg3":     "#f0f0f0",
          "--bg4":     "#e8e8e8",
          "--border":  "#e2e2e2",
          "--border2": "#d0d0d0",
          "--text":    "#0a0a0a",
          "--text2":   "#1a1a1a",
          "--muted":   "#6b6b6b",
          "--muted2":  "#9a9a9a",
          "--ticker":  "#f7f7f7",
          "--green":   "#16a34a",
          "--red":     "#dc2626",
          "--accent":  "#0a0a0a",
          "--yellow":  "#ca8a04",
        }}
      >
        <LiveTicker />
        <div className="flex-1 p-4 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* ── Icons ── */
function HomeIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function ChartIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function DemoIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function BrainIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 015 0v.5a2.5 2.5 0 01-5 0V2z"/><path d="M4 8a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8z"/></svg>; }
function SignalIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function CandleIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="8" width="4" height="8"/><rect x="14" y="5" width="4" height="11"/><line x1="8" y1="4" x2="8" y2="8"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="16" y1="2" x2="16" y2="5"/><line x1="16" y1="16" x2="16" y2="20"/></svg>; }
function ShieldIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function BookIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>; }
function MindIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>; }
function BarIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function SunIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function MoonIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function LogoutIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function LoginIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>; }
function CollapseIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
