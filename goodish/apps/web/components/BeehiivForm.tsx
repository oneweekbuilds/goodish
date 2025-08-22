import React from "react";

export default function BeehiivForm() {
  return (
    <div className="w-full flex justify-center py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        {/* Embed script from Beehiiv */}
        <iframe
          src="https://subscribe-forms.beehiiv.com/9be0df98-11eb-4934-aee0-98b2fc6f4fd2" 
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