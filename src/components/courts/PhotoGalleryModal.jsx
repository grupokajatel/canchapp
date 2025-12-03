import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Play, Pause, Grid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TRANSITION_EFFECTS = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  },
  slideRight: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
  },
  zoomIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.2 },
  },
  flip: {
    initial: { opacity: 0, rotateY: 90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: -90 },
  },
};

export default function PhotoGalleryModal({ photos, initialIndex = 0, open, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [touchStart, setTouchStart] = useState(null);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsLoaded(false);
  }, [initialIndex, open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsAutoPlaying(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex]);

  // Auto-play slideshow
  useEffect(() => {
    if (!isAutoPlaying || !open) return;
    const interval = setInterval(() => {
      goToNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, open, currentIndex]);

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setIsZoomed(false);
    setIsLoaded(false);
  }, [photos?.length]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
    setIsLoaded(false);
  }, [photos?.length]);

  const goToIndex = useCallback((idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    setIsZoomed(false);
    setShowGrid(false);
    setIsLoaded(false);
  }, [currentIndex]);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStart(null);
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  if (!photos || photos.length === 0) return null;

  const currentEffect = direction > 0 ? TRANSITION_EFFECTS.slideLeft : TRANSITION_EFFECTS.slideRight;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black border-0 overflow-hidden">
        {/* Animated Background with Ken Burns effect */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30"
            style={{ backgroundImage: `url(${photos[currentIndex]})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/90" />
        </motion.div>

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            >
              {isAutoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="text-white/80 text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Grid View */}
        <AnimatePresence>
          {showGrid && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/95 overflow-auto p-8 pt-20"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                {photos.map((photo, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => goToIndex(idx)}
                    className={`relative aspect-video rounded-xl overflow-hidden group ${
                      idx === currentIndex ? 'ring-4 ring-teal-500' : ''
                    }`}
                  >
                    <img 
                      src={photo} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx + 1}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation arrows */}
        {photos.length > 1 && !showGrid && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/20 rounded-full h-14 w-14 backdrop-blur-sm bg-black/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/20 rounded-full h-14 w-14 backdrop-blur-sm bg-black/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            </motion.div>
          </>
        )}

        {/* Main image */}
        {!showGrid && (
          <div
            className="w-full h-full flex items-center justify-center p-4 md:p-16 z-10 relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleMouseMove}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentIndex}
                initial={currentEffect.initial}
                animate={currentEffect.animate}
                exit={currentEffect.exit}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="relative max-w-full max-h-full"
              >
                {/* Loading shimmer */}
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-pulse rounded-2xl" />
                )}
                
                <motion.img
                  src={photos[currentIndex]}
                  alt={`Foto ${currentIndex + 1}`}
                  className={`max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl transition-all duration-300 ${
                    isZoomed ? "scale-[2] cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                  style={isZoomed ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                  } : {}}
                  initial={{ filter: "blur(20px)" }}
                  animate={{ filter: "blur(0px)" }}
                  transition={{ duration: 0.5 }}
                  onClick={() => setIsZoomed(!isZoomed)}
                  onLoad={() => setIsLoaded(true)}
                  draggable={false}
                />

                {/* Reflection effect */}
                <div className="absolute -bottom-20 left-0 right-0 h-20 overflow-hidden opacity-30 pointer-events-none">
                  <img
                    src={photos[currentIndex]}
                    alt=""
                    className="w-full object-cover object-bottom scale-y-[-1] blur-sm"
                    style={{ maskImage: 'linear-gradient(to top, black, transparent)' }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Progress bar for autoplay */}
        {isAutoPlaying && !showGrid && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/20 rounded-full overflow-hidden z-30">
            <motion.div
              key={currentIndex}
              className="h-full bg-teal-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </div>
        )}

        {/* Thumbnail strip with parallax scroll */}
        {photos.length > 1 && !showGrid && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-4 left-0 right-0 z-30"
          >
            <div className="flex justify-center">
              <div className="flex gap-2 max-w-[90vw] overflow-x-auto p-3 bg-black/40 backdrop-blur-md rounded-2xl scrollbar-hide">
                {photos.map((photo, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goToIndex(idx)}
                    className={`flex-shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden transition-all duration-300 ${
                      idx === currentIndex 
                        ? "ring-2 ring-teal-400 ring-offset-2 ring-offset-black opacity-100 scale-110" 
                        : "opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
                    }`}
                  >
                    <img 
                      src={photo} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Keyboard hints */}
        <div className="absolute bottom-4 right-4 z-30 text-white/40 text-xs hidden md:block">
          ← → Navegar • Espacio: Auto-play • Esc: Cerrar
        </div>
      </DialogContent>
    </Dialog>
  );
}