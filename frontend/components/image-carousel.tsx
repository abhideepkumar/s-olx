"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselItem } from "@/components/ui/carousel";

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <Carousel className="w-full h-96 relative">
      {images.map((image, index) => (
        <CarouselItem
          key={index}
          className={`w-full h-full rounded-2xl bg-center bg-cover duration-500 ${
            currentIndex === index ? "block" : "hidden"
          }`}
          style={{ backgroundImage: `url(${image})` }}
        ></CarouselItem>
      ))}

      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute top-1/2 -translate-y-1/2 left-5 p-2 bg-black/20 text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute top-1/2 -translate-y-1/2 right-5 p-2 bg-black/20 text-white"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
        {images.map((_, index) => (
          <div
            key={index}
            className={`transition-all w-3 h-3 bg-white rounded-full ${
              currentIndex === index ? "p-2" : "bg-opacity-50"
            }`}
          />
        ))}
      </div>
    </Carousel>
  );
}
