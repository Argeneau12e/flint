"use client";

import { useEffect, useState } from "react";

export default function AnimatedBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div className="absolute w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(255,107,43,0.4) 0%, transparent 70%)",
          filter: "blur(100px)",
          left: `${mousePos.x - 300}px`,
          top: `${mousePos.y - 300}px`,
          transition: "all 0.5s ease-out",
          pointerEvents: "none",
        }} />
      <div className="absolute w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(74,222,128,0.3) 0%, transparent 70%)",
          filter: "blur(80px)",
          right: "10%", top: "20%",
          pointerEvents: "none",
        }} />
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(136,136,255,0.2) 0%, transparent 70%)",
          filter: "blur(90px)",
          left: "20%", bottom: "10%",
          pointerEvents: "none",
        }} />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }} />
    </>
  );
}