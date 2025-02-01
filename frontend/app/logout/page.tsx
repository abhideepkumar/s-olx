"use client";
import React from "react";
import { useEffect } from "react";

const LogoutPage = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    window.location.href = "/login";
  }, []);

  return (
    <div className="text-center text-red-500  ">
      Logging Out......PLease Wait
    </div>
  );
};

export default LogoutPage;
