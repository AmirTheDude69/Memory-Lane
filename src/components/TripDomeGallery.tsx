'use client';

import DomeGallery from '@/components/DomeGallery';
import type { Trip } from '@/data/trips';

type TripDomeGalleryProps = {
  trip: Trip;
};

export default function TripDomeGallery({ trip }: TripDomeGalleryProps) {
  return (
    <div className="relative h-[62vh] min-h-[440px] overflow-hidden rounded-3xl border border-amber-100/20 bg-[#070d1c]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.14),rgba(3,10,22,0.72)_58%)]" />
      <div className="relative h-full">
        <DomeGallery
          dragDampening={2.2}
          dragSensitivity={22}
          fit={0.54}
          fitBasis="min"
          grayscale={false}
          imageBorderRadius="20px"
          images={trip.galleryImages}
          maxVerticalRotationDeg={8}
          minRadius={420}
          openedImageBorderRadius="28px"
          openedImageHeight="420px"
          openedImageWidth="300px"
          overlayBlurColor="#060d1f"
          segments={35}
        />
      </div>
    </div>
  );
}
