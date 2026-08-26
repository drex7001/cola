# Master Build Prompt: Kinetic Cola-Zero Landing Page

Design and build a production-quality, single-page kinetic landing site for **Coca-Cola Zero Sugar**, presented in its black, red and silver aluminium can.

The experience should combine the restraint of a premium product reveal with the energy of a modern beverage campaign. It should feel cinematic, physical, playful and responsive—not like a generic WebGL experiment or a collection of unrelated scroll effects.

Build the project with **React, Next.js App Router, TypeScript and Three.js**, optimized for deployment on **Vercel**.

> **Revision — 2026-08-26.** Updated after the hero can was rebuilt. Two changes drive the rest:
>
> 1. The original brief specified a *fictional* cola-zero product and explicitly forbade Coca-Cola trade dress. That restriction was deliberately lifted — see §1, which also records the trademark position and the footer copy that now needs replacing.
> 2. §9 and §11 previously described a can assembled from cylinder primitives and lit by `RoomEnvironment`. They now describe the procedural pack and the softbox rig that replaced them.
>
> §4, §20, §21, §24 and §25 were adjusted to match. Sections 2, 3, 5–8, 10, 12–19, 22 and 23 are unchanged.

---

## 1. Product and branding

The product is **Coca-Cola Zero Sugar**, in the standard 330 ml black aluminium can.

The pack carries real Coca-Cola trade dress:

- The Spencerian **Coca-Cola** script wordmark, in brand red on the black ground
- The **dynamic ribbon** device wrapping the lower body
- **zero sugar** and **REAL TASTE** supporting type
- Back-of-pack furniture: nutrition panel, ingredients, barcode, recycling mark, `330 ml e`

### Why this overrides the original restriction

The first version of this brief called for a fictional product with an original text-only **ZERO** mark, and prohibited the Coca-Cola wordmark, script, ribbon, contour bottle and existing Zero packaging. That prohibition was reviewed and **deliberately lifted** by the project owner in favour of the real livery, because the whole point of the piece is a recognisable Coca-Cola product reveal.

Keep the following in mind rather than reverting the decision:

- Coca-Cola's wordmark, ribbon and trade dress are **registered trademarks of The Coca-Cola Company**. This build is unlicensed.
- That is normal and low-risk for a **private portfolio or concept piece**. It becomes a genuine trademark problem if the site is published commercially, presented as official, or used to sell anything.
- If the piece ever needs to ship publicly without a licence, the swap-back point is small and well isolated: replace the artwork drawn in `drawLabel` and the centrelines in `lib/can/wordmark.ts`. Nothing about the geometry, materials or lighting is brand-specific.

### Footer disclaimer

The original disclaimer is now inaccurate and must not be kept as written:

> ~~Fictional product concept created for demonstration purposes. Not affiliated with any beverage company.~~

A pack wearing real trade dress cannot describe itself as a fictional product. Replace it with an honest attribution, for example:

> Unofficial concept piece. Coca-Cola and the Coca-Cola script are trademarks of The Coca-Cola Company. Not affiliated with or endorsed by The Coca-Cola Company.

### Product form

The hero is an **aluminium can**, not the contour bottle. The contour bottle was considered and rejected: glass and liquid need refraction, and a transmission pass is the single most expensive thing this scene could put on a mobile GPU. The material and lighting system would carry over to a bottle variant if one is ever wanted.

---

## 2. Central creative concept

The experience is built around one idea:

**Zero should not feel like less.**

Campaign line:

**REAL TASTE. ZERO SUGAR.**

Supporting line:

**The black can that gives up nothing.**

The emotional progression should be:

**Void → curiosity → inspection → intensity → release → human connection → desire**

The can is the narrative anchor. It should transform, move and change scale throughout the story, but the experience must maintain one continuous visual identity.

---

## 3. Technology stack

Use current stable, mutually compatible versions and commit the generated lockfile.

Required:

- Next.js with App Router
- React
- TypeScript
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- GSAP
- GSAP ScrollTrigger
- `@gsap/react`
- Lenis
- `@react-three/postprocessing` for the restrained bloom effect
- CSS Modules, global CSS or a clearly structured combination
- ESLint

Do not use a component library such as Material UI, Chakra UI or Ant Design.

Do not use a full animation abstraction that hides GSAP timelines.

Do not add a CMS, database, authentication system, API route or server action. This is a static marketing experience.

Use npm unless the existing environment already uses another package manager.

---

## 4. Next.js architecture

Use the App Router.

Recommended structure:

```text
app/
├── layout.tsx
├── page.tsx
├── globals.css
├── opengraph-image.tsx
└── icon.tsx

components/
├── experience/
│   ├── ExperienceCanvas.tsx
│   ├── ExperienceScene.tsx
│   ├── ColaCan.tsx
│   ├── BubbleField.tsx
│   ├── StudioEnvironment.tsx
│   ├── CameraRig.tsx
│   ├── SceneLighting.tsx
│   └── WebGLFallback.tsx
├── sections/
│   ├── HeroSection.tsx
│   ├── SpinSection.tsx
│   ├── ScienceSection.tsx
│   ├── FirstSipSection.tsx
│   ├── MomentsSection.tsx
│   └── CTASection.tsx
├── ui/
│   ├── Navigation.tsx
│   ├── MagneticButton.tsx
│   ├── Marquee.tsx
│   ├── FlavorSelector.tsx
│   ├── ScrollHint.tsx
│   └── Footer.tsx
└── providers/
    ├── SmoothScrollProvider.tsx
    └── MotionProvider.tsx

hooks/
├── useReducedMotion.ts
├── useResponsiveTier.ts
├── useMagneticPointer.ts
└── useWebGLSupport.ts

lib/
├── can/
│   ├── canProfile.ts
│   ├── canGeometry.ts
│   ├── canTextures.ts
│   ├── canMaterials.ts
│   ├── script.ts
│   └── wordmark.ts
├── cameraStates.ts
├── motionTokens.ts
├── sceneStore.ts
└── constants.ts

public/
├── fonts/
└── images/
```

There is no `public/textures/`. Every map the can wears is drawn at runtime (§9).

The exact structure may be adjusted when justified, but preserve clear separation between:

- Semantic page content
- Three.js scene logic
- Scroll animation orchestration
- Reusable interaction components
- Responsive and accessibility utilities

---

## 5. Rendering strategy

The HTML content must render immediately and remain meaningful without WebGL.

The Three.js experience must:

- Run only on the client
- Be dynamically imported with server-side rendering disabled
- Use one fixed, full-viewport canvas
- Sit behind the transparent HTML content
- Never block access to headings, copy or calls to action
- Fail gracefully when WebGL is unavailable
- Avoid hydration errors
- Clean up animation loops, event listeners and ScrollTriggers on unmount

The canvas should use:

```css
position: fixed;
inset: 0;
width: 100%;
height: 100%;
pointer-events: none;
```

Only enable pointer events for the canvas when a scene interaction specifically requires them. HTML controls must remain easy to select and activate.

---

## 6. Visual design system

### Colors

```css
--color-background: #050505;
--color-surface: #0d0d0d;
--color-red: #f40009;
--color-red-hot: #ff2d3b;
--color-white: #ffffff;
--color-silver: #c7ccd1;
--color-muted: rgba(255, 255, 255, 0.62);
--color-border: rgba(255, 255, 255, 0.06);
```

Use near-black rather than pure black for most surfaces.

Red should be a controlled signal color, not a constant full-screen flood. Reserve the strongest red treatment for the “First Sip” payoff and primary CTA.

### Typography

Use:

- Clash Display for display headings
- Satoshi for body copy, controls and labels

Prefer self-hosted licensed WOFF2 files placed in `/public/fonts`.

Do not fabricate font files. When local files are unavailable, configure robust fallbacks:

```css
font-family: "Clash Display", "Arial Black", "Helvetica Neue", sans-serif;
font-family: "Satoshi", Inter, Arial, sans-serif;
```

Use `@font-face` with `font-display: swap`.

Typography should be:

- Large
- Editorial
- Tightly composed
- Responsive with `clamp()`
- Legible over the animated canvas
- Kept as real HTML rather than rendered into WebGL

### Layout

Use:

- Strong asymmetry
- Large negative space
- Thin borders
- Compact labels
- Rounded pill controls
- Oversized display typography
- A consistent responsive grid
- Clear separation between text and high-motion areas

Avoid glassmorphism everywhere. Use blurred translucent surfaces only where they improve hierarchy.

---

## 7. Motion language

The motion should be playful but controlled.

Default easing:

```css
cubic-bezier(0.16, 1, 0.3, 1)
```

GSAP equivalent:

```ts
"power4.out";
```

Use:

- Standard reveal duration: `0.8s`
- Text stagger: `0.06s`
- Badge and accent overshoot: `back.out(1.8)`
- Small hover transition: `0.25–0.4s`
- Scroll-driven animations with scrub values between `0.5` and `1.5`
- Short settling motion after major transitions

Every animation must do at least one of the following:

- Reveal information
- Explain the product
- Connect two chapters
- Create anticipation
- Deliver a payoff
- Confirm an interaction

Remove decorative animation that performs no narrative or usability function.

Do not animate every object continuously.

---

## 8. Continuous scene architecture

Use one persistent Three.js scene and one PerspectiveCamera.

The experience must feel like a continuous camera journey. Do not expose obvious cuts or full scene resets.

However, continuity is more important than literal camera purity. Full-screen masks, red wipes, fog, bloom or HTML overlays may conceal repositioning when required.

### Camera

Use approximately:

```ts
fov: 32;
near: 0.1;
far: 100;
```

Create explicit camera states in `lib/cameraStates.ts`.

Each state should contain:

```ts
type CameraState = {
  position: [number, number, number];
  target: [number, number, number];
  canPosition: [number, number, number];
  canRotation: [number, number, number];
  canScale: number;
  bubbleIntensity: number;
  bubbleSpeed: number;
  lightIntensity: number;
  bloomIntensity: number;
};
```

Interpolate between states rather than creating unrelated camera tweens throughout the codebase.

Suggested starting states:

```ts
hero: {
  position: [0, 0.1, 7.2],
  target: [0, 0, 0],
  canPosition: [0, 0, 0],
  canRotation: [0.05, -0.2, -0.04],
  canScale: 1,
  bubbleIntensity: 0.05,
  bubbleSpeed: 0.1,
  lightIntensity: 0.75,
  bloomIntensity: 0
}

spin: {
  position: [3.8, 0.4, 5.1],
  target: [-0.7, 0, 0],
  canPosition: [-1.55, 0, 0],
  canRotation: [0.05, Math.PI, -0.04],
  canScale: 1,
  bubbleIntensity: 0.08,
  bubbleSpeed: 0.15,
  lightIntensity: 1,
  bloomIntensity: 0
}

science: {
  position: [0.1, 0, 1.4],
  target: [0, 0, -1],
  canPosition: [-2.8, 0, -1],
  canRotation: [0, Math.PI * 1.2, 0],
  canScale: 1.1,
  bubbleIntensity: 1,
  bubbleSpeed: 1,
  lightIntensity: 0.65,
  bloomIntensity: 0.1
}

firstSip: {
  position: [0.7, 0.15, 5.7],
  target: [0, 0, 0],
  canPosition: [0.6, -0.1, 0],
  canRotation: [0.02, Math.PI * 1.5, -0.05],
  canScale: 1.25,
  bubbleIntensity: 1.3,
  bubbleSpeed: 1.8,
  lightIntensity: 1.6,
  bloomIntensity: 1.2
}

moments: {
  position: [0, 0.4, 8],
  target: [0, 0, 0],
  canPosition: [0, 2.4, 0],
  canRotation: [0.04, Math.PI * 2, 0.08],
  canScale: 0.28,
  bubbleIntensity: 0.12,
  bubbleSpeed: 0.2,
  lightIntensity: 0.7,
  bloomIntensity: 0
}

cta: {
  position: [0, -0.05, 7.1],
  target: [0, 0, 0],
  canPosition: [0, 0, 0],
  canRotation: [0.04, Math.PI * 2.4, -0.04],
  canScale: 1.05,
  bubbleIntensity: 0.08,
  bubbleSpeed: 0.12,
  lightIntensity: 1,
  bloomIntensity: 0.05
}
```

Treat these as starting values and tune them visually.

---

## 9. Primary can object

Create one reusable `ColaCan` component and render only one primary can instance.

Do not duplicate the hero can for later sections. Move and scale the same can through the scene. For the small can travelling above the lifestyle cards, move and scale the existing can rather than rendering another instance.

### Approach: generate, do not download

The can is **generated entirely at runtime**. There is no GLB, no HDRI and no texture file — the 3D costs **zero bytes of network transfer**.

This is not a compromise. A can is a surface of revolution, which is the one shape where a generated profile beats a modelled asset outright:

- The silhouette is exact and the normals are analytically smooth
- Tessellation can be tuned per device tier instead of shipping one mesh to every device
- There is no decode stall and no licensing question about a downloaded Coca-Cola mesh
- The label stays vector-sharp at any resolution

Do not replace this with a downloaded model. Free "Coca-Cola can" assets are overwhelmingly unlicensed uploads carrying 4K textures that would be paid for on every page load.

Everything lives in `lib/can/`:

| Module | Responsibility |
| --- | --- |
| `canProfile.ts` | The 330 ml can cross-section, authored in real millimetres |
| `canGeometry.ts` | Custom lathe with per-region UVs and draw groups, plus the pull tab |
| `script.ts` | A variable-width calligraphic pen engine |
| `wordmark.ts` | The Coca-Cola script, stored as stroke centrelines |
| `canTextures.ts` | Canvas-drawn label, condensation, brushed metal and lid maps |
| `canMaterials.ts` | Anisotropic aluminium, clearcoated print, flavour tint hook |

### Geometry

Revolve `CAN_PROFILE` rather than stacking primitives. The profile must carry the features that make a can read as a can:

- Concave base dome with a standing ring
- Slightly barrelled body wall
- Necked-in shoulder
- Rolled double seam
- Countersink groove and lid panel
- Stay-on-tab with a finger hole, as real extruded geometry

Reference dimensions: overall height `114.9 mm`, body diameter `66 mm`, seam diameter `57.6 mm`, standing-ring diameter `54.8 mm`. Scaled so the body radius is `0.92` scene units, which keeps the total height near the original `3.2` and preserves the authored camera choreography.

Radial segments per tier: desktop `144`, tablet `96`, mobile `72`.

Three UV schemes, one geometry:

- **Printed body** — U is the wrap angle, V is *height*. Mapping by height rather than arc length is deliberate: artwork is applied to the straight cylinder *before* the shoulder is necked in, so the print should compress into the neck rather than stretch over it.
- **Bare metal** — U is the wrap angle, V is arc length, giving the tooling streaks an even density across changing radii.
- **Lid panel** — a top-down disc, so the score line, rivet and embossing can be authored in plan view.

Two things will silently break the can if changed carelessly:

- Triangle winding must stay `(a, b, c)` / `(b, d, c)`. Reversing it back-face-culls the entire shell into invisibility.
- The lathe offsets theta by half a turn so the texture's U seam sits on the **back** of the can. Remove that offset and the front artwork splits down the middle.

Call `computeTangents()`. Anisotropic shading needs a tangent frame; without one Three falls back to screen-space derivatives and the brushed highlight swims as the can turns.

### The wordmark

The Coca-Cola script is **not** a font and not traced outlines. It is drawn by a small calligraphic pen engine: letters are stored as stroke **centrelines**, and a virtual broad nib is run along them, swelling wherever the stroke travels along its pressure axis and thinning on upstrokes.

That is how the original Spencerian hand actually produced the shape, and it means the whole wordmark is a few hundred bytes of control points instead of a font download. Capitals, lowercase and swashes are painted in separate passes at different weights, because a real nib does not hold one weight across a whole word.

### Textures

All canvas-drawn, once, per tier. Budget roughly 85 ms on desktop and 40 ms on mobile, absorbed by the existing loading state.

Condensation must be built by **stamping pre-baked droplet sprites**, not by running a Sobel pass over a height field. That turns an O(pixels) JavaScript loop into an O(droplets) sequence of blits — a couple of milliseconds instead of a couple of hundred — and lets the colour, roughness and normal maps share one bead layout so the droplets stay coherent across all three.

Beads should read almost entirely through **specular and normal**, barely at all through albedo. Lift the colour map too far and the can looks like it is covered in snow.

Only the colour map needs full resolution — it is the one carrying the wordmark's hairlines and the legal small print. Run the condensation normal and roughness maps at half width, and the ribbon tint mask at `256px`.

### Materials

Three slots on the shell, matching the draw groups: printed body, bare aluminium, lid.

- **Printed body** — `MeshPhysicalMaterial`, `metalness: 0.06`, `clearcoat: 0.45`. Printed ink is a **dielectric**; a high metalness tints the specular with the base colour and lifts a black can into grey. The clearcoat is the overprint varnish every real can is finished with, and the reason ink on a can looks wet rather than papery.
- **Bare aluminium** — `metalness: 1`, `anisotropy: 0.55`, `anisotropyRotation: π/2`. Can walls are drawn and ironed, so the highlight smears along the tooling direction instead of forming the round hotspot an isotropic metal gives.
- **Lid** — as aluminium, with a plan-view map carrying the score line, rivet and concentric tooling rings.
- **Running drips** — a handful of beads large enough to break surface tension. Glossy, environment-reflective, **never transmissive**: real refraction would force a transmission pass on the whole scene every frame.

### Flavor band interaction

The flavour tint recolours **only the dynamic ribbon**, via a shader hook and a mask baked alongside the label — not by regenerating the label canvas. Swapping a uniform costs nothing; repainting a 2048px texture would drop frames every time the pointer crossed the selector.

Preserve the ribbon's own luminance through the recolour so the condensation highlights stay sitting on top of it.

- Original: Coca-Cola red
- Cherry: deep cherry red or magenta-red
- Vanilla: warm cream or gold

The color must ease smoothly back to the selected flavor after hover ends.

Interaction must work with keyboard focus as well as pointer hover.

---

## 10. Bubble particle system

Use one `BubbleField` particle system.

Use `THREE.Points`, a compact sprite texture and shader-driven opacity or size variation.

Particle limits:

- Desktop: up to 4,000
- Tablet: up to 1,600
- Mobile: 600–800
- Reduced motion: no animated bubble field or a static field of no more than 150 particles

The particle object should remain allocated. Change its uniforms and behavior rather than repeatedly recreating its geometry.

Animate:

- Density impression
- Vertical speed
- Turbulence
- Opacity
- Size
- Burst strength

The “Science of Nothing” section should create a convincing liquid interior using:

- Red-black fog
- Bubble acceleration
- Subtle full-screen refractive distortion
- Caustic-style light movement
- Depth-based opacity

Do not attempt physically accurate fluid simulation.

At the midpoint of the science section, trigger one controlled bubble burst. It must fire once in each scroll direction without producing repeated bursts every frame.

---

## 11. Lighting and post-processing

### The softbox rig

This is the single biggest difference between a can that looks rendered and one that looks photographed, so it carries more weight than any material setting.

Point and spot lights put **round hotspots** on a cylinder, which reads instantly as CG. Real product photography surrounds the subject with tall, narrow softboxes whose reflections smear into the long vertical highlight bands running down every can in a catalogue.

So the environment is literally a set of emissive panels arranged the way a studio would place them, baked once through `PMREMGenerator.fromScene`:

- Twin **vertical key panels** left and right — these produce the pair of long specular bands down the body edges
- A large **overhead box**, pulled back
- A weak **front fill**, which lifts the printed artwork out of shadow and nothing more
- A **red brand rake** from behind, tying the pack to the page
- A cool **back rim** separating the silhouette from the page
- One small hard **glint** source for the pinpoints on the seam and tab

Constraints learned the hard way:

- The surround must be **darker than the keys** (`#040405`). A black can can only stay black if the room it reflects is darker than the lights; otherwise every surface picks up a uniform grey wash.
- The lid is a polished disc facing straight up, so it mirrors whatever fills its **up-and-back reflection cone**. The overhead box is large and pulled back for exactly this reason — shrink it and the lid turns red from the brand rake.
- Keep the red rake **low and to the side**. It should rake the lower body, not sit in the lid's reflection path.

Do **not** use drei's `<Environment>` with `<Lightformer>` children here. With `frames={1}` it captures its cubemap in a layout effect, before the portal children have mounted, so the map bakes empty and the whole scene renders black. It also produces a plain cube render target, whereas `PMREMGenerator` produces a properly pre-filtered radiance mip chain — which is what makes a rough surface and a polished one reflect the same room convincingly.

Resolution per tier: desktop `256`, tablet `192`, mobile `128`.

### Direct lights

Keep a few direct lights as accents only — soft front key, red side rim, cool silver rim, optional moving specular light. The image-based lighting now carries the modelling, so these sit well below the intensities a rig without an environment map would need.

Avoid expensive real-time shadows unless they add visible value. The can floats in an abstract void; a contact shadow would imply a ground plane the composition does not have.

Use bloom only for the “First Sip” payoff:

- Keep bloom at or near zero elsewhere
- Animate bloom intensity up briefly
- Return it quickly to a restrained level
- Disable bloom on mobile and reduced-motion modes

Do not apply permanent bloom to white text or the entire interface.

---

# 12. Page chapters

Build six connected sections.

Each section must have a unique semantic `<section>` element, an accessible heading and sufficient scroll height for its animation.

---

## Section 1: The Drop

Section ID:

```text
hero
```

Chapter label:

```text
00 — THE DROP
```

Headline:

```text
REAL TASTE.
ZERO SUGAR.
```

Supporting copy:

```text
The black can that gives up nothing.
```

Scroll hint:

```text
SCROLL TO CRACK IT OPEN
```

### Composition

- Begin in a near-black void.
- Place the can in the center.
- Initially reveal only its silhouette, top rim, condensation and one thin red reflection.
- Keep the atmosphere quiet.
- Reveal the headline using a vertical mask or clipped line reveal.
- Place a small campaign mark in one corner.
- Add a minimal fixed navigation.

Suggested navigation:

- Story
- Moments
- Get Zero

Do not create a crowded navigation bar.

### Motion

As the user scrolls:

- The camera slowly approaches the can.
- The can rotates only a few degrees.
- The red rim light travels along the aluminum.
- Headline lines reveal in sequence.
- The scroll hint bounces gently, then fades.
- The transition into the next section begins by moving the can left.

The hero must load as a convincing static composition before scrolling begins.

---

## Section 2: Spin It

Section ID:

```text
can
```

Chapter label:

```text
01 — THE CAN
```

Headline:

```text
EVERY ANGLE.
ZERO REGRET.
```

Badge:

```text
NEW LOOK
```

### Composition

- Move the can to the left half of the screen.
- Position the copy on the right.
- Keep the copy readable without requiring the user to wait for a specific animation frame.
- The can already carries baked condensation; a few larger beads run down it here.
- Present the “NEW LOOK” badge at a slight angle.

### Motion

Across this section:

- Orbit the camera approximately 180 degrees around the can on desktop.
- Use approximately 90 degrees on tablet.
- Use 45–60 degrees on mobile.
- Move a sharp specular glint along the can during the orbit.
- Let the running beads travel slowly downward, stretching as they accelerate.
- Pop the badge in using `back.out(1.8)`.
- Reveal the headline in two controlled beats.
- Keep the can rotation synchronized with the camera rather than allowing uncontrolled spinning.

Do not provide drag-to-spin interaction. The product choreography should remain authored.

---

## Section 3: Science of Nothing

Section ID:

```text
science
```

Chapter label:

```text
02 — THE IMPOSSIBLE PART
```

Question:

```text
HOW DO YOU FIT ALL THE TASTE INTO NOTHING?
```

Metric chips:

```text
0g
SUGAR
```

```text
0
CALORIES
```

```text
FULL
FLAVOR
```

Do not use the unsupported claim “100% taste.”

### Composition

- Push toward the can and transition into an abstract liquid environment.
- Use a blurred surface card for the question.
- Underline the word “NOTHING” with a red stroke that draws from left to right.
- Arrange the three metrics as compact, high-contrast chips.
- Keep the environment dark enough for the content to remain legible.

### Motion

- Increase bubble density and speed.
- Add restrained screen distortion.
- Count the metrics up only when the section first becomes visible.
- Trigger one bubble burst at approximately 50% section progress.
- Draw the red underline.
- Move the camera through the bubble field.
- Build tension without reaching maximum visual intensity yet.

Use HTML for all metrics and text.

---

## Section 4: First Sip

Section ID:

```text
sip
```

Chapter label:

```text
03 — THE FIRST SIP
```

Headline:

```text
AHH.
```

Supporting line:

```text
THAT IS THE POINT.
```

This is the main emotional payoff.

### Motion sequence

1. Hold the scene briefly in near-black.
2. Start a circular clip-path wipe from the can’s approximate screen position.
3. Expand the wipe until the viewport becomes red.
4. Accelerate the bubble field.
5. Perform a short, controlled camera whip.
6. Spike bloom briefly.
7. Reveal “AHH.” with a scale punch and small overshoot.
8. Reveal the supporting line.
9. Hold for a short beat.
10. Recede from red back to black.
11. Settle the camera before entering the lifestyle chapter.

Do not make the camera whip disorienting.

Do not flash between red and white.

Do not autoplay sound. The visual sequence must work silently.

---

## Section 5: Where Zero Lives

Section ID:

```text
moments
```

Chapter label:

```text
04 — WHERE ZERO LIVES
```

Use a desktop pinned horizontal sequence containing four cards.

The cards must communicate specific human moments rather than generic marketing categories.

### Card 1

Title:

```text
GAME NIGHT
```

Copy:

```text
One more round became four.
```

### Card 2

Title:

```text
POST-GYM
```

Copy:

```text
The workout ended. The momentum did not.
```

### Card 3

Title:

```text
THE DESK
```

Copy:

```text
The idea arrived after midnight.
```

### Card 4

Title:

```text
THE TABLE
```

Copy:

```text
Nobody planned to stay this long.
```

### Card art direction

Each card should feel like a stylized editorial moment.

Use local licensed imagery when available.

When photography is unavailable:

- Use sophisticated abstract compositions
- Use local SVG illustrations or CSS shapes
- Avoid hotlinking remote stock images
- Do not display broken placeholder icons
- Preserve enough contrast for the copy

### Motion

Desktop:

- Pin the section.
- Convert vertical progress into horizontal card movement.
- Apply restrained internal parallax to each card.
- Move the single can above the card rail at a smaller scale.
- Rotate the can subtly as it crosses the rail.
- Add a reversed marquee:

```text
ZERO SUGAR ★ FULL FLAVOR ★ ZERO SUGAR ★ FULL FLAVOR ★
```

Tablet:

- Allow a shorter horizontal sequence or native horizontal snapping.
- Avoid excessive pin duration.

Mobile:

- Do not pin the section.
- Stack the cards vertically.
- Keep the can near the section header or remove its traveling animation.
- Use a standard vertical narrative.
- Pause or simplify the marquee.

The section must remain navigable by keyboard and usable without smooth scrolling.

---

## Section 6: Grab Yours

Section ID:

```text
get-zero
```

Chapter label:

```text
05 — YOUR MOVE
```

Headline:

```text
YOURS IS
WAITING.
```

Primary CTA:

```text
BUY A 6-PACK
```

Secondary CTA:

```text
FIND IT NEAR ME
```

Flavor controls:

- Original
- Cherry
- Vanilla

### Composition

- Return the can to a composition closely related to the opening hero pose.
- Fully illuminate it.
- Use a slow final rotation.
- Complete the red-light motif around the can.
- Place the headline on one side and controls on the other where space permits.
- End with a minimal footer.

The buttons may link to placeholder destinations such as `#` but must behave as real anchors or buttons. Prevent unwanted page jumps when using placeholders.

Clearly comment where production URLs should be inserted.

### Flavor interaction

Hovering or focusing each flavor changes the can’s flavor band.

Clicking selects and persists that flavor.

Communicate the selected flavor with more than color alone:

- Text state
- Border state
- `aria-pressed`
- Visible indicator

### Finale

The final can motion should be calm. The page should end with control and desire, not another explosion.

---

## 13. Magnetic buttons

Create a reusable `MagneticButton` component.

On fine-pointer devices:

- Detect pointer movement within approximately 80 pixels.
- Translate the button up to 12 pixels toward the pointer.
- Translate the inner label by a smaller independent amount.
- Return smoothly to the origin on pointer leave.
- Use `requestAnimationFrame` or GSAP quick setters.
- Do not trigger React state updates on every pointer event.

Disable magnetic movement on:

- Coarse pointers
- Touch devices
- Reduced-motion mode

The button must remain a normal accessible link or button.

---

## 14. Marquees

Create an infinite marquee component with duplicated content.

Requirements:

- Seamless loop
- No visible jump
- `aria-hidden="true"` on decorative duplicate content
- No unnecessary DOM replication
- Paused or static in reduced-motion mode
- Slower speed on mobile
- Reverse direction in the lifestyle chapter

Do not make the marquee the dominant visual element.

---

## 15. Lenis, GSAP and React integration

Create one Lenis instance for the page.

Coordinate Lenis with GSAP and ScrollTrigger.

Requirements:

- Feed Lenis scroll updates into `ScrollTrigger.update()`
- Drive Lenis from the GSAP ticker or a single controlled animation loop
- Avoid multiple competing `requestAnimationFrame` loops
- Refresh ScrollTrigger after fonts, dimensions and critical assets are ready
- Kill ScrollTriggers and remove listeners during cleanup
- Avoid React Strict Mode creating duplicate timelines
- Use `useGSAP()` or `gsap.context()` for scoped cleanup
- Use `gsap.matchMedia()` for responsive timelines
- Do not write dozens of isolated `useEffect()` animation blocks

Prefer a small number of clearly named timelines:

- `heroTimeline`
- `spinTimeline`
- `scienceTimeline`
- `sipTimeline`
- `momentsTimeline`
- `ctaTimeline`

The 3D scene should expose mutable animation values through refs or a small scene store. Do not send high-frequency animation data through React state.

---

## 16. Responsive behavior

Create explicit responsive tiers.

### Desktop: 1024px and above

- Full camera choreography
- Up to 4,000 bubbles
- 180-degree orbit
- Pinned horizontal lifestyle section
- Magnetic buttons
- Bloom enabled during the payoff
- Device pixel ratio capped at 1.5

### Tablet: 768px–1023px

- Up to 1,600 bubbles
- Approximately 90-degree orbit
- Shorter pinned or native horizontal lifestyle sequence
- Reduced post-processing
- Device pixel ratio capped at 1.25

### Mobile: below 768px

- 600–800 bubbles
- 45–60-degree orbit
- No heavy pinned horizontal scroll
- Vertical lifestyle cards
- No magnetic pointer behavior
- No bloom
- Reduced distortion
- Fewer lighting calculations
- Device pixel ratio capped at 1
- Shorter section heights
- Large tap targets
- No text smaller than approximately 14px for functional content

Mobile must be intentionally composed. Do not merely shrink the desktop design.

---

## 17. Reduced-motion mode

Respect `prefers-reduced-motion: reduce`.

Reduced-motion behavior must:

- Disable Lenis smooth scrolling
- Disable camera scrubbing
- Disable camera whip
- Disable scale-punch effects
- Disable bubble animation or use a nearly static field
- Disable pinned horizontal scrolling
- Stack lifestyle cards vertically
- Stop marquees
- Disable magnetic buttons
- Disable bloom
- Show text immediately
- Use short opacity transitions only where appropriate
- Keep the can in stable section-specific poses
- Preserve all information and CTAs

Do not solve reduced motion by hiding the visual experience entirely.

---

## 18. Accessibility

Include:

- Semantic landmarks
- Skip-to-content link
- Logical heading hierarchy
- Descriptive section labels
- Keyboard-accessible controls
- Visible focus styles
- Sufficient text contrast
- Minimum comfortable button sizes
- `aria-pressed` for flavor selection
- Decorative canvas hidden from assistive technology
- Useful fallback content when WebGL fails
- No essential information encoded only through color or movement

The canvas should use an appropriate accessible treatment such as:

```tsx
aria-hidden="true"
```

Do not trap the user inside pinned content.

Do not replace browser scrolling with drag-only behavior.

---

## 19. Loading and failure states

The text interface must appear before the Three.js scene finishes initializing.

Add a minimal canvas loading treatment:

- Small progress line or subtle status indicator
- No full-screen blocking loader
- Fade the canvas in once ready
- Do not hide the hero text while loading

Handle:

- WebGL unavailable
- WebGL context lost
- Texture failure
- Font failure
- JavaScript disabled
- Low-powered devices

For WebGL failure, display a static CSS-rendered black can silhouette or a local fallback image while retaining the complete HTML experience.

---

## 20. Performance requirements

Target smooth motion rather than maximum visual complexity.

Requirements:

- Lazy-load the complete Three.js experience
- Avoid unnecessary React rerenders
- Reuse geometries and materials
- Reuse particle buffers
- Avoid allocating objects inside the render loop
- Use refs for high-frequency values
- Cap device pixel ratio
- Pause expensive rendering when the page is hidden
- Stop or reduce scene work when the canvas is outside meaningful sections
- Avoid large remote assets
- Compress local images
- Use AVIF or WebP where practical
- Keep SVGs optimized
- Avoid runtime layout measurement on every frame
- Use CSS transforms and opacity for HTML animation
- Debounce resize work
- Refresh ScrollTrigger intentionally
- Prevent cumulative layout shift
- Avoid console warnings and hydration mismatches

The project should remain visually convincing when post-processing is disabled.

### Measured budget

The rebuilt can hits the following. Treat these as the ceiling, not a starting point:

| | Desktop | Mobile |
| --- | --- | --- |
| Triangles | ~12.7k | ~8.2k |
| Draw calls | 9 | 9 |
| Texture memory | ~23 MB | ~5.7 MB |
| Network bytes for the 3D | 0 | 0 |
| Texture generation | ~85 ms once | ~40 ms once |

Notes on how that is held:

- The whole shell is **one mesh with three material groups**, so the silhouette costs three draw calls rather than a dozen primitives.
- Texture memory came down from ~39 MB by running the condensation maps at half width and the tint mask at `256px`. Raising either back to full resolution is the easiest way to undo this.
- Nothing is downloaded, so there is no decode stall, no CDN round trip and no cache-miss cliff on first paint.

---

## 21. SEO and metadata

Add appropriate metadata in `app/layout.tsx`:

- Title
- Description
- Open Graph title
- Open Graph description
- Theme color
- Favicon or generated icon
- Social preview image

Suggested title:

```text
ZERO — Real Taste. Zero Sugar.
```

Suggested description:

```text
A kinetic Coca-Cola Zero Sugar product experience built with Next.js and Three.js.
```

Metadata may name the product, since the pack now carries real trade dress (§1). Do not imply the site is official or endorsed.

---

## 22. Vercel deployment

The project must deploy to Vercel without custom infrastructure.

Requirements:

- No hardcoded localhost URLs
- No secrets required
- No required environment variables
- No Node-only code inside client components
- No browser APIs during server rendering
- No remote image domain dependency unless explicitly configured
- Production build must complete with `npm run build`
- ESLint must pass
- TypeScript must pass
- Include a committed lockfile
- Include a useful README

Do not create `vercel.json` unless a concrete configuration requires it. Prefer Next.js and Vercel defaults.

The README must include:

```bash
npm install
npm run dev
npm run build
npm start
```

Also include Vercel deployment instructions:

1. Push the repository to GitHub, GitLab or Bitbucket.
2. Import the repository into Vercel.
3. Allow Vercel to detect Next.js automatically.
4. Use the default build command.
5. Use preview deployments for branches and pull requests.
6. Promote or merge the approved build to production.

Add a note explaining where to replace placeholder CTA links and local image assets.

---

## 23. Code quality requirements

Use:

- Clear TypeScript types
- Small focused components
- Named constants
- Reusable motion tokens
- Comments for complex scene transitions
- Clean animation cleanup
- Consistent naming
- No dead code
- No fake APIs
- No placeholder TODOs for core functionality
- No enormous monolithic page component

Avoid:

- `any` unless unavoidable and explained
- React state inside frame loops
- Repeated event listeners
- Duplicate ScrollTriggers
- Global mutable variables without structure
- Hardcoded animation values scattered across components
- Unnecessary dependencies
- Copying code from unrelated demos
- Rendering text into the canvas when HTML is more appropriate

---

## 24. Acceptance criteria

The result is complete only when all of the following are true:

### Build

- `npm install` succeeds
- `npm run build` succeeds
- TypeScript has no errors
- There are no hydration errors
- There are no persistent console warnings
- The Vercel deployment succeeds

### Story

- All six chapters exist
- The transition from void to life is understandable
- The can remains the visual anchor
- The camera journey feels continuous
- The First Sip sequence is the main payoff
- The CTA ending returns to the visual language of the hero

### Three.js

- One primary can instance is used
- One particle system is used
- The can is generated at runtime, with no downloaded model or texture
- The silhouette carries the base dome, necked shoulder, double seam and stay-on-tab
- The Coca-Cola script reads clearly at hero scale and wraps without splitting at the seam
- The can has convincing metallic shading, with vertical softbox bands rather than round hotspots
- The lid reads as silver aluminium, not as a mirror of the brand rake
- Condensation reads through specular and normal, not as bright speckle in albedo
- The flavor band changes interactively, without regenerating any texture
- Camera states are centralized
- Scene resources are cleaned up properly

### Motion

- Lenis and ScrollTrigger remain synchronized
- No section produces uncontrolled scroll jumps
- The camera never visibly teleports
- Effects remain restrained outside the payoff
- Pinned behavior releases correctly
- Animations work when scrolling forward and backward

### Responsive behavior

- Desktop, tablet and mobile compositions are intentionally different
- Mobile does not use the full desktop particle count
- Mobile lifestyle cards are vertical
- Text does not overflow
- Buttons remain easy to tap
- Landscape mobile remains usable

### Accessibility

- Keyboard navigation works
- Focus states are visible
- Reduced-motion mode tells the complete story
- The page remains useful without WebGL
- The canvas does not interfere with assistive technology
- Flavor selection is not communicated by color alone

### Performance

- No severe frame-rate collapse during normal desktop use
- No repeated geometry or material allocation inside the frame loop
- The canvas is lazy-loaded
- Expensive effects are disabled on mobile
- The experience remains usable while assets load
- The can stays within the §20 budget: 9 draw calls, ~23 MB of textures on desktop, zero network bytes
- No `transmission` anywhere in the scene

---

## 25. Final delivery

Return the complete working project, not just isolated snippets.

Include:

1. All Next.js source files
2. All React components
3. Three.js scene implementation
4. GSAP and ScrollTrigger timelines
5. Lenis integration
6. Responsive behavior
7. Reduced-motion behavior
8. WebGL fallback
9. Metadata
10. README
11. Installation instructions
12. Vercel deployment instructions
13. A concise explanation of the architecture
14. A list of any local assets that still need to be supplied

The finished result should feel:

- Premium
- Physical
- Playful
- Fast
- Cohesive
- Human
- Conversion-focused

It must not feel:

- Like a generic template
- Like a cyberpunk demo
- Like a clone of Apple
- Like an official Coca-Cola property
- Like six unrelated animations
- Like a desktop design reluctantly squeezed onto mobile

Prioritize narrative clarity, product presence and smooth execution over adding more effects.
