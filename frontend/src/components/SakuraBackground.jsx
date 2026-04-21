import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function SakuraBackground() {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    // Generate static array of petals to animate
    const items = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      xOffset: Math.random() * 100, // random start X position (vw)
      size: Math.random() * 8 + 6, // random size between 6px and 14px
      duration: Math.random() * 5 + 5, // random duration between 5s and 10s
      delay: Math.random() * 5, // random start delay
    }));
    setPetals(items);
  }, []);

  return (
    <div className="particles-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="sakura-petal"
          style={{
            width: petal.size,
            height: petal.size * 1.5,
            left: `${petal.xOffset}vw`,
            top: '-5%',
          }}
          animate={{
            y: ['0vh', '105vh'],
            x: [
              `${petal.xOffset}vw`,
              `${petal.xOffset + (Math.random() * 20 - 10)}vw`,
              `${petal.xOffset + (Math.random() * 30 - 15)}vw`
            ],
            rotate: [0, 360],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}
