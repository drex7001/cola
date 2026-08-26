/**
 * Editorial artwork for the "Where Zero Lives" cards.
 *
 * These replace a pair of absolutely-positioned <span> gradients per card,
 * which read as unrelated blobs rather than as places. Each scene is built the
 * same way: light first, object second. The mood should land before the
 * subject does, so the silhouettes sit at low contrast and let the lighting
 * carry the read — closer to a photograph shot in the dark than to an icon.
 *
 * All four are inline SVG with gradients only. No filters: a Gaussian blur on
 * four full-bleed panels would be re-rasterised on every frame of the
 * horizontal scrub, and gradients buy the same softness for nothing.
 */

type ArtProps = { id: string };

const VIEW_BOX = '0 0 1200 900';

const svgProps = {
  viewBox: VIEW_BOX,
  preserveAspectRatio: 'xMidYMid slice',
  xmlns: 'http://www.w3.org/2000/svg',
  className: 'moment-art',
} as const;

/** Game night — a room lit only by the screen everyone is shouting at. */
function GameNightArt({ id }: ArtProps) {
  return (
    <svg {...svgProps}>
      <defs>
        <radialGradient id={`${id}-room`} cx="50%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#20161a" />
          <stop offset="55%" stopColor="#0b0a0c" />
          <stop offset="100%" stopColor="#040405" />
        </radialGradient>
        <radialGradient id={`${id}-spill`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5a63" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#c11018" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#c11018" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-panel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7d2b31" />
          <stop offset="38%" stopColor="#4d1116" />
          <stop offset="100%" stopColor="#1b0708" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6b73" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8f9299" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={`${id}-pad`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#1c1d21" />
          <stop offset="100%" stopColor="#08090b" />
        </linearGradient>
      </defs>

      <rect width="1200" height="900" fill={`url(#${id}-room)`} />
      <ellipse cx="600" cy="250" rx="620" ry="360" fill={`url(#${id}-spill)`} />

      {/* The screen itself, seen slightly off-axis. Deliberately dim: it is the
          light source, and a bright fill here flattens the whole card. */}
      <g>
        <path d="M348 150 L866 134 L874 396 L342 386 Z" fill={`url(#${id}-panel)`} />
        <path
          d="M348 150 L866 134 L874 396 L342 386 Z"
          fill="none"
          stroke="#ff8f95"
          strokeOpacity="0.4"
          strokeWidth="2"
        />
        {/* Abstract HUD bars, kept very simple so they read as light not detail. */}
        <rect x="386" y="186" width="188" height="11" rx="5" fill="#ff5a63" opacity="0.7" />
        <rect x="386" y="214" width="116" height="9" rx="4" fill="#ffffff" opacity="0.34" />
        <rect x="700" y="182" width="142" height="9" rx="4" fill="#ffffff" opacity="0.3" />
        <rect x="386" y="344" width="436" height="7" rx="3" fill="#ffffff" opacity="0.18" />
      </g>

      {/* Light pooling on the floor in front of the screen. */}
      <ellipse cx="606" cy="474" rx="430" ry="78" fill="#ff2d3b" opacity="0.12" />

      {/* Controller silhouette, rim-lit by the panel behind it. */}
      <g transform="translate(600 512) scale(0.86) translate(-600 -700)">
        <path
          d="M436 646 C400 646 378 682 372 720 C363 770 378 806 408 808 C434 810 450 786 466 758
             L540 742 L668 742 L742 758 C758 786 774 810 800 808 C830 806 845 770 836 720
             C830 682 808 646 772 646 C726 640 692 654 604 654 C516 654 482 640 436 646 Z"
          fill={`url(#${id}-pad)`}
        />
        <path
          d="M436 646 C400 646 378 682 372 720 C363 770 378 806 408 808 C434 810 450 786 466 758
             L540 742 L668 742 L742 758 C758 786 774 810 800 808 C830 806 845 770 836 720
             C830 682 808 646 772 646 C726 640 692 654 604 654 C516 654 482 640 436 646 Z"
          fill="none"
          stroke={`url(#${id}-rim)`}
          strokeWidth="2.5"
        />
        <path d="M452 700 h68 M486 666 v68" stroke="#5b5e66" strokeWidth="13" strokeLinecap="round" />
        <circle cx="716" cy="676" r="12" fill="#5b5e66" />
        <circle cx="750" cy="704" r="12" fill="#5b5e66" />
        <circle cx="682" cy="704" r="12" fill="#5b5e66" />
        <circle cx="716" cy="732" r="12" fill="#f40009" opacity="0.85" />
        <circle cx="566" cy="736" r="26" fill="#101116" stroke="#4a4d54" strokeWidth="3" />
        <circle cx="646" cy="736" r="26" fill="#101116" stroke="#4a4d54" strokeWidth="3" />
      </g>
    </svg>
  );
}

/** Post-gym — one hard shaft of light, chrome, and the arc of the last rep. */
function PostGymArt({ id }: ArtProps) {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id={`${id}-room`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#15181c" />
          <stop offset="60%" stopColor="#0a0b0d" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        <radialGradient id={`${id}-shaft`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3e44" />
          <stop offset="22%" stopColor="#eef1f4" />
          <stop offset="46%" stopColor="#9aa0a8" />
          <stop offset="62%" stopColor="#dfe3e7" />
          <stop offset="100%" stopColor="#2b2e33" />
        </linearGradient>
        <linearGradient id={`${id}-plate`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#2a2d33" />
          <stop offset="45%" stopColor="#111316" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        <linearGradient id={`${id}-arc`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f40009" stopOpacity="0" />
          <stop offset="45%" stopColor="#ff2d3b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f40009" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="900" fill={`url(#${id}-room)`} />
      <ellipse cx="410" cy="150" rx="520" ry="430" fill={`url(#${id}-shaft)`} />

      {/* The arc of the bar's last rep, drawn as motion rather than an object. */}
      <path
        d="M232 486 C360 246 840 246 968 486"
        fill="none"
        stroke={`url(#${id}-arc)`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M280 530 C400 322 800 322 920 530"
        fill="none"
        stroke="#ff2d3b"
        strokeOpacity="0.1"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <g transform="translate(578 388) rotate(-7) translate(-600 -512)">
        {/* Bar, with knurling where the hands go. */}
        <rect x="360" y="492" width="480" height="40" rx="20" fill={`url(#${id}-bar)`} />
        <g stroke="#5c6067" strokeOpacity="0.55" strokeWidth="2">
          {Array.from({ length: 9 }, (_, index) => 424 + index * 11).map((x) => (
            <line key={`l${x}`} x1={x} y1="500" x2={x} y2="524" />
          ))}
          {Array.from({ length: 9 }, (_, index) => 692 + index * 11).map((x) => (
            <line key={`r${x}`} x1={x} y1="500" x2={x} y2="524" />
          ))}
        </g>

        {/* Collars and plates. */}
        <rect x="344" y="480" width="26" height="64" rx="8" fill="#43474e" />
        <rect x="830" y="480" width="26" height="64" rx="8" fill="#43474e" />
        <rect x="252" y="386" width="96" height="252" rx="26" fill={`url(#${id}-plate)`} />
        <rect x="852" y="386" width="96" height="252" rx="26" fill={`url(#${id}-plate)`} />
        <rect
          x="252"
          y="386"
          width="96"
          height="252"
          rx="26"
          fill="none"
          stroke="#7f858d"
          strokeOpacity="0.5"
          strokeWidth="2.5"
        />
        <rect
          x="852"
          y="386"
          width="96"
          height="252"
          rx="26"
          fill="none"
          stroke="#7f858d"
          strokeOpacity="0.5"
          strokeWidth="2.5"
        />
        <rect x="176" y="424" width="78" height="176" rx="22" fill={`url(#${id}-plate)`} />
        <rect x="946" y="424" width="78" height="176" rx="22" fill={`url(#${id}-plate)`} />
      </g>

      <ellipse cx="578" cy="606" rx="300" ry="20" fill="#000000" opacity="0.4" />
      <ellipse cx="578" cy="602" rx="200" ry="11" fill="#ff2d3b" opacity="0.13" />
    </svg>
  );
}

/** The desk — one lamp, one screen, and an idea that arrived too late. */
function DeskArt({ id }: ArtProps) {
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id={`${id}-room`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#14100f" />
          <stop offset="55%" stopColor="#0a0908" />
          <stop offset="100%" stopColor="#040404" />
        </linearGradient>
        <radialGradient id={`${id}-cone`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd9a8" stopOpacity="0.3" />
          <stop offset="45%" stopColor="#ffb066" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff9040" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-screen`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#3a1216" />
          <stop offset="45%" stopColor="#12080a" />
          <stop offset="100%" stopColor="#080606" />
        </linearGradient>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c2e33" />
          <stop offset="100%" stopColor="#0c0d0f" />
        </linearGradient>
        <radialGradient id={`${id}-bloom`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff2d3b" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ff2d3b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="900" fill={`url(#${id}-room)`} />
      <ellipse cx="210" cy="120" rx="520" ry="440" fill={`url(#${id}-cone)`} />
      <ellipse cx="628" cy="360" rx="440" ry="240" fill={`url(#${id}-bloom)`} />

      {/* Laptop, three-quarter view. Kept as flat quads — perspective by shape. */}
      <g transform="translate(0 -104)">
        <path d="M404 262 L822 232 L846 508 L392 528 Z" fill={`url(#${id}-screen)`} />
        <path
          d="M404 262 L822 232 L846 508 L392 528 Z"
          fill="none"
          stroke="#6d7178"
          strokeOpacity="0.55"
          strokeWidth="2.5"
        />
        <path d="M430 292 L800 266 L818 486 L420 500 Z" fill="#f40009" opacity="0.13" />
        <rect x="452" y="318" width="180" height="9" rx="4" fill="#ff8288" opacity="0.5" />
        <rect x="452" y="344" width="252" height="7" rx="3" fill="#ffffff" opacity="0.16" />
        <rect x="452" y="366" width="210" height="7" rx="3" fill="#ffffff" opacity="0.12" />
        <rect x="452" y="388" width="268" height="7" rx="3" fill="#ffffff" opacity="0.1" />
        <path d="M392 528 L846 508 L924 590 L330 606 Z" fill={`url(#${id}-base)`} />
        <path
          d="M392 528 L846 508 L924 590 L330 606 Z"
          fill="none"
          stroke="#7f838a"
          strokeOpacity="0.4"
          strokeWidth="2"
        />
        <path d="M576 592 L700 588 L706 598 L570 602 Z" fill="#4a4d53" opacity="0.7" />
      </g>

      {/* Mug, catching the lamp on one side only. */}
      <g transform="translate(946 366)">
        <path d="M0 0 h108 v104 a30 30 0 0 1 -30 30 h-48 a30 30 0 0 1 -30 -30 Z" fill="#16171a" />
        <path
          d="M0 0 h108 v104 a30 30 0 0 1 -30 30 h-48 a30 30 0 0 1 -30 -30 Z"
          fill="none"
          stroke="#ffc98f"
          strokeOpacity="0.4"
          strokeWidth="2.5"
        />
        <path d="M108 26 a30 30 0 0 1 0 58" fill="none" stroke="#8a8d93" strokeOpacity="0.45" strokeWidth="7" />
        <ellipse cx="54" cy="0" rx="54" ry="13" fill="#0a0a0c" stroke="#9b9ea4" strokeOpacity="0.35" strokeWidth="2" />
      </g>

      {/* Desk surface catching the spill. */}
      <ellipse cx="620" cy="524" rx="520" ry="56" fill="#000000" opacity="0.5" />
      <path d="M170 486 L306 448" stroke="#d5d8da" strokeOpacity="0.55" strokeWidth="7" strokeLinecap="round" />
      <path d="M306 448 L336 440" stroke="#f40009" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

/** The table — shot from above, late, after everything has been pushed around. */
function TableArt({ id }: ArtProps) {
  return (
    <svg {...svgProps}>
      <defs>
        <radialGradient id={`${id}-room`} cx="50%" cy="48%" r="70%">
          <stop offset="0%" stopColor="#1b1512" />
          <stop offset="60%" stopColor="#0b0908" />
          <stop offset="100%" stopColor="#040404" />
        </radialGradient>
        <radialGradient id={`${id}-pendant`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffca8a" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#ff9b52" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ff9b52" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-top`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#241a15" />
          <stop offset="50%" stopColor="#140f0c" />
          <stop offset="100%" stopColor="#0a0707" />
        </linearGradient>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#2b2c30" />
          <stop offset="100%" stopColor="#101113" />
        </linearGradient>
      </defs>

      <rect width="1200" height="900" fill={`url(#${id}-room)`} />
      <ellipse cx="600" cy="340" rx="560" ry="420" fill={`url(#${id}-pendant)`} />

      {/* Table top. */}
      <ellipse cx="600" cy="356" rx="470" ry="318" fill={`url(#${id}-top)`} />
      <ellipse
        cx="600"
        cy="468"
        rx="470"
        ry="330"
        fill="none"
        stroke="#c79b6d"
        strokeOpacity="0.28"
        strokeWidth="2.5"
      />
      <ellipse cx="600" cy="356" rx="392" ry="256" fill="none" stroke="#ffffff" strokeOpacity="0.04" strokeWidth="1.5" />

      {/* Plates, pushed out of alignment. */}
      {[
        { x: 346, y: 256, r: 88 },
        { x: 846, y: 296, r: 80 },
        { x: 452, y: 484, r: 74 },
      ].map((plate) => (
        <g key={`${plate.x}-${plate.y}`}>
          <ellipse cx={plate.x} cy={plate.y + 10} rx={plate.r} ry={plate.r * 0.7} fill="#000" opacity="0.5" />
          <ellipse cx={plate.x} cy={plate.y} rx={plate.r} ry={plate.r * 0.7} fill={`url(#${id}-plate)`} />
          <ellipse
            cx={plate.x}
            cy={plate.y}
            rx={plate.r}
            ry={plate.r * 0.7}
            fill="none"
            stroke="#d8dade"
            strokeOpacity="0.5"
            strokeWidth="2"
          />
          <ellipse
            cx={plate.x}
            cy={plate.y}
            rx={plate.r * 0.62}
            ry={plate.r * 0.44}
            fill="none"
            stroke="#d8dade"
            strokeOpacity="0.16"
            strokeWidth="1.5"
          />
          <g stroke="#c3c7cc" strokeOpacity="0.4" strokeLinecap="round">
            <line
              x1={plate.x - plate.r - 20}
              y1={plate.y - 22}
              x2={plate.x - plate.r - 20}
              y2={plate.y + 22}
              strokeWidth="5"
            />
            <line
              x1={plate.x + plate.r + 18}
              y1={plate.y - 24}
              x2={plate.x + plate.r + 18}
              y2={plate.y + 24}
              strokeWidth="4"
            />
            <line
              x1={plate.x + plate.r + 30}
              y1={plate.y - 20}
              x2={plate.x + plate.r + 30}
              y2={plate.y + 20}
              strokeWidth="3"
            />
          </g>
        </g>
      ))}

      {/* Glasses, read as rings from directly overhead. */}
      {[
        { x: 690, y: 452, r: 40 },
        { x: 788, y: 500, r: 32 },
        { x: 426, y: 366, r: 29 },
      ].map((glass) => (
        <g key={`g${glass.x}`}>
          <ellipse cx={glass.x} cy={glass.y} rx={glass.r} ry={glass.r * 0.72} fill="#0b0c0e" opacity="0.9" />
          <ellipse
            cx={glass.x}
            cy={glass.y}
            rx={glass.r}
            ry={glass.r * 0.72}
            fill="none"
            stroke="#eaedf0"
            strokeOpacity="0.5"
            strokeWidth="2.5"
          />
          <ellipse
            cx={glass.x}
            cy={glass.y}
            rx={glass.r * 0.6}
            ry={glass.r * 0.42}
            fill="none"
            stroke="#eaedf0"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* The one red note on the table: a folded napkin, not a envelope. The
          crease runs the long way so it never reads as a mail glyph. */}
      <g transform="translate(628 214) rotate(-17)">
        <rect x="-96" y="-64" width="192" height="128" rx="10" fill="#c8080f" />
        <rect x="-96" y="-64" width="192" height="128" rx="10" fill="none" stroke="#ff8288" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M-96 -8 h192" stroke="#8c0409" strokeOpacity="0.7" strokeWidth="3" />
        <path d="M-52 -64 v128" stroke="#ff6169" strokeOpacity="0.24" strokeWidth="2" />
        <path d="M96 24 L40 64 L96 64 Z" fill="#8c0409" opacity="0.85" />
        <path d="M96 24 L40 64" stroke="#ff8288" strokeOpacity="0.35" strokeWidth="2" />
      </g>
    </svg>
  );
}

const ART_BY_ID: Record<string, (props: ArtProps) => React.JSX.Element> = {
  'game-night': GameNightArt,
  'post-gym': PostGymArt,
  'the-desk': DeskArt,
  'the-table': TableArt,
};

export function MomentArt({ id }: ArtProps) {
  const Art = ART_BY_ID[id];
  return Art ? <Art id={id} /> : null;
}
