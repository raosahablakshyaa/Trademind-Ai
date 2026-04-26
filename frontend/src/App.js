import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/dashboard/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PredictionPage from "./pages/PredictionPage";
import SignalsPage from "./pages/SignalsPage";
import PatternsPage from "./pages/PatternsPage";
import RiskPage from "./pages/RiskPage";
import JournalPage from "./pages/JournalPage";
import PsychologyPage from "./pages/PsychologyPage";
import StrategyPage from "./pages/StrategyPage";
import MarketPage from "./pages/MarketPage";
import DemoPage from "./pages/DemoPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--bg2)",
            color: "var(--text)",
            border: "1px solid var(--border2)",
            fontSize: "12px",
            borderRadius: "6px",
            padding: "10px 14px",
          },
          success: { iconTheme: { primary: "#26a69a", secondary: "var(--bg2)" } },
          error:   { iconTheme: { primary: "#ef5350", secondary: "var(--bg2)" } },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="prediction" element={<PredictionPage />} />
          <Route path="signals" element={<SignalsPage />} />
          <Route path="patterns" element={<PatternsPage />} />
          <Route path="risk" element={<RiskPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="psychology" element={<PsychologyPage />} />
          <Route path="strategy" element={<StrategyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
