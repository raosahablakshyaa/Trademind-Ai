import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMsg } from "../utils/api";
import useAuthStore from "../store/authStore";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
      } else {
        const fd = new FormData();
        fd.append("username", form.email);
        fd.append("password", form.password);
        res = await api.post("/auth/login", fd);
      }
      login(res.data.access_token, { name: res.data.name || form.email });
      toast.success(`Welcome back, ${res.data.name || "trader"}!`);
      navigate("/app");
    } catch (err) {
      toast.error(getErrorMsg(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#fafafa" }}
    >
      <div className="w-full max-w-sm animate-slideUp">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" style={{ textDecoration: "none" }}>
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white font-black text-xl mx-auto mb-4">T</div>
            <h1 className="text-xl font-bold" style={{ color: "#0a0a0a" }}>TradeMind</h1>
            <p className="text-sm mt-1" style={{ color: "#9a9a9a" }}>
              {isRegister ? "Create your free account" : "Welcome back"}
            </p>
          </Link>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          {/* Tab */}
          <div
            className="flex rounded-lg p-1 mb-6"
            style={{ background: "#f0f0f0" }}
          >
            {["Sign in", "Register"].map((label, i) => (
              <button
                key={label}
                onClick={() => setIsRegister(i === 1)}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
                style={
                  isRegister === (i === 1)
                    ? { background: "#0a0a0a", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
                    : { color: "#6b6b6b", background: "transparent" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>
                  Full name
                </label>
                <input
                  className="input"
                  placeholder="Alex Johnson"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>
                Email address
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoFocus={!isRegister}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#1a1a1a" }}>
                Password
              </label>
              <div className="relative">
                <input
                  className="input"
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "#9a9a9a" }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center"
              style={{ padding: "11px", fontSize: "14px", marginTop: "4px" }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? "Creating account…" : "Signing in…"}
                </span>
              ) : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "#e8e8e8" }} />
            <span className="text-xs" style={{ color: "#9a9a9a" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#e8e8e8" }} />
          </div>

          <Link
            to="/app"
            className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: "#f7f7f7", color: "#6b6b6b", border: "1px solid #e2e2e2", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "#f7f7f7"}
          >
            Continue without account →
          </Link>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#9a9a9a" }}>
          For educational purposes only · Not financial advice
        </p>
      </div>
    </div>
  );
}
