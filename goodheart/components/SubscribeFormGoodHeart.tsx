import React from "react";

export default function SubscribeFormGoodHeart() {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[1104px] px-4">
        <iframe
          src="https://subscribe-forms.beehiiv.com/b8677a39-0139-4404-84df-df3b8e1d5c2f"
          className="beehiiv-embed"
          data-test-id="beehiiv-embed"
          style={{
            width: "100%",
            height: "439px",
            margin: 0,
            borderRadius: 0,
            backgroundColor: "transparent",
            boxShadow: "0 0 #0000",
          }}
          frameBorder={0}
          scrolling="no"
        />
      </div>
    </div>
  );
}