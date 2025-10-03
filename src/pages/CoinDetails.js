import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import * as tf from "@tensorflow/tfjs";
import { buildModel, makeWindowedDataset, train, forecast } from "../ml/lstm";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

export default function CoinDetails() {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [predicting, setPredicting] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [predictions, setPredictions] = useState([]);
  const horizon = 7;
  const windowSize = 30;

  // Fetch coin details + historical prices (reduced days to keep browser responsive)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [coinRes, chartRes] = await Promise.all([
          axios.get(`https://api.coingecko.com/api/v3/coins/${id}`, {
            params: {
              localization: false,
              tickers: false,
              market_data: true,
              community_data: false,
              developer_data: false,
              sparkline: false
            }
          }),
          // NOTE: days=30 keeps client-side training lighter. Increase with caution.
          axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
            params: { vs_currency: "inr", days: 30 }
          })
        ]);
        if (mounted) {
          setCoin(coinRes.data);
          setPrices(chartRes.data.prices || []);
        }
      } catch (e) {
        console.error("Failed to load coin data:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  const rawSeries = useMemo(() => prices.map(p => p[1]), [prices]);

  const labels = useMemo(() => {
    if (prices.length === 0) return [];
    const past = prices.map(p => new Date(p[0]).toLocaleDateString());
    const lastTs = prices[prices.length - 1][0];
    const future = [];
    for (let i = 1; i <= horizon; i++) {
      const d = new Date(lastTs);
      d.setDate(d.getDate() + i);
      future.push(d.toLocaleDateString());
    }
    return [...past, ...future];
  }, [prices]);

  const historyOnly = rawSeries;
  const historyPadded = [...historyOnly, ...Array(horizon).fill(null)];

  const predictedPadded = useMemo(() => {
    if (predictions.length === 0) return Array(historyOnly.length + horizon).fill(null);
    return [
      ...Array(historyOnly.length - 1).fill(null),
      historyOnly[historyOnly.length - 1],
      ...predictions
    ];
  }, [predictions, historyOnly]);

  // Utility to extract a numeric loss value from callback payloads
  function extractLossFromCallback(logsOrVal) {
    if (logsOrVal == null) return null;
    // If callback provided a number directly
    if (typeof logsOrVal === "number") return logsOrVal;
    // If callback provided an object {loss: 0.01} or history
    if (typeof logsOrVal === "object") {
      if (typeof logsOrVal.loss === "number") return logsOrVal.loss;
      if (logsOrVal.history && Array.isArray(logsOrVal.history.loss)) return logsOrVal.history.loss[0];
    }
    return null;
  }

  // ----- Forecast button handler -----
  async function handlePredict() {
    // simple guard: ensure we have enough data
    if (!rawSeries || rawSeries.length < windowSize + 1) {
      setProgressMsg("Not enough history to train (need more data).");
      return;
    }

    // Prevent double clicks
    if (predicting) return;

    setPredicting(true);
    setProgressMsg("⏳ Preparing training…");

    // Allow the UI to update (so button shows) before heavy work starts
    await new Promise(resolve => setTimeout(resolve, 80));

    try {
      const cacheKey = `pred_${id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setPredictions(parsed);
        setProgressMsg("✅ Loaded cached forecast");
        setPredicting(false);
        return;
      }

      // Build dataset and model
      const { xsT, ysT, min, max, denom } = makeWindowedDataset(rawSeries, windowSize);
      const model = buildModel(windowSize);

      // Provide a flexible onEpoch callback which accepts different payload shapes from train()
      const epochsToRun = 10; // keep small to keep browser responsive; tweak if you need
      await train(
        model,
        xsT,
        ysT,
        epochsToRun,
        (epochIndexOrEpoch, logsOrVal) => {
          // train() may pass either (epoch, logs) or (epoch, loss number) etc.
          // Normalize to readable epoch and loss.
          const epochNum = typeof epochIndexOrEpoch === "number" ? epochIndexOrEpoch : null;
          const lossVal = extractLossFromCallback(logsOrVal);
          // Display 1-based epoch number if available else best-effort
          const epochText = epochNum != null ? `${epochNum + 1}/${epochsToRun}` : `epoch ${epochNum}`;
          setProgressMsg(
            lossVal != null
              ? `Training: ${epochText} (loss=${lossVal.toFixed(6)})`
              : `Training: ${epochText}`
          );
        }
      );

      // Forecast
      const preds = forecast(model, rawSeries, windowSize, min, max, denom, horizon);
      setPredictions(preds);
      sessionStorage.setItem(cacheKey, JSON.stringify(preds));
      setProgressMsg("✅ Forecast complete");

      // Clean up tensors + model
      try {
        // dispose tensors and model if train returned tensors; safe-call
        xsT?.dispose && xsT.dispose();
        ysT?.dispose && ysT.dispose();
        if (model && typeof model.dispose === "function") model.dispose();
        // additionally clear backend tensors
        await tf.nextFrame();
        tf.engine().startScope && tf.engine().startScope(); // no-op safe
      } catch (cleanupErr) {
        // ignore, but log
        console.warn("TF cleanup warning:", cleanupErr);
      }
    } catch (err) {
      console.error("Forecast error:", err);
      setProgressMsg("❌ Error during training (see console)");
    } finally {
      setPredicting(false);
    }
  }

  // ----- UI rendering -----
  if (loading) return <p>Loading coin details…</p>;
  if (!coin) return <p>Coin not found.</p>;

  const data = {
    labels,
    datasets: [
      {
        label: `${coin.name} price (INR)`,
        data: historyPadded,
        borderColor: "#ffffff",
        backgroundColor: "rgba(255,255,255,0.2)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25
      },
      {
        label: "LSTM Forecast (next 7 days)",
        data: predictedPadded,
        borderColor: "#22c55e",
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: "#ffffff" } },
      title: { display: true, text: `${coin.name} Price Trend + Forecast`, color: "#ffffff" },
      tooltip: { mode: "index", intersect: false }
    },
    scales: {
      x: { ticks: { color: "#ffffff" }, grid: { color: "rgba(255,255,255,0.1)" } },
      y: { ticks: { color: "#ffffff" }, grid: { color: "rgba(255,255,255,0.1)" } }
    },
    interaction: { mode: "index", intersect: false }
  };

  return (
    <div>
      {/* --- Coin header --- */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
        <img src={coin.image.large} alt={coin.name} width="64" />
        <div>
          <h1 style={{ margin: 0 }}>
            {coin.name} <span style={{ fontSize: 14, color: "var(--muted)" }}>#{coin.market_cap_rank}</span>
          </h1>
          <div style={{ color: "var(--muted)" }}>{coin.symbol.toUpperCase()}</div>
        </div>
      </div>

      {/* --- Key stats --- */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
        <div className="card" style={{ padding: 12, minWidth: 220 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Current Price</div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>₹ {coin.market_data.current_price.inr.toLocaleString()}</div>
          <div style={{ color: coin.market_data.price_change_percentage_24h >= 0 ? "#34d399" : "#fb7185" }}>
            {coin.market_data.price_change_percentage_24h?.toFixed(2)}%
          </div>
        </div>

        <div className="card" style={{ padding: 12, minWidth: 220 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Market Cap</div>
          <div style={{ fontWeight: 700 }}>₹ {coin.market_data.market_cap.inr.toLocaleString()}</div>
        </div>
      </div>

      {/* --- Chart --- */}
      <div style={{ background: "#1f2937", padding: 12, borderRadius: 12, marginBottom: 12 }}>
        <Line data={data} options={options} />
      </div>

      {/* --- Prediction Button --- */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        <button
          onClick={handlePredict}
          disabled={predicting}
          style={{
            padding: "10px 16px",
            background: predicting ? "#6ee7b7" : "#22c55e",
            border: "none",
            borderRadius: 8,
            color: "#0b1020",
            fontWeight: 700,
            cursor: predicting ? "not-allowed" : "pointer"
          }}
        >
          {predicting ? "⏳ Training model..." : "Predict next 7 days (βeta)"}
        </button>

        {/* Progress / status message */}
        {progressMsg && <span style={{ color: "var(--muted)" }}>{progressMsg}</span>}
      </div>

      {/* --- About --- */}
      <div style={{ marginTop: 18 }}>
        <h3>About</h3>
        <div style={{ color: "var(--muted)" }} dangerouslySetInnerHTML={{ __html: coin.description.en || "<i>No description</i>" }} />
      </div>

      {/* --- Back Link --- */}
      <div style={{ marginTop: 18 }}>
        <Link to="/coins" style={{ textDecoration: "none", color: "var(--accent)", fontWeight: 700 }}>
          ← Back to coins
        </Link>
      </div>
    </div>
  );
}
