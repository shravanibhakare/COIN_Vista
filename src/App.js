import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Coins from "./pages/Coins";
import CoinDetails from "./pages/CoinDetails";
import Exchanges from "./pages/Exchanges";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/coins" element={<Coins />} />
          <Route path="/coin/:id" element={<CoinDetails />} />
          <Route path="/exchanges" element={<Exchanges />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
