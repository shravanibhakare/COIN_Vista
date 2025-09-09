import React, { useState, useEffect } from "react";

const InvestmentCalculator = ({ coins }) => {
  const [amount, setAmount] = useState(1000);
  const [coin, setCoin] = useState("");
  const [price, setPrice] = useState(0);
  const [futureValue, setFutureValue] = useState(null);

  // Set default coin & price when coins arrive
  useEffect(() => {
    if (coins.length > 0) {
      setCoin(coins[0].id);
      setPrice(coins[0].current_price);
    }
  }, [coins]);

  // When user changes coin selection, update price too
  const handleCoinChange = (e) => {
    const selectedId = e.target.value;
    setCoin(selectedId);

    const selectedCoin = coins.find((c) => c.id === selectedId);
    if (selectedCoin) {
      setPrice(selectedCoin.current_price);
    }
  };

  const handleCalculate = () => {
    if (!coin || !price) return;

    const coinsBought = amount / price;
    // Assume a 20% growth simulation
    const projectedPrice = price * 1.2;
    setFutureValue(coinsBought * projectedPrice);
  };

  return (
    <div
      style={{
        background: "#111827",
        padding: "20px",
        borderRadius: "10px",
        color: "#fff",
        margin: "20px auto",
        width: "60%",
        textAlign: "center",
      }}
    >
      <h2>💰 Crypto Investment Calculator</h2>
      <p>Estimate how much your investment could be worth!</p>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Enter amount (₹)"
        style={{ padding: "8px", margin: "10px" }}
      />

      <select
        value={coin}
        onChange={handleCoinChange}
        style={{ padding: "8px", margin: "10px" }}
      >
        {coins.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.symbol.toUpperCase()})
          </option>
        ))}
      </select>

      <button
        onClick={handleCalculate}
        style={{
          padding: "10px 20px",
          margin: "10px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Calculate
      </button>

      {futureValue && (
        <div style={{ marginTop: "15px" }}>
          <h3>Projected Value (20% Growth):</h3>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#22c55e",
            }}
          >
            ₹ {futureValue.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestmentCalculator;
