import React, { useEffect, useState } from "react";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import InvestmentCalculator from "../components/InvestmentCalculator";
import EducationalWidget from "../components/EducationalWidget";

export default function Home() {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets",
          {
            params: {
              vs_currency: "inr",
              order: "market_cap_desc",
              per_page: 10,
              page: 1,
              sparkline: false,
            },
          }
        );
        if (mounted) setCoins(res.data);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2200,
    responsive: [
      { breakpoint: 900, settings: { slidesToShow: 3 } },
      { breakpoint: 600, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <div className="quote">
          "Start your crypto journey with us — learn, explore, hodl."
        </div>
      </div>

      {/* Carousel Section */}
      <div style={{ marginBottom: 16 }}>
        <Slider {...settings}>
          {coins.map((c) => (
            <div key={c.id} style={{ padding: 10 }}>
              <div className="card" style={{ padding: 18 }}>
                <div className="logo">
                  <img src={c.image} alt={c.name} />
                </div>
                <div className="meta">
                  <div className="name">{c.name}</div>
                  <div className="sub">₹ {c.current_price.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", margin: "40px 0" }}>
        <InvestmentCalculator coins={coins} />
        <EducationalWidget />
      </div>
    </div>
  );
}
