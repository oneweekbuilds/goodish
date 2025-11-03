import React from "react";
import "./globals.scoped.css";
import { LandingPage } from "./export/LandingPage";
import { useNavigate } from "react-router-dom";

export default function HomeFigma() {
  const navigate = useNavigate();
  return (
    <div className="alg-fm">
      <LandingPage
        onNavigate={(page) => {
          if (page === "dashboard") navigate("/dashboard");
          else if (page === "signin") navigate("/signup");
          else navigate("/");
        }}
      />
    </div>
  );
}
