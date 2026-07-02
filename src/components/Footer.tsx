"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Trajectory {
  xs: number[];
  ys: number[];
  opacities: number[];
  times: number[];
  scaleXs: number[];
  scaleYs: number[];
}

function getBallTrajectory(loopIndex: number): Trajectory {
  const P_start = { x: 73, y: 52 };
  const P_toss = { x: 70, y: 15 };
  const P_contact = { x: 84.7, y: 66.3 };

  // Deterministic patterns for 4 different loops:
  const patternIndex = loopIndex % 4;
  
  let bounceX1 = 200;
  let apexY = 40;
  let wallY = 55;
  let bounceX2 = 265;
  let apexX = 245;

  if (patternIndex === 0) {
    // Loop 0: high lob
    bounceX1 = 210;
    apexY = 25;
    wallY = 45;
    bounceX2 = 255;
    apexX = 250;
  } else if (patternIndex === 1) {
    // Loop 1: short & low flat drive
    bounceX1 = 180;
    apexY = 60;
    wallY = 68;
    bounceX2 = 240;
    apexX = 210;
  } else if (patternIndex === 2) {
    // Loop 2: medium standard lob
    bounceX1 = 230;
    apexY = 35;
    wallY = 50;
    bounceX2 = 275;
    apexX = 260;
  } else {
    // Loop 3: deep drop shot
    bounceX1 = 195;
    apexY = 48;
    wallY = 60;
    bounceX2 = 250;
    apexX = 225;
  }

  const xs: number[] = [];
  const ys: number[] = [];
  const opacities: number[] = [];
  const times: number[] = [];
  const scaleXs: number[] = [];
  const scaleYs: number[] = [];

  const addSegment = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t0: number,
    t1: number,
    samples: number,
    easing: "easeIn" | "easeOut" | "linear",
    optStart: number,
    optEnd: number,
    sXStart: number,
    sXEnd: number,
    sYStart: number,
    sYEnd: number,
    bounceEndScale?: [number, number]
  ) => {
    for (let i = 0; i < samples; i++) {
      let t = i / (samples - 1);
      let easedT = t;
      if (easing === "easeIn") {
        easedT = t * t;
      } else if (easing === "easeOut") {
        easedT = 1 - (1 - t) * (1 - t);
      }
      
      const mt = 1 - easedT;
      const x = mt * mt * p0.x + 2 * mt * easedT * p1.x + easedT * easedT * p2.x;
      const y = mt * mt * p0.y + 2 * mt * easedT * p1.y + easedT * easedT * p2.y;
      
      const time = t0 + t * (t1 - t0);
      const opacity = optStart + t * (optEnd - optStart);
      
      let sX = sXStart + t * (sXEnd - sXStart);
      let sY = sYStart + t * (sYEnd - sYStart);
      
      if (i === samples - 1 && bounceEndScale) {
        sX = bounceEndScale[0];
        sY = bounceEndScale[1];
      }
      
      xs.push(x);
      ys.push(y);
      opacities.push(opacity);
      times.push(time);
      scaleXs.push(sX);
      scaleYs.push(sY);
    }
  };

  // 1. Idle (0.0 to 0.25)
  const idleSamples = 10;
  for (let i = 0; i < idleSamples; i++) {
    xs.push(P_start.x);
    ys.push(P_start.y);
    opacities.push(1.0);
    times.push(0.0 + (i / (idleSamples - 1)) * 0.25);
    scaleXs.push(1.0);
    scaleYs.push(1.0);
  }

  // 2. Toss up (0.25 to 0.38)
  addSegment(P_start, { x: 72, y: 30 }, P_toss, 0.25, 0.38, 12, "easeOut", 1.0, 1.0, 0.95, 1.0, 1.05, 1.0);

  // 3. Fall to contact (0.38 to 0.50)
  addSegment(P_toss, { x: 70, y: 45 }, P_contact, 0.38, 0.50, 12, "easeIn", 1.0, 1.0, 1.0, 0.9, 1.0, 1.1, [0.75, 1.25]);

  // 4. Hit to Net (0.50 to 0.58)
  const P_net = { x: 160, y: 70 + (loopIndex % 3) * 2 };
  addSegment(P_contact, { x: 122, y: 64 }, P_net, 0.50, 0.58, 10, "easeOut", 1.0, 1.0, 1.3, 1.0, 0.75, 1.0);

  // 5. Net to Floor (0.58 to 0.66)
  addSegment(P_net, { x: 185, y: 80 }, { x: bounceX1, y: 80 }, 0.58, 0.66, 10, "easeIn", 1.0, 1.0, 1.0, 1.15, 1.0, 0.85, [1.4, 0.6]);

  // 6. Floor to Apex (0.66 to 0.74)
  addSegment({ x: bounceX1, y: 80 }, { x: bounceX1 + 20, y: apexY + 10 }, { x: apexX, y: apexY }, 0.66, 0.74, 10, "easeOut", 1.0, 1.0, 1.2, 1.0, 0.8, 1.0);

  // 7. Apex to Wall (0.74 to 0.82)
  addSegment({ x: apexX, y: apexY }, { x: 295 - 20, y: wallY - 10 }, { x: 295, y: wallY }, 0.74, 0.82, 10, "easeIn", 1.0, 1.0, 1.0, 1.2, 1.0, 0.8, [0.6, 1.4]);

  // 8. Wall to Floor 2 (0.82 to 0.90)
  addSegment({ x: 295, y: wallY }, { x: 280, y: 80 }, { x: bounceX2, y: 80 }, 0.82, 0.90, 10, "easeIn", 1.0, 1.0, 1.2, 1.15, 0.8, 0.85, [1.25, 0.75]);

  // 9. Roll & Fade (0.90 to 1.0)
  addSegment({ x: bounceX2, y: 80 }, { x: bounceX2 + 8, y: 80 }, { x: bounceX2 + 15, y: 80 }, 0.90, 1.0, 10, "linear", 1.0, 0.0, 1.0, 1.0, 1.0, 1.0);

  return { xs, ys, opacities, times, scaleXs, scaleYs };
}

function shiftTrajectory(trajectory: Trajectory, shiftAmount: number, opacityMultiplier: number, scaleMultiplier: number) {
  const { xs, ys, opacities, times, scaleXs, scaleYs } = trajectory;
  const len = xs.length;
  const shiftedXs = new Array(len);
  const shiftedYs = new Array(len);
  const shiftedOpacities = new Array(len);
  const shiftedScaleXs = new Array(len);
  const shiftedScaleYs = new Array(len);

  for (let i = 0; i < len; i++) {
    const srcIdx = Math.max(0, i - shiftAmount);
    shiftedXs[i] = xs[srcIdx];
    shiftedYs[i] = ys[srcIdx];
    
    const time = times[i];
    if (time < 0.25) {
      shiftedOpacities[i] = 0;
    } else {
      shiftedOpacities[i] = opacities[srcIdx] * opacityMultiplier;
    }
    
    shiftedScaleXs[i] = scaleXs[srcIdx] * scaleMultiplier;
    shiftedScaleYs[i] = scaleYs[srcIdx] * scaleMultiplier;
  }

  return {
    xs: shiftedXs,
    ys: shiftedYs,
    opacities: shiftedOpacities,
    scaleXs: shiftedScaleXs,
    scaleYs: shiftedScaleYs,
  };
}

export default function Footer() {
  const [isHovered, setIsHovered] = useState(false);
  const [loopIndex, setLoopIndex] = useState(0);
  const duration = isHovered ? 4.5 : 6;

  const trajectory = getBallTrajectory(loopIndex);
  const trail1 = shiftTrajectory(trajectory, 2, 0.45, 0.8);
  const trail2 = shiftTrajectory(trajectory, 4, 0.22, 0.6);
  const trail3 = shiftTrajectory(trajectory, 6, 0.08, 0.45);

  const serviceTimes = [0, 0.25, 0.38, 0.45, 0.50, 0.65, 0.85, 1.0];
  const shoulderRotations = [0, 0, -35, -65, 35, 75, 0, 0];
  const elbowRotations = [15, 15, 35, 50, 0, 45, 15, 15];
  const balanceShoulderRotations = [0, 0, -40, -85, 45, 55, 0, 0];
  const balanceElbowRotations = [0, 0, -15, -10, 30, 15, 0, 0];

  const frontLegPaths = [
    "M64.5 53.5 L71.5 68 L79 80 L85 80",
    "M64.5 53.5 L71.5 68 L79 80 L85 80",
    "M62.5 54.5 L69.5 69 L77 80 L83 80",
    "M61.5 55.5 L68.0 69.5 L76 80 L82 80",
    "M66.5 51.5 L73.5 67 L81 80 L87 80",
    "M68.5 53.5 L75.5 69 L81 80 L87 80",
    "M64.5 53.5 L71.5 68 L79 80 L85 80",
    "M64.5 53.5 L71.5 68 L79 80 L85 80"
  ];

  const backLegPaths = [
    "M58.5 52 L50.5 66 L46 80 L40 80",
    "M58.5 52 L50.5 66 L46 80 L40 80",
    "M56.5 53 L48.5 67 L44 80 L38 80",
    "M55.5 54 L47.5 68 L44 80 L38 80",
    "M60.5 50 L52.5 64 L48 80 L42 80",
    "M62.5 52 L54.5 66 L49 80 L43 80",
    "M58.5 52 L50.5 66 L46 80 L40 80",
    "M58.5 52 L50.5 66 L46 80 L40 80"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoopIndex((prev) => (prev + 1) % 4);
    }, duration * 1000);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <footer className="bg-[#080808] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D7FF3F]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 items-start mb-20">
          
          {/* LEFT SECTION: Brand identity */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="font-black text-3xl tracking-tighter text-white uppercase">
                PADEL<span className="text-[#D7FF3F]">GO</span>
              </span>
              <span className="text-[#D7FF3F] text-[10px] font-bold uppercase tracking-[0.4em]">
                Play Smarter. Book Faster.
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px] font-medium">
              The premier padel experience designed for modern athletes. Elevating the game through technology and community.
            </p>
          </div>

          {/* CENTER SECTION: Symbol & Navigation */}
          <div className="flex flex-col items-center gap-10">
            {/* Premium Animated Mascot Symbol */}
            <div 
              className="relative group cursor-default select-none w-full flex justify-center"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Luxury sports ambient glow behind the card */}
              <div className="absolute inset-0 bg-[#D7FF3F]/5 blur-3xl rounded-full opacity-40 group-hover:opacity-100 group-hover:bg-[#D7FF3F]/12 transition-all duration-1000 pointer-events-none"></div>
              
              <motion.div 
                className="w-full sm:w-[92%] md:w-[650px] lg:w-[700px] h-[130px] sm:h-[165px] md:h-[200px] rounded-[16px] md:rounded-[24px] border border-white/5 flex items-center justify-center bg-white/[0.01] backdrop-blur-xl relative overflow-hidden group-hover:border-[#D7FF3F]/20 transition-all duration-700 shadow-2xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {/* Subtle internal gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D7FF3F]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Clean geometric mascot SVG */}
                <svg
                  key={loopIndex}
                  width="100%"
                  height="100%"
                  viewBox="0 0 320 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="relative z-10 w-full h-full"
                >
                  <defs>
                    {/* Glow filter for neon elements */}
                    <filter id="ball-glow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="1.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    
                    {/* Court lines grid pattern */}
                    <pattern id="court-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="white" strokeWidth="0.5" opacity="0.04" />
                    </pattern>

                    {/* Reflection vertical fade mask */}
                    <linearGradient id="reflection-fade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="white" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="white" stopOpacity="0.0" />
                    </linearGradient>
                    <mask id="reflection-mask">
                      <rect x="0" y="80" width="320" height="20" fill="url(#reflection-fade)" />
                    </mask>
                  </defs>

                  {/* Low opacity high-tech grid background */}
                  <rect width="320" height="100" fill="url(#court-grid)" />

                  {/* Faint court lines to ground the scene */}
                  <line x1="15" y1="80" x2="305" y2="80" stroke="white" strokeWidth="1.2" opacity="0.12" strokeLinecap="round" />
                  
                  {/* Service box ticks */}
                  <line x1="25" y1="80" x2="25" y2="84" stroke="white" strokeWidth="1" opacity="0.15" />
                  <line x1="85" y1="80" x2="85" y2="84" stroke="white" strokeWidth="1" opacity="0.15" />
                  <line x1="235" y1="80" x2="235" y2="84" stroke="white" strokeWidth="1" opacity="0.15" />
                  <line x1="295" y1="80" x2="295" y2="84" stroke="white" strokeWidth="1" opacity="0.15" />

                  {/* Net setup */}
                  <rect x="158" y="65" width="4" height="15" fill="white" opacity="0.08" />
                  <line x1="160" y1="80" x2="160" y2="65" stroke="white" strokeWidth="1.2" opacity="0.2" />
                  <line x1="157" y1="65" x2="163" y2="65" stroke="white" strokeWidth="1.5" opacity="0.4" />

                  {/* Faded Floor Reflection of the player */}
                  <use href="#player-mascot" transform="translate(0, 160) scale(1, -1)" mask="url(#reflection-mask)" opacity="0.15" />

                  {/* PLAYER SILHOUETTE COMPONENT GROUP */}
                  <g id="player-mascot">
                    {/* Back Leg (Far side) */}
                    <motion.path 
                      d={backLegPaths[0]}
                      animate={{ d: backLegPaths }}
                      transition={{
                        repeat: Infinity,
                        duration: duration,
                        ease: "easeInOut",
                        times: serviceTimes
                      }}
                      stroke="white" 
                      strokeWidth="3.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      opacity="0.3" 
                    />

                    {/* Balance Arm (Left arm) - points forward for ball toss and balance */}
                    <motion.g 
                      transformOrigin="68px 35px" 
                      animate={{ 
                        rotation: balanceShoulderRotations 
                      }} 
                      transition={{ 
                        repeat: Infinity, 
                        duration: duration, 
                        ease: "easeInOut", 
                        times: serviceTimes
                      }}
                    >
                      {/* Upper Balance Arm */}
                      <line x1="68" y1="35" x2="78" y2="41" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.45" />
                      
                      {/* Lower Balance Arm (Elbow jointed) */}
                      <motion.g
                        transformOrigin="78px 41px"
                        animate={{
                          rotation: balanceElbowRotations
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: duration,
                          ease: "easeInOut",
                          times: serviceTimes
                        }}
                      >
                        <line x1="78" y1="41" x2="86" y2="37" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.45" />
                      </motion.g>
                    </motion.g>

                    {/* Front Leg (Near side) */}
                    <motion.path 
                      d={frontLegPaths[0]}
                      animate={{ d: frontLegPaths }}
                      transition={{
                        repeat: Infinity,
                        duration: duration,
                        ease: "easeInOut",
                        times: serviceTimes
                      }}
                      stroke="white" 
                      strokeWidth="3.8" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      opacity="0.85" 
                    />

                    {/* Torso / Body - sways backward and forward with swing */}
                    <motion.path 
                      d="M68 34.5 L64.5 53.5 L58.5 52 L63.5 35 Z" 
                      fill="white" 
                      opacity="0.8"
                      transformOrigin="61.5px 52.75px"
                      animate={{
                        x: [0, 0, -2, -3, 2, 4, 0, 0],
                        y: [0, 0, -1, 1, -1, 1, 0, 0],
                        rotate: [0, 0, -8, -12, 10, 15, 0, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: duration,
                        ease: "easeInOut",
                        times: serviceTimes
                      }}
                    />

                    {/* Neck */}
                    <motion.line 
                      x1="67.5" 
                      y1="29.5" 
                      x2="66.5" 
                      y2="34.5" 
                      stroke="white" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      animate={{
                        x1: [67.5, 67.5, 65.5, 64.5, 69.5, 71.5, 67.5, 67.5],
                        x2: [66.5, 66.5, 64.5, 63.5, 68.5, 70.5, 66.5, 66.5],
                        y1: [29.5, 29.5, 28.5, 30.5, 28.5, 30.5, 29.5, 29.5],
                        y2: [34.5, 34.5, 33.5, 35.5, 33.5, 35.5, 34.5, 34.5]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: duration,
                        ease: "easeInOut",
                        times: serviceTimes
                      }}
                    />

                    {/* Head */}
                    <motion.circle 
                      cx="68" 
                      cy="28" 
                      r="4.2" 
                      fill="white" 
                      transformOrigin="68px 34px"
                      animate={{
                        x: [0, 0, -2, -3, 2, 4, 0, 0],
                        y: [0, 0, -1, 1, -1, 1, 0, 0],
                        rotate: [0, 0, -15, -10, 15, 10, 0, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: duration,
                        ease: "easeInOut",
                        times: serviceTimes
                      }}
                    />

                    {/* Racket Arm Group (Right arm + underhand racket swing with elbow joint) */}
                    <motion.g 
                      transformOrigin="63.5px 36px" 
                      animate={{ 
                        rotation: shoulderRotations 
                      }} 
                      transition={{ 
                        repeat: Infinity, 
                        duration: duration, 
                        ease: "easeInOut", 
                        times: serviceTimes
                      }}
                    >
                      {/* Upper Arm */}
                      <line x1="63.5" y1="36" x2="63.5" y2="48" stroke="white" strokeWidth="4" strokeLinecap="round" />
                      
                      {/* Elbow jointed Forearm & Racket */}
                      <motion.g
                        transformOrigin="63.5px 48px"
                        animate={{
                          rotation: elbowRotations
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: duration,
                          ease: "easeInOut",
                          times: serviceTimes
                        }}
                      >
                        {/* Lower Arm */}
                        <line x1="63.5" y1="48" x2="63.5" y2="60" stroke="white" strokeWidth="4" strokeLinecap="round" />
                        {/* Racket Grip (Neon Green Accent) */}
                        <line x1="63.5" y1="60" x2="63.5" y2="66" stroke="#D7FF3F" strokeWidth="2.2" strokeLinecap="round" />
                        {/* Racket Head */}
                        <ellipse cx="63.5" cy="73" rx="5" ry="7" stroke="white" strokeWidth="1.8" fill="#0c0c0c" />
                        {/* Padel Holes Pattern */}
                        <circle cx="61.8" cy="71.5" r="0.5" fill="white" opacity="0.6" />
                        <circle cx="63.5" cy="71.5" r="0.5" fill="white" opacity="0.6" />
                        <circle cx="65.2" cy="71.5" r="0.5" fill="white" opacity="0.6" />
                        <circle cx="62.6" cy="74" r="0.5" fill="white" opacity="0.6" />
                        <circle cx="64.4" cy="74" r="0.5" fill="white" opacity="0.6" />
                        <circle cx="63.5" cy="76.5" r="0.5" fill="white" opacity="0.6" />
                      </motion.g>
                    </motion.g>
                  </g>

                  {/* Trail 3 (Neon Green Comet Tail - Back) */}
                  <motion.circle
                    cx={0}
                    cy={0}
                    r="2.2"
                    fill="#D9FF3F"
                    filter="url(#ball-glow)"
                    animate={{
                      x: trail3.xs,
                      y: trail3.ys,
                      opacity: trail3.opacities,
                      scaleX: trail3.scaleXs,
                      scaleY: trail3.scaleYs,
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: duration,
                      ease: "linear",
                      times: trajectory.times
                    }}
                  />

                  {/* Trail 2 (Neon Green Comet Tail - Mid) */}
                  <motion.circle
                    cx={0}
                    cy={0}
                    r="2.2"
                    fill="#D9FF3F"
                    filter="url(#ball-glow)"
                    animate={{
                      x: trail2.xs,
                      y: trail2.ys,
                      opacity: trail2.opacities,
                      scaleX: trail2.scaleXs,
                      scaleY: trail2.scaleYs,
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: duration,
                      ease: "linear",
                      times: trajectory.times
                    }}
                  />

                  {/* Trail 1 (Neon Green Comet Tail - Front) */}
                  <motion.circle
                    cx={0}
                    cy={0}
                    r="2.2"
                    fill="#D9FF3F"
                    filter="url(#ball-glow)"
                    animate={{
                      x: trail1.xs,
                      y: trail1.ys,
                      opacity: trail1.opacities,
                      scaleX: trail1.scaleXs,
                      scaleY: trail1.scaleYs,
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: duration,
                      ease: "linear",
                      times: trajectory.times
                    }}
                  />

                  {/* Neon Green Padel Ball with Motion Blur/Glow */}
                  <motion.circle
                    cx={0}
                    cy={0}
                    r="2.2"
                    fill="#D9FF3F"
                    filter="url(#ball-glow)"
                    animate={{
                      x: trajectory.xs,
                      y: trajectory.ys,
                      opacity: trajectory.opacities,
                      scaleX: trajectory.scaleXs,
                      scaleY: trajectory.scaleYs,
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: duration,
                      ease: "linear",
                      times: trajectory.times
                    }}
                  />
                </svg>
              </motion.div>
            </div>

            {/* Minimal Navigation */}
            <nav className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="#premium-facilities" className="hover:text-white transition-colors">Courts</Link>
              <Link href="#club-amenities" className="hover:text-white transition-colors">Facilities</Link>
              <Link href="/booking" className="hover:text-white transition-colors">Book Now</Link>
            </nav>
          </div>

          {/* RIGHT SECTION: Social Presence */}
          <div className="flex flex-col items-start md:items-end gap-8">
            <h4 className="text-white text-[10px] font-bold uppercase tracking-[0.4em] opacity-30">Social Presence</h4>
            <div className="flex items-center gap-6">
              {/* Instagram Icon SVG */}
              <a href="#" className="group relative">
                <div className="absolute inset-0 bg-[#D7FF3F]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-[#D7FF3F] transition-all duration-500">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              {/* TikTok Monogram */}
              <a href="#" className="group relative">
                <div className="absolute inset-0 bg-[#D7FF3F]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-5 h-5 text-white/40 group-hover:text-[#D7FF3F] transition-all duration-500 font-bold text-[10px] flex items-center justify-center italic">𝓣</div>
              </a>
              {/* WhatsApp Icon SVG */}
              <a href="#" className="group relative">
                <div className="absolute inset-0 bg-[#D7FF3F]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-[#D7FF3F] transition-all duration-500">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path>
                </svg>
              </a>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Connect with us</p>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Sub-footer */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">
            © 2026 PADELGO. ALL RIGHTS RESERVED.
          </p>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent mx-8 hidden md:block"></div>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium italic">
            Jadikan setiap rally panjang, adalah sebuah pengalaman
          </p>
        </div>
      </div>
    </footer>
  );
}