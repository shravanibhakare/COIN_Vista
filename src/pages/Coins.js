import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Coins(){
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load(){
      try{
        const res = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
          params: { vs_currency: "inr", order: "market_cap_desc", per_page: 100, page: 1, sparkline:false }
        });
        if(mounted) setCoins(res.data);
      }catch(e){ console.error(e); }
      finally { if (mounted) setLoading(false); }
    }
    load();
    return ()=> mounted = false;
  }, []);

  if (loading) return <p>Loading coins…</p>;

  return (
    <div>
      <h2 style={{marginBottom:12}}>Top Coins</h2>
      <div className="grid">
        {coins.map(coin => (
          <Link to={`/coin/${coin.id}`} key={coin.id} style={{textDecoration:"none"}}>
            <div className="card">
              <div className="logo">
                <img src={coin.image} alt={coin.name} />
              </div>
              <div className="meta">
                <div className="name">{coin.market_cap_rank}. {coin.name}</div>
                <div className="sub">{coin.symbol.toUpperCase()} • ₹ {coin.current_price.toLocaleString()}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
