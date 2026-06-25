import { useEffect, useRef, useState } from 'react';

const GLYPHS = '!<>-_\\/[]{}=+*^?#________';

/**
 * Decode text from random glyphs into the final string, character by character.
 * Re-runs whenever `text` changes.
 */
export function ScrambleText({
  text,
  className,
  speed = 1,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [output, setOutput] = useState(text);
  const rafRef = useRef(0);

  useEffect(() => {
    const queue = text.split('').map((char, index) => ({
      char,
      revealAt: Math.floor((index * 1.6 + Math.random() * 16) / speed),
    }));

    let frame = 0;
    function tick() {
      let settled = 0;
      const next = queue
        .map((item) => {
          if (item.char === ' ') {
            settled += 1;
            return ' ';
          }
          if (frame >= item.revealAt) {
            settled += 1;
            return item.char;
          }
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');
      setOutput(next);
      frame += 1;
      if (settled < queue.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, speed]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{output}</span>
    </span>
  );
}
