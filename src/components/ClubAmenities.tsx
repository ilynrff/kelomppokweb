"use client";

import React, { useState, useMemo } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { 
  Car, 
  Wifi, 
  Coffee, 
  Lock, 
  ShowerHead, 
  ShoppingBag, 
  Sun
} from "lucide-react";

const AMENITIES = [
  {
    id: "parking",
    title: "Parking",
    desc: "Secure & spacious parking area.",
    icon: <Car className="w-12 h-12 text-[#D7FF3F]" />,
  },
  {
    id: "wifi",
    title: "Free WiFi",
    desc: "High-speed internet throughout the club.",
    icon: <Wifi className="w-16 h-16 text-[#D7FF3F]" />,
  },
  {
    id: "showers",
    title: "Hot Showers",
    desc: "Relaxing hot showers after the game.",
    icon: <ShowerHead className="w-12 h-12 text-[#D7FF3F]" />,
  },
  {
    id: "cafe",
    title: "Cafe & Lounge",
    desc: "Premium drinks, great food and comfortable space.",
    icon: <Coffee className="w-12 h-12 text-[#D7FF3F]" />,
  },
  {
    id: "lockers",
    title: "Locker Room",
    desc: "Clean, comfortable, and fully-equipped lockers.",
    icon: <Lock className="w-16 h-16 text-[#D7FF3F]" />,
  },
  {
    id: "pro-shop",
    title: "Pro Shop",
    desc: "Exclusive padel gear and accessories.",
    icon: <ShoppingBag className="w-10 h-10 text-[#D7FF3F]" />,
  },
  {
    id: "tanning",
    title: "Tanning Bed",
    desc: "Recharge and refresh your body.",
    icon: <Sun className="w-10 h-10 text-[#D7FF3F]" />,
  },
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    x: 40, 
    y: 40 
  },
  visible: { 
    opacity: 1, 
    x: 0, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.23, 1, 0.32, 1], // premium ease-out
    },
  },
};

export default function ClubAmenities() {
  const [index, setIndex] = useState(0);
  const x = useMotionValue(0);

  const mobileItems = useMemo(() => [
    {
      id: "focal",
      type: "image",
      title: "Premium Experience",
      desc: "Everything you need, all in one place.",
      image: "/images/amenities-focal.png"
    },
    ...AMENITIES
  ], []);

  // Precise composition constants for TRUE CENTER-STAGE
  const CARD_WIDTH = 300;
  const GAP = 32;
  const TOTAL_WIDTH = CARD_WIDTH + GAP;

  const handleDragEnd = (event: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -60 || velocity < -500) {
      if (index < mobileItems.length - 1) setIndex(index + 1);
    } else if (offset > 60 || velocity > 500) {
      if (index > 0) setIndex(index - 1);
    }
  };

  return (
    <section className="py-24 bg-[#0B0B0B] overflow-hidden relative" id="club-amenities">
      {/* Cinematic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D7FF3F]/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1100px] mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-14 md:mb-20 px-6">
          <span className="text-[#D7FF3F]/60 text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block animate-fade-in">
            Club Amenities
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            More Than Just <span className="text-[#D7FF3F] drop-shadow-[0_0_15px_rgba(215,255,63,0.3)]">Courts.</span>
          </h2>
        </div>

        {/* ======================================================== */}
        {/* DESKTOP LAYOUT (Modular Grid)                            */}
        {/* ======================================================== */}
        <motion.div 
          className="hidden lg:grid grid-cols-[1fr_360px_1fr] gap-6 items-stretch min-h-[600px] px-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <motion.div variants={itemVariants}><AmenityCard item={AMENITIES[0]} /></motion.div>
            <motion.div variants={itemVariants} className="flex-1 flex flex-col"><AmenityCard item={AMENITIES[1]} className="flex-1" /></motion.div>
            <motion.div variants={itemVariants}><AmenityCard item={AMENITIES[2]} /></motion.div>
          </div>

          {/* Center Column (Visual Focal Point) */}
          <motion.div 
            variants={itemVariants}
            className="relative group rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl"
          >
            <img 
              src="/images/amenities-focal.png" 
              alt="Premium Experience"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute bottom-10 left-0 right-0 text-center px-8">
              <span className="text-[#D7FF3F] text-[10px] font-bold uppercase tracking-[0.3em] mb-3 block">
                Premium Experience
              </span>
              <p className="text-white text-lg font-medium opacity-90">
                Everything you need, all in one place.
              </p>
            </div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(215,255,63,0.15)]"></div>
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            <motion.div variants={itemVariants}><AmenityCard item={AMENITIES[3]} /></motion.div>
            <motion.div variants={itemVariants} className="flex-1 flex flex-col"><AmenityCard item={AMENITIES[4]} className="flex-1" /></motion.div>
            <div className="grid grid-cols-2 gap-6">
              <motion.div variants={itemVariants}><AmenityCard item={AMENITIES[5]} isCompact /></motion.div>
              <motion.div variants={itemVariants}><AmenityCard item={AMENITIES[6]} isCompact /></motion.div>
            </div>
          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* MOBILE LAYOUT (TRUE CENTER-STAGE CAROUSEL)               */}
        {/* ======================================================== */}
        <motion.div 
          className="lg:hidden relative h-[540px] flex items-center overflow-visible"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div
            drag="x"
            dragConstraints={{
              left: -(mobileItems.length - 1) * TOTAL_WIDTH,
              right: 0,
            }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            animate={{
              x: -index * TOTAL_WIDTH,
            }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 30,
            }}
            style={{ x }}
            className="flex items-center gap-[32px] px-[calc(50vw-150px)] cursor-grab active:cursor-grabbing"
          >
            {mobileItems.map((item, i) => (
              <AmenityMobileCard 
                key={item.id} 
                item={item} 
                index={i} 
                totalWidth={TOTAL_WIDTH}
                x={x}
              />
            ))}
          </motion.div>

          {/* Subtle Pagination Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {mobileItems.map((_, i) => (
              <div
                key={i}
                className={`h-[2px] rounded-full transition-all duration-700 ${
                  index === i 
                    ? "w-8 bg-[#D7FF3F]/60 shadow-[0_0_10px_rgba(215,255,63,0.2)]" 
                    : "w-2 bg-white/5"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AmenityMobileCard({ item, index, totalWidth, x }: { item: any, index: number, totalWidth: number, x: any }) {
  // Center-stage transformation interpolation
  const range = [
    (index - 1) * -totalWidth,
    index * -totalWidth,
    (index + 1) * -totalWidth
  ];
  
  const scale = useTransform(x, range, [0.75, 1, 0.75]);
  const opacityTransform = useTransform(x, range, [0.15, 1, 0.15]);
  const blur = useTransform(x, range, ["blur(12px)", "blur(0px)", "blur(12px)"]);

  return (
    <motion.div
      variants={itemVariants}
      style={{
        scale,
        opacity: opacityTransform,
        filter: blur,
        width: 300,
        height: 440,
        flexShrink: 0,
      }}
      className="relative flex items-center justify-center"
    >
      {item.type === "image" ? (
        <div className="w-full h-full rounded-[4rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative pointer-events-none">
          <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
          <div className="absolute bottom-12 left-0 right-0 text-center px-8">
            <span className="text-[#D7FF3F] text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block">
              {item.title}
            </span>
            <p className="text-white text-base font-medium opacity-90 leading-relaxed max-w-[200px] mx-auto">
              {item.desc}
            </p>
          </div>
        </div>
      ) : (
        <div className={`
          w-full h-full rounded-[4rem] p-10
          bg-white/[0.03] backdrop-blur-3xl border border-white/5
          flex flex-col items-center justify-center text-center
          shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]
          pointer-events-none
        `}>
          <div className="mb-12 drop-shadow-[0_0_20px_rgba(215,255,63,0.2)] transform scale-110">
            {item.icon}
          </div>
          <h3 className="text-3xl font-black text-white mb-6 tracking-tight leading-none">{item.title}</h3>
          <p className="text-white/30 text-base leading-relaxed max-w-[200px] mx-auto">
            {item.desc}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function AmenityCard({ item, className = "", isCompact = false }: { item: any, className?: string, isCompact?: boolean }) {
  return (
    <div className={`
      group relative rounded-[2.5rem] p-8 w-full h-full
      bg-white/[0.03] backdrop-blur-md border border-white/5
      hover:border-[#D7FF3F]/30 hover:bg-white/[0.05]
      transition-all duration-700
      flex flex-col items-center justify-center text-center
      overflow-hidden
      ${className}
    `}>
      <div className="absolute -inset-1 bg-[#D7FF3F]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
      
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-6">
        <div className="transform transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3">
          {item.icon}
        </div>
        <div>
          <h3 className={`text-white font-black mb-2 tracking-tight ${isCompact ? "text-base" : "text-xl"}`}>{item.title}</h3>
          {!isCompact && (
            <p className="text-white/30 text-xs leading-relaxed group-hover:text-white/60 transition-colors duration-500 max-w-[200px] mx-auto">
              {item.desc}
            </p>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D7FF3F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </div>
  );
}
