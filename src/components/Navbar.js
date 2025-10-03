import React from "react";
import { Link } from "react-router-dom";

export default function Navbar(){
  return (
    <header className="nav">
      <div className="nav__inner">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div className="brand"><Link to="/">CoinVista</Link></div>
        </div>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/coins">Coins</Link>
          <Link to="/exchanges">Exchanges</Link>
          
        </nav>
      </div>
    </header>
  );
}
