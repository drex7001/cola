import { ImageResponse } from "next/og";

export const alt = "ZERO — Real Taste. Zero Sugar.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#050505",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          overflow: "hidden",
          padding: "74px 88px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#f40009",
            borderRadius: "999px",
            filter: "blur(70px)",
            height: 320,
            opacity: 0.35,
            position: "absolute",
            right: 70,
            width: 320,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ color: "#f40009", fontFamily: "Arial, sans-serif", fontSize: 22, letterSpacing: 8 }}>
            FICTIONAL COLA CONCEPT
          </span>
          <strong
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: "Arial Black, sans-serif",
              fontSize: 94,
              letterSpacing: -6,
              lineHeight: 0.88,
            }}
          >
            <span>REAL TASTE.</span>
            <span>ZERO SUGAR.</span>
          </strong>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(90deg, #171717, #030303 55%, #262626)",
            border: "2px solid #656565",
            borderRadius: 60,
            boxShadow: "0 0 0 10px #080808, 0 0 60px rgba(244,0,9,.5)",
            display: "flex",
            height: 420,
            justifyContent: "center",
            transform: "rotate(7deg)",
            width: 172,
          }}
        >
          <span style={{ fontFamily: "Arial Black, sans-serif", fontSize: 38, letterSpacing: -3, transform: "rotate(-90deg)" }}>
            ZERO
          </span>
        </div>
      </div>
    ),
    size,
  );
}
