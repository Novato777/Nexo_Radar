import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import './LogoLoop.css';

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };
const toCssLength = value => (typeof value === 'number' ? `${value}px` : (value ?? undefined));

const useResizeObserver = (callback, elements, dependencies) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }
    const observers = elements.map(ref => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => { observers.forEach(observer => observer?.disconnect()); };
  }, [callback, elements, dependencies]);
};

const useImageLoader = (seqRef, onLoad, dependencies) => {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll('img') ?? [];
    if (images.length === 0) { onLoad(); return; }
    let remainingImages = images.length;
    const handleImageLoad = () => { remainingImages -= 1; if (remainingImages === 0) onLoad(); };
    images.forEach(img => {
      if (img.complete) handleImageLoad();
      else { img.addEventListener('load', handleImageLoad, { once: true }); img.addEventListener('error', handleImageLoad, { once: true }); }
    });
    return () => { images.forEach(img => { img.removeEventListener('load', handleImageLoad); img.removeEventListener('error', handleImageLoad); }); };
  }, [onLoad, seqRef, dependencies]);
};

const useAnimationLoop = (trackRef, targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical) => {
  const rafRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const seqSize = isVertical ? seqHeight : seqWidth;

    const animate = timestamp => {
      if (lastTimestampRef.current === null) lastTimestampRef.current = timestamp;
      const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;
      const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;
      const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easingFactor;

      if (seqSize > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
        nextOffset = ((nextOffset % seqSize) + seqSize) % seqSize;
        offsetRef.current = nextOffset;
        track.style.transform = isVertical ? `translate3d(0, ${-offsetRef.current}px, 0)` : `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimestampRef.current = null;
    };
  }, [targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, trackRef]);
};

export const LogoLoop = memo(({ logos, speed = 120, direction = 'left', width = '100%', logoHeight = 28, gap = 32, pauseOnHover, hoverSpeed, fadeOut = false, fadeOutColor, scaleOnHover = false, ariaLabel = 'Partner logos', className, style }) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const seqRef = useRef(null);
  const [seqWidth, setSeqWidth] = useState(0);
  const [seqHeight, setSeqHeight] = useState(0);
  const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
  const [isHovered, setIsHovered] = useState(false);

  const effectiveHoverSpeed = useMemo(() => {
    if (hoverSpeed !== undefined) return hoverSpeed;
    if (pauseOnHover === true) return 0;
    return undefined;
  }, [hoverSpeed, pauseOnHover]);

  const isVertical = direction === 'up' || direction === 'down';
  const targetVelocity = useMemo(() => {
    const magnitude = Math.abs(speed);
    const dirMulti = isVertical ? (direction === 'up' ? 1 : -1) : (direction === 'left' ? 1 : -1);
    return magnitude * dirMulti * (speed < 0 ? -1 : 1);
  }, [speed, direction, isVertical]);

  const updateDimensions = useCallback(() => {
    const sequenceRect = seqRef.current?.getBoundingClientRect?.();
    const sequenceWidth = sequenceRect?.width ?? 0;
    if (sequenceWidth > 0 && !isVertical) {
      setSeqWidth(Math.ceil(sequenceWidth));
      const copiesNeeded = Math.ceil((containerRef.current?.clientWidth ?? 0) / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
      setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
    }
  }, [isVertical]);

  useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight, isVertical]);
  useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight, isVertical]);
  useAnimationLoop(trackRef, targetVelocity, seqWidth, seqHeight, isHovered, effectiveHoverSpeed, isVertical);

  const renderLogoItem = useCallback((item, key) => {
    const isNodeItem = 'node' in item;
    const content = isNodeItem ? (<span className="logoloop__node">{item.node}</span>) : (<img src={item.src} alt={item.title} />);
    return (
      <li className="logoloop__item" key={key}>
        {item.href ? <a className="logoloop__link" href={item.href} target="_blank" rel="noreferrer noopener">{content}</a> : content}
      </li>
    );
  }, []);

  return (
    <div ref={containerRef} className={`logoloop ${fadeOut ? 'logoloop--fade' : ''} ${scaleOnHover ? 'logoloop--scale-hover' : ''} ${className || ''}`} style={{ width: toCssLength(width), '--logoloop-gap': `${gap}px`, '--logoloop-logoHeight': `${logoHeight}px`, '--logoloop-fadeColor': fadeOutColor, ...style }}>
      <div className="logoloop__track" ref={trackRef} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {Array.from({ length: copyCount }, (_, c) => (
          <ul className="logoloop__list" key={`copy-${c}`} ref={c === 0 ? seqRef : undefined}>
            {logos.map((item, i) => renderLogoItem(item, `${c}-${i}`))}
          </ul>
        ))}
      </div>
    </div>
  );
});

LogoLoop.displayName = 'LogoLoop';
export default LogoLoop;
