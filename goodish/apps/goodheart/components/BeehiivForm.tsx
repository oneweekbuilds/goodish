import React from "react";

export default function BeehiivForm() {
  return (
    <div className="w-full flex justify-center py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        {/* Embed script from Beehiiv */}
        <iframe
          src="https://subscribe-forms.beehiiv.com/b8677a39-0139-4404-84df-df3b8e1d5c2f" 
          data-test-id="beehiiv-embed"
          height="320"
          frameBorder="0"
          scrolling="no"
          style={{
            width: "100%",
            border: "none",
            overflow: "hidden",
          }}
        ></iframe>
      </div>
    </div>
  );
}