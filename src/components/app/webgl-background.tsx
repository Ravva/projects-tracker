"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // ── Scene & Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 50;

    // ── Dot-matrix particle field ─────────────────────────────
    const COLS = 60;
    const ROWS = 40;
    const SPACING = 2.4;
    const COUNT = COLS * ROWS;

    const positions = new Float32Array(COUNT * 3);
    const randoms = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      positions[i * 3] = (col - COLS / 2) * SPACING;
      positions[i * 3 + 1] = (row - ROWS / 2) * SPACING;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      randoms[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    // ── ShaderMaterial with depth fade and breathing pulse ────
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader: /* glsl */ `
        attribute float aRandom;
        uniform float uTime;
        uniform vec2 uMouse;

        varying float vDepth;
        varying float vRandom;

        void main() {
          vRandom = aRandom;

          vec3 pos = position;

          // Subtle mouse-driven drift
          float distX = pos.x / 72.0;
          float distY = pos.y / 48.0;
          pos.x += uMouse.x * (1.0 - abs(distX)) * 1.8;
          pos.y += uMouse.y * (1.0 - abs(distY)) * 1.8;

          // Slow breathing wave
          pos.z += sin(uTime * 0.4 + aRandom * 6.28318) * 2.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vDepth = clamp((-mvPosition.z - 30.0) / 40.0, 0.0, 1.0);

          // Point size fades with depth
          gl_PointSize = (3.0 - vDepth * 2.0) * (1.0 / -mvPosition.z) * 400.0;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        varying float vDepth;
        varying float vRandom;

        void main() {
          // Circular dot
          vec2 uv = gl_PointCoord - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;

          // Soft edge
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

          // Depth fade
          alpha *= (1.0 - vDepth * 0.85);

          // Breathing pulse per dot
          float pulse = 0.55 + 0.45 * sin(uTime * 0.5 + vRandom * 6.28318);
          alpha *= pulse;

          // Cyan tint with slight variation
          vec3 color = mix(
            vec3(0.024, 0.714, 0.831),  // #06B6D4 cyan
            vec3(0.078, 0.722, 0.651),  // #14B8A6 teal
            vRandom
          );

          gl_FragColor = vec4(color, alpha * 0.55);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Mouse tracking ────────────────────────────────────────
    const mouse = new THREE.Vector2(0, 0);
    const targetMouse = new THREE.Vector2(0, 0);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // ── Resize handler ────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight,
      );
    };
    window.addEventListener("resize", handleResize);

    // ── Animation loop ────────────────────────────────────────
    let raf: number;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Lerp mouse for smooth drift
      mouse.lerp(targetMouse, 0.05);
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uMouse.value.copy(mouse);

      // Slow orbital rotation of the whole field
      points.rotation.z = elapsed * 0.008;

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div role="presentation" className="pointer-events-none fixed inset-0 z-0">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
