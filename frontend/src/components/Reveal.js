import React, { useEffect, useRef, useState } from 'react';

const Reveal = ({ children, delay = 0, className = '', fill = false }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-in' : ''} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        ...(fill
          ? { height: '100%', width: '100%', display: 'flex', flexDirection: 'column', flex: 1 }
          : {}),
      }}
    >
      {children}
    </div>
  );
};

export default Reveal;
