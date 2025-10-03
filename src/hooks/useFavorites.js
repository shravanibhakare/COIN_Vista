import { useEffect, useState } from "react";

export default function useFavorites(){
  const [favs, setFavs] = useState(()=> {
    try { return JSON.parse(localStorage.getItem("favs")||"[]"); } catch { return []; }
  });

  useEffect(()=> localStorage.setItem("favs", JSON.stringify(favs)), [favs]);

  function toggle(id){
    setFavs(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }
  function has(id){ return favs.includes(id); }

  return { favs, toggle, has };
}
