"use client";
import FeaturesSection from "@/components/features-section";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import StatsSection from "@/components/stats-section";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
