import React from "react";

type Props = {
  src: string;
  maxWidth: number;
  label?: string;
};

export default function BeehiivEmbed({ src, maxWidth, label = "Newsletter signup" }: Props) {
  return (
    <div
      className="bh-embed-wrapper"
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        padding: "0 16px",
      }}
    >
      <iframe
        src={src}
        className="beehiiv-embed"
        data-test-id="beehiiv-embed"
        title={label}
        frameBorder={0}
        scrolling="no"
        style={{
          width: "100%",
          maxWidth: `${maxWidth}px`,
          backgroundColor: "transparent",
          borderRadius: 0,
          margin: 0,
          minHeight: 120,
        }}
      />
    </div>
  );
}




