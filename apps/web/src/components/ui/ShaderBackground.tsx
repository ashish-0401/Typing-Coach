import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform float uDark;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = uv;
  p.x *= aspect;
  p *= 2.2;
  float t = uTime * 0.04;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t * 0.8));
  float n = fbm(p + q * 1.9 + t);
  // Tighter threshold keeps the aurora as defined wisps instead of a flat haze.
  float m = smoothstep(0.46, 1.0, n);

  // Dark theme: bright, additive aurora that glows on the near-black bg.
  vec3 dDeep = vec3(0.27, 0.23, 0.95);
  vec3 dViolet = vec3(0.60, 0.50, 1.0);
  vec3 dSky = vec3(0.36, 0.62, 1.0);
  vec3 darkCol = mix(dDeep, dViolet, smoothstep(0.45, 1.0, n));
  darkCol = mix(darkCol, dSky, smoothstep(0.62, 1.0, q.y) * 0.45);
  float darkAlpha = m * 0.55;

  // Light theme: deeper, more saturated ink + higher opacity so the same
  // smoke stays clearly visible against the near-white bg.
  vec3 lDeep = vec3(0.30, 0.26, 0.78);
  vec3 lViolet = vec3(0.42, 0.34, 0.92);
  vec3 lSky = vec3(0.24, 0.46, 0.90);
  vec3 lightCol = mix(lDeep, lViolet, smoothstep(0.45, 1.0, n));
  lightCol = mix(lightCol, lSky, smoothstep(0.62, 1.0, q.y) * 0.45);
  float lightAlpha = m * 0.85;

  vec3 col = mix(lightCol, darkCol, uDark);
  float alpha = mix(lightAlpha, darkAlpha, uDark);
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

/** A GPU shader aurora (theme-aware) plus a faint masked grid. */
export function ShaderBackground() {
  const theme = useTheme((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const programRef = useRef<Program | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        premultipliedAlpha: true,
        dpr: Math.min(window.devicePixelRatio, 1.5),
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uDark: { value: useTheme.getState().theme === 'dark' ? 1 : 0 },
      },
    });
    programRef.current = program;
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    }
    window.addEventListener('resize', resize);
    resize();

    let frame = 0;
    function update(time: number) {
      frame = requestAnimationFrame(update);
      // Bail if the GL context is lost (StrictMode remount, GPU reset, etc.)
      // instead of crashing on an unlinked program every single frame.
      if (gl.isContextLost()) {
        return;
      }
      try {
        program.uniforms.uTime.value = time * 0.001;
        renderer.render({ scene: mesh });
      } catch {
        cancelAnimationFrame(frame);
      }
    }
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      programRef.current = null;
    };
  }, []);

  // Sync the theme uniform without rebuilding the GL context on every toggle.
  useEffect(() => {
    const program = programRef.current;
    if (program) {
      program.uniforms.uDark.value = theme === 'dark' ? 1 : 0;
    }
  }, [theme]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute inset-0 h-full w-full',
          theme === 'dark' ? 'opacity-70' : 'opacity-90',
        )}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 0%, black, transparent 78%)',
        }}
      />
      {/* Vignette scrim: frames the aurora and keeps body text high-contrast. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(135% 95% at 50% 0%, transparent 30%, var(--color-background) 100%)',
        }}
      />
    </div>
  );
}
