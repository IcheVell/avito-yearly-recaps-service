import {  type RefObject, useCallback, useEffect, useRef, useState} from 'react';

type UseRecapCarouselResult = {
  trackRef: RefObject<HTMLDivElement | null>;
  currentSlide: number;

  scrollToSlide: (index: number) => void;
  goToPreviousSlide: () => void;
  goToNextSlide: () => void;

  handleTrackScroll: () => void;

  isFirstSlide: boolean;
  isLastSlide: boolean;
};

function clampSlideIndex(
  index: number,
  slidesCount: number,
): number {
  const lastSlideIndex = Math.max(0, slidesCount - 1);

  return Math.max(
    0,
    Math.min(index, lastSlideIndex),
  );
}

export function useRecapCarousel(
  slidesCount: number,
): UseRecapCarouselResult {
  const trackRef = useRef<HTMLDivElement>(null);

  const currentSlideRef = useRef(0);

  const programmaticSlideRef =
    useRef<number | null>(null);

  const scrollEndTimerRef =
    useRef<number | null>(null);

  const [currentSlide, setCurrentSlide] = useState(0);

  const selectSlide = useCallback((index: number) => {
    currentSlideRef.current = index;
    setCurrentSlide(index);
  }, []);

  const scrollToSlide = useCallback(
    (index: number) => {
      const track = trackRef.current;

      if (!track || slidesCount === 0) {
        return;
      }

      const safeIndex = clampSlideIndex(
        index,
        slidesCount,
      );

      if (safeIndex === currentSlideRef.current) {
        return;
      }

      const target = track.children.item(
        safeIndex,
      ) as HTMLElement | null;

      programmaticSlideRef.current = safeIndex;
      selectSlide(safeIndex);

      target?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    },
    [selectSlide, slidesCount],
  );

  const updateCurrentSlideFromTrack =
    useCallback(() => {
      const track = trackRef.current;

      if (!track) {
        return;
      }

      const trackCenter =
        track.scrollLeft + track.clientWidth / 2;

      let nearestIndex = 0;
      let nearestDistance =
        Number.POSITIVE_INFINITY;

      Array.from(track.children).forEach(
        (child, index) => {
          const element = child as HTMLElement;

          const elementCenter =
            element.offsetLeft +
            element.offsetWidth / 2;

          const distance = Math.abs(
            elementCenter - trackCenter,
          );

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        },
      );

      selectSlide(nearestIndex);
    }, [selectSlide]);

  const handleTrackScroll = useCallback(() => {
    if (programmaticSlideRef.current === null) {
      updateCurrentSlideFromTrack();
      return;
    }

    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(
        scrollEndTimerRef.current,
      );
    }

    scrollEndTimerRef.current =
      window.setTimeout(() => {
        scrollEndTimerRef.current = null;
        programmaticSlideRef.current = null;

        updateCurrentSlideFromTrack();
      }, 120);
  }, [updateCurrentSlideFromTrack]);

  const goToPreviousSlide = useCallback(() => {
    scrollToSlide(currentSlideRef.current - 1);
  }, [scrollToSlide]);

  const goToNextSlide = useCallback(() => {
    scrollToSlide(currentSlideRef.current + 1);
  }, [scrollToSlide]);

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(
          scrollEndTimerRef.current,
        );
      }
    };
  }, []);

  return {
    trackRef,
    currentSlide,

    scrollToSlide,
    goToPreviousSlide,
    goToNextSlide,

    handleTrackScroll,

    isFirstSlide: currentSlide === 0,
    isLastSlide:
      currentSlide === slidesCount - 1,
  };
}