import { ImageResponse } from "next/og";
import { formatIndex, formatPerMillion } from "@/lib/format";
import { getIndexSnapshot } from "@/lib/get-index";

export const alt = "The Token Index";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const snapshot = await getIndexSnapshot();
  const index = formatIndex(snapshot.paid.index);
  const price = formatPerMillion(snapshot.paid.blendedPerMillion);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#efe6d4",
          color: "#1a1610",
          padding: "64px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          <span>The Token Index</span>
          <span>TPI</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 180, fontStyle: "italic", lineHeight: 0.9 }}>
            {index}
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#5c5348" }}>
            {`$${price} per million tokens, usage-weighted`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            color: "#8a3e16",
          }}
        >
          <span>100 = $1.00 / MTok</span>
          <span>OpenRouter most-used models</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
