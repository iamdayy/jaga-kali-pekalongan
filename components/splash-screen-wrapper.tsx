"use client";

import { useEffect, useState } from "react";
import SplashScreen from "./splash-screen";

export default function SplashScreenWrapper() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if user has already seen the splash screen in this session
    const hasSeenSplash = sessionStorage.getItem("jaga-kali-splash-shown");

    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      // Mark splash as shown after 3 seconds
      const timer = setTimeout(() => {
        sessionStorage.setItem("jaga-kali-splash-shown", "true");
        setShowSplash(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  return showSplash ? <SplashScreen /> : null;
}
