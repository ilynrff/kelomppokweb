"use client";

import React, { useState, useEffect } from "react";

interface ImageCarouselProps {
  images: any[];
  autoSlide?: boolean;
  interval?: number;
  className?: string;
}

export function ImageCarousel({
  images: rawImages,
  autoSlide = true,
  interval = 3000,
  className = "",
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Normalize images to array of strings (URLs) based on isActive
  const images = (rawImages || []).map(img => {
    if (typeof img === "string") return { url: img, isActive: true };
    return {
      url: img.url || "",
      isActive: img.isActive !== undefined ? !!img.isActive : true
    };
  }).filter(img => !!img.url && img.isActive).map(img => img.url);

  useEffect(() => {
    if (!autoSlide || images.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, autoSlide, interval, isHovered]);

  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 font-bold ${className}`}>
        No Image
      </div>
    );
  }

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides */}
      <div 
        className="flex w-full h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((url, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0">
            <img
              src={url}
              alt={`Slide ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            ❮
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            ❯
          </button>

          {/* Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentIndex === idx ? "bg-white w-4" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
