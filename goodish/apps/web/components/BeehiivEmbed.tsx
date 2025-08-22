import React from "react";

type Props = {
  src: string;       // Beehiiv iframe src
  maxWidth: number;  // 520 for Goodish
  label?: string;
};

export default function BeehiivEmbed({ src, maxWidth, label = "Newsletter signup" }: Props) {
  return (
    <div
      className="bh-embed-shell"
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        padding: "0 16px",
      }}
    >
      <iframe
        title={label}
        src={src}
        className="beehiiv-embed"
        data-test-id="beehiiv-embed"
        frameBorder={0}
        scrolling="no"
        style={{
          width: "100%",
          maxWidth: `${maxWidth}px`,
          minHeight: 130,
          backgroundColor: "transparent",
          borderRadius: 0,
          margin: 0,
        }}
      />
    </div>
  );
}