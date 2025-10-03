import React from "react";
import creator from "../assets/creator.jpeg";
export default function Footer(){
  return (
    <footer className="footer">
      <div className="credits">
        <img src={creator} alt="Creator" className="creator-img" />
        <div>
          <div style={{color:"var(--text)", fontWeight:700}}>Start your crypto journey with us 🚀</div>
          <div style={{fontSize:13, color:"var(--muted)"}}>Built by Shravani</div>
        </div>
      </div>

      <div style={{fontSize:13, color:"var(--muted)"}}>
        © {new Date().getFullYear()} CoinVista
      </div>
    </footer>
  );
}
