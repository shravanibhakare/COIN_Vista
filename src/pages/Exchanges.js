import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Exchanges(){
  const [ex, setEx] = useState([]);
  useEffect(()=>{
    let mounted = true;
    async function load(){
      try{
        const res = await axios.get("https://api.coingecko.com/api/v3/exchanges", { params: { per_page: 100, page: 1 } });
        if(mounted) setEx(res.data);
      }catch(e){ console.error(e); }
    }
    load();
    return ()=> mounted = false;
  }, []);

  return (
    <div>
      <h2 style={{marginBottom:12}}>Exchanges</h2>
      <div className="grid">
        {ex.map(e => (
          <a key={e.id} href={e.url} target="_blank" rel="noreferrer" className="card">
            <div className="logo"><img src={e.image} alt={e.name} /></div>
            <div className="meta">
              <div className="name">{e.trust_score_rank || "–"}. {e.name}</div>
              <div className="sub">{e.country || "—"}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}