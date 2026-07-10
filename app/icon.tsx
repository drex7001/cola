import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#050505",
          border: "2px solid #f40009",
          color: "white",
          display: "flex",
          fontFamily: "Arial Black, sans-serif",
          fontSize: 23,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-2px",
          width: "100%",
        }}
      >
        ZR
      </div>
    ),
    size,
  );
}
