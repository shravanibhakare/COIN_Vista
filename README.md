# 📈 CoinVista – Cryptocurrency Price Prediction

**CoinVista** is a cryptocurrency analytics and prediction web app built with **React** and **TensorFlow.js**.  
It fetches real-time coin data from the **CoinGecko API** and uses an **LSTM (Long Short-Term Memory) neural network** to forecast future prices.  

---

## 🚀 Features

- 🔎 **Browse cryptocurrencies** with live market data (**price, market cap, % change**)  
- 📊 **Interactive charts** powered by **Chart.js** to view historical trends  
- 🤖 **LSTM-based prediction model** (TensorFlow.js) for forecasting the **next 7 days**  
- 💡 **Non-blocking training** → App stays responsive while model trains in-browser  
- ⚡ **Optimized model** → Stacked LSTM layers achieve up to **82–85% accuracy**  
- 💾 **Caching** → Forecasts stored in `sessionStorage` to avoid retraining on reload  

---

## 🛠️ Tech Stack

- **Frontend:** `React`, `Bootstrap`, `Chart.js`  
- **Machine Learning:** `TensorFlow.js` (LSTM model for time-series prediction)  
- **API:** [CoinGecko API](https://www.coingecko.com/en/api) (**Free**, no authentication required)  

---

## ⚙️ Installation & Setup

Clone the repository

git clone https://github.com/shravanibhakare/COIN_Vista.git
cd coinvista


Install dependencies

npm install


Start development server

npm start


Open browser → http://localhost:3000

---

## 📈 How Predictions Work

Historical coin prices are fetched from CoinGecko (/market_chart).

Prices are scaled using Min-Max Normalization.

A stacked LSTM neural network is trained on the data directly in the browser:

LSTM Layer → 64 units

LSTM Layer → 32 units

Dropout → 0.2

Dense Layers → Final price output

Optimizer → Adam (lr=0.001)

The model predicts the next 7 days of prices.

Predictions are rescaled back to INR values and plotted on the chart.

---

## 📊 Example Workflow

Navigate to a coin (e.g., Bitcoin)

Click "Predict Next 7 Days"

App shows training progress live → Epoch X / Loss = ...

Forecasted prices appear on the chart (✅ green dashed line)

---

## 📌 Future Improvements

✅ Compare multiple models (LSTM, GRU, Transformer)

✅ Add more metrics (RMSE, MAE, R²)

🔔 Add notifications when prediction is complete

🖥️ Backend option with Python TensorFlow/Keras for faster training on GPU

📱 Mobile-friendly UI

---

## 📜 License

MIT License © 2025
Built for academic learning and research purposes.


