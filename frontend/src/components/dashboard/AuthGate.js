import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { getErrorMsg } from "../../utils/api";
import useAuthStore from "../../store/authStore";

export default function AuthGate({ feature }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await api.post("/auth/register", form);
      } else {
        const fd = new FormData();
        fd.append("username", form.email);
        fd.append("password", form.password);
        res = await api.post("/auth/login", fd);
      }
      login(res.data.access_token, { name: res.data.name });
      toast.success(`Welcome, ${res.data.name}!`);
      navigate(0);
    } catch (err) {
      toast.error(getErrorMsg(err, "Authentication failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold t1">{feature}</h2>
          <p className="muted text-sm mt-1">Sign in or create a free account to continue</p>
        </div>

        <div className="card">
          <div className="flex rounded-xl p-1 mb-4" style={{ background: "var(--bg3)" }}>
            {["Sign In", "Register"].map((label, i) => (
              <button key={label} onClick={() => setIsRegister(i === 1)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isRegister === (i === 1) ? "bg-accent text-white" : "muted hover:t1"
                }`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <input className="input" placeholder="Full Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} required />
            )}
            <input className="input" type="email" placeholder="Email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input className="input" type="password" placeholder="Password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Please wait…" : isRegister ? "Create Free Account" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
