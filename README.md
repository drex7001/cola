# ZERO — Kinetic Cola Concept

A production-ready, single-page product story for a fictional cola-zero drink. The experience combines semantic HTML, a persistent procedural Three.js can, responsive GSAP choreography, and a complete non-WebGL fallback. It uses an original geometric `ZERO` campaign mark and is not affiliated with any beverage company.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production check

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Architecture

- `app/` contains metadata, generated social artwork, the App Router entrypoint, and global presentation.
- `components/sections/` contains the six semantic story chapters. Essential text and controls render before WebGL initializes.
- `components/experience/` contains one fixed React Three Fiber canvas, one procedural can, one persistent bubble field, studio lighting, camera rig, and CSS fallback.
- `components/providers/` coordinates one Lenis instance with named GSAP/ScrollTrigger timelines.
- `lib/cameraStates.ts` is the single source of truth for the six scene poses. `lib/sceneStore.ts` exposes mutable frame data without sending scroll updates through React state.
- `hooks/` centralizes responsive, reduced-motion, pointer, and WebGL capability decisions.

Desktop receives the full camera journey and pinned lifestyle rail. Tablet uses a shorter sequence. Mobile and reduced-motion modes use an intentionally composed vertical story, lower particle count, stable camera poses, no bloom, and no pinned scrolling.

## Deploy to Vercel

1. Push the repository to GitHub, GitLab or Bitbucket.
2. Import the repository into Vercel.
3. Allow Vercel to detect Next.js automatically.
4. Use the default build command.
5. Use preview deployments for branches and pull requests.
6. Promote or merge the approved build to production.

No secrets, environment variables, remote image hosts, or custom Vercel configuration are required.

## Production handoff

The two CTA destinations are deliberately fictional. Replace the commented placeholder destinations in `components/sections/CTASection.tsx` with production commerce and store-locator URLs.

No local assets are required: the can, label, editorial moment artwork, icon, and social preview are generated procedurally with Three.js, CSS, and Next.js image routes. If licensed campaign photography or typefaces become available, add them under `public/images/` and `public/fonts/` and update the related CSS without introducing remote hotlinks.

## Brand note

This project intentionally avoids real beverage wordmarks, packaging, slogans, ribbon devices, bottle silhouettes, and trade dress.
