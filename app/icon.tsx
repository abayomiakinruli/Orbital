import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const markPath = join(process.cwd(), "public/logo/orbital-mark-white.png");
  const markSrc = `data:image/png;base64,${readFileSync(markPath).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#34bb78",
          borderRadius: 16,
        }}
      >
        <img src={markSrc} width={44} height={44} alt="" />
      </div>
    ),
    { ...size },
  );
}
