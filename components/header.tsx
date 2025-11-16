"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon-large.png" alt="Jaga Kali" className="w-30 h-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/peta"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Peta
          </Link>
          <Link
            href="/lapor"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Laporkan
          </Link>
          <Link
            href="#fitur"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Fitur
          </Link>
          <Link
            href="#statistik"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Statistik
          </Link>
          <Link
            href="/admin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </nav>

        <Link href="/lapor">
          <Button
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Laporkan
          </Button>
        </Link>
      </div>
    </header>
  );
}
