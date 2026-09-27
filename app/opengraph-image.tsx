import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const markPath = join(process.cwd(), "public/logo/orbital-mark-white.png");
  const markSrc = `data:image/png;base64,${readFileSync(markPath).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "#34bb78",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <img src={markSrc} width={340} height={340} alt="" />
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#0b0b0a", letterSpacing: 4 }}>
          ORBITAL
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            color: "#0b0b0a",
            fontWeight: 600,
            lineHeight: 1.05,
            marginTop: 20,
            maxWidth: 720,
          }}
        >
          Trade Beyond Borders.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(11,11,10,0.7)",
            marginTop: 28,
            maxWidth: 620,
          }}
        >
          A trusted space for seamless digital asset trading.
        </div>
      </div>
    ),
    { ...size },
  );
}
