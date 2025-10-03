import React, { useState, useEffect } from "react";

const facts = [
  "📊 Market Cap = Price × Circulating Supply",
  "💎 HODL = Hold On for Dear Life",
  "⚡ Bitcoin is the first cryptocurrency, created in 2009",
  "🪙 Stablecoins are pegged to fiat like USD or INR",
  "📈 Ethereum introduced smart contracts"
];

const EducationalWidget = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % facts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "#1f2937", padding: "15px", borderRadius: "10px", color: "#fff", margin: "20px auto", width: "60%", textAlign: "center" }}>
      <h2>📖 Did You Know?</h2>
      <p style={{ fontSize: "18px", marginTop: "10px" }}>{facts[index]}</p>
    </div>
  );
};

export default EducationalWidget;
