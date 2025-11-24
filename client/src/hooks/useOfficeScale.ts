import { useState, useEffect, useRef } from 'react';
import { BASE_OFFICE_WIDTH } from '../types/deskTypes';

/**
 * Хук для управления масштабом офисной карты
 * Принцип Single Responsibility: отвечает только за масштабирование
 */
export const useOfficeScale = (mapContainerRef: React.RefObject<HTMLDivElement | null>) => {
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  const isInitializedRef = useRef(false);
  const headerHeightRef = useRef<number | null>(null);
  const headerMarginRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapContainer = mapContainerRef.current;
    const officeMapWrapper = mapContainer.parentElement;
    const officeMapContainer = officeMapWrapper?.parentElement;
    const officeMapWrapperParent = officeMapContainer?.parentElement;
    const parentContainer = officeMapWrapperParent?.parentElement;

    if (!officeMapWrapper || !officeMapContainer || !officeMapWrapperParent || !parentContainer) return;

    let updateTimeout: NodeJS.Timeout | null = null;

    const debouncedUpdateScale = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      updateTimeout = setTimeout(() => {
        updateScale();
      }, 50);
    };

    const updateScale = () => {
      if (!mapContainerRef.current || !officeMapWrapper || !officeMapContainer || !officeMapWrapperParent || !parentContainer) return;

      const wrapperRect = officeMapWrapper.getBoundingClientRect();
      const header = officeMapContainer.querySelector('.office-map-header');
      headerHeightRef.current = header ? header.getBoundingClientRect().height : 120;
      headerMarginRef.current = 1.5 * 16;

      const availableWidth = wrapperRect.width;
      const newScale = availableWidth / BASE_OFFICE_WIDTH;
      const finalScale = Math.max(0.3, newScale);

      if (process.env.NODE_ENV === 'development') {
        console.log('Wrapper width:', wrapperRect.width, 'Available width:', availableWidth, 'Scale:', finalScale, 'Map width:', BASE_OFFICE_WIDTH * finalScale);
      }

      scaleRef.current = finalScale;
      setScale(finalScale);
      isInitializedRef.current = true;
    };

    const timeoutId = setTimeout(updateScale, 100);
    updateScale();

    const resizeObserver = new ResizeObserver(debouncedUpdateScale);
    resizeObserver.observe(officeMapContainer);
    resizeObserver.observe(parentContainer);
    resizeObserver.observe(officeMapWrapperParent);
    resizeObserver.observe(officeMapWrapper);

    window.addEventListener('resize', debouncedUpdateScale);

    const handleOrientationChange = () => {
      setTimeout(updateScale, 200);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    let visualViewport: VisualViewport | null = null;
    if (window.visualViewport) {
      visualViewport = window.visualViewport;
      visualViewport.addEventListener('resize', debouncedUpdateScale);
      visualViewport.addEventListener('scroll', debouncedUpdateScale);
    }

    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedUpdateScale);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', debouncedUpdateScale);
        visualViewport.removeEventListener('scroll', debouncedUpdateScale);
      }
      clearTimeout(timeoutId);
    };
  }, [mapContainerRef]);

  return scale;
};

