"use client";

import { Waves } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Show splash for 2.5 seconds
    const timer = setTimeout(() => {
      setIsComplete(true);
      // Redirect to home after animation completes
      setTimeout(() => {
        router.push("/");
      }, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-teal-600 via-teal-500 to-blue-600 transition-opacity duration-300 ${
        isComplete ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-bounce" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Animated logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-lg animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-br from-white to-blue-50 rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-700">
            <Waves
              className="w-12 h-12 text-teal-600 animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-balance animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Jaga Kali Pekalongan
          </h1>
          <p className="text-lg text-white/90 font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Lindungi Sungai Kita
          </p>
          <p className="text-lg text-white/90 font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Dimulai dari kita!
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-2 mt-8">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-100" />
          <div className="w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
        </div>

        {/* Subtitle */}
        <p className="text-sm text-white/80 mt-8 animate-in fade-in duration-700 delay-300">
          Memulai...
        </p>
      </div>

      {/* Animated water wave effect */}
      <svg
        className="absolute bottom-0 left-0 w-full h-auto animate-pulse"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,50 Q300,20 600,50 T1200,50 L1200,120 L0,120 Z"
          fill="rgba(255,255,255,0.15)"
          className="animate-in slide-in-from-left-full duration-1000"
        />
        <path
          d="M0,60 Q300,30 600,60 T1200,60 L1200,120 L0,120 Z"
          fill="rgba(255,255,255,0.1)"
          className="animate-in slide-in-from-left-full duration-1000 delay-200"
        />
      </svg>
    </div>
  );
}
