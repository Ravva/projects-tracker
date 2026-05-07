---
version: "alpha"
name: "AI Platform Interface"
description: "Platform Interface Feature Section is designed for highlighting product capabilities and value points. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for component libraries and responsive product interfaces."
colors:
  primary: "#06B6D4"
  secondary: "#14B8A6"
  tertiary: "#94A3B8"
  neutral: "#FFFFFF"
  background: "#FFFFFF"
  surface: "#06B6D4"
  text-primary: "#CBD5E1"
  text-secondary: "#FFFFFF"
  border: "#FFFFFF"
  accent: "#06B6D4"
typography:
  headline-lg:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: "28px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22.75px"
spacing:
  base: "8px"
  sm: "1px"
  md: "8px"
  lg: "10px"
  xl: "16px"
  gap: "4px"
  card-padding: "10px"
  section-padding: "32px"
components:
  card:
    backgroundColor: "#11141D"
    rounded: "31px"
    padding: "32px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Bounded
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses dark mode with #06B6D4 as the main accent and #FFFFFF as the neutral foundation.

- **Primary (#06B6D4):** Main accent and emphasis color.
- **Secondary (#14B8A6):** Supporting accent for secondary emphasis.
- **Tertiary (#94A3B8):** Reserved accent for supporting contrast moments.
- **Neutral (#FFFFFF):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #FFFFFF; Surface: #06B6D4; Text Primary: #CBD5E1; Text Secondary: #FFFFFF; Border: #FFFFFF; Accent: #06B6D4

- **Gradients:** bg-gradient-to-br from-[#e0f5f5] to-[#e0f5f5] via-[#f1f8f8], bg-gradient-to-b from-white/20 to-cyan-400/50, bg-gradient-to-tr from-cyan-500/20 to-teal-500/20, bg-gradient-to-br from-white/10 to-transparent

## Typography

Typography relies on Inter across display, body, and utility text.

- **Headlines (`headline-lg`):** Inter, 18px, weight 500, line-height 28px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 14px, weight 400, line-height 22.75px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, bounded structural frame before changing ornament or component styling. Use 8px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / bounded composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Bounded
- **Base unit:** 8px
- **Scale:** 1px, 8px, 10px, 16px, 32px, 48px
- **Section padding:** 32px
- **Card padding:** 10px, 16px, 32px
- **Gaps:** 4px, 8px, 12px, 24px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 1px #FFFFFF; 1px #94A3B8; 1px #06B6D4; 4px #252A38
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.25) 0px 25px 50px -12px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(6, 182, 212, 0.4) 0px 0px 20px 0px
- **Blur:** 4px, 12px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 32px radius. Drive the shell with linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 12px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 12px, 16px, 31px, 32px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Reuse the existing card surface recipe for content blocks.

### Cards and Surfaces
- **Card surface:** background #11141D, border 0px solid rgb(229, 231, 235), radius 31px, padding 32px, shadow none.
- **Card surface:** background rgba(26, 31, 43, 0.8), border 1px solid rgba(255, 255, 255, 0.05), radius 16px, padding 16px, shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.25) 0px 25px 50px -12px, blur 12px.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 8px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 12px, 16px, 31px, 32px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected minimal motion intensity without a deliberate reason.

## Motion

Motion stays restrained and interface-led across text, layout, and scroll transitions. Easing favors ease. Scroll choreography uses GSAP ScrollTrigger and Parallax for section reveals and pacing.

**Motion Level:** minimal

**Easings:** ease

**Scroll Patterns:** gsap-scrolltrigger, parallax

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, renderer, alpha, antialias, dpr clamp, custom shaders. The effect should read as retro-futurist, technical, and meditative: dot-matrix particle field with green on black and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, Renderer, alpha, antialias, DPR clamp, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Canvas Background -->
      <canvas id="webgl-canvas" class="fixed inset-0 w-full h-full pointer-events-none z-0" style="display: block;"></canvas>

      <!-- Main Framed Container -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // --- WebGL Dot Matrix Background ---
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const scene = new THREE.Scene();

          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      …
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // DPR clamp
      renderer.setSize(window.innerWidth, window.innerHeight);

      // Custom Shader Material for Dots with soft depth fade
      ```
  - **Scene setup:**
    - **Language:** js
    - **Snippet:**
      ```
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const scene = new THREE.Scene();

          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 50;
      ```

## ThreeJS

Reconstruct the Three.js layer as a full-bleed background field with layered spatial depth that feels retro-futurist, volumetric, and technical. Use alpha, antialias, dpr clamp renderer settings, perspective, ~75deg fov, custom buffer geometry geometry, shadermaterial materials, and ambient + key + rim lighting. Motion should read as slow orbital drift, with poster frame + dom fallback.

**Id:** threejs

**Label:** ThreeJS

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field with layered spatial depth
  - **Render:**
    - **Value:** alpha, antialias, DPR clamp
  - **Camera:**
    - **Value:** Perspective, ~75deg FOV
  - **Lighting:**
    - **Value:** ambient + key + rim
  - **Materials:**
    - **Value:** ShaderMaterial
  - **Geometry:**
    - **Value:** custom buffer geometry
  - **Motion:**
    - **Value:** Slow orbital drift

**Techniques:** Shader materials, Particle depth, Timeline beats, alpha, antialias, DPR clamp, Poster frame + DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Canvas Background -->
      <canvas id="webgl-canvas" class="fixed inset-0 w-full h-full pointer-events-none z-0" style="display: block;"></canvas>

      <!-- Main Framed Container -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // --- WebGL Dot Matrix Background ---
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const scene = new THREE.Scene();

          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      …
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 50;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // DPR clamp
      renderer.setSize(window.innerWidth, window.innerHeight);

      // Custom Shader Material for Dots with soft depth fade
      ```
  - **Scene setup:**
    - **Language:** js
    - **Snippet:**
      ```
      const initWebGL = () => {
          const canvas = document.getElementById('webgl-canvas');
          if (!canvas) return;

          const scene = new THREE.Scene();

          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.z = 50;
      ```
