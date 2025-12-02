import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PhotoGalleryModal({ photos, initialIndex = 0, open, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setIsZoomed(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  };

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

  if (!photos || photos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Zoom toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-16 z-50 text-white hover:bg-white/20 rounded-full"
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </Button>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Main image */}
        <div
          className="w-full h-full flex items-center justify-center p-4 md:p-12"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIndex}
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsZoomed(!isZoomed)}
            />
          </AnimatePresence>
        </div>

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto p-2 bg-black/40 rounded-xl">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex 
                    ? "border-teal-500 opacity-100" 
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}