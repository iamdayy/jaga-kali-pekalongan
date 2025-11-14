"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

interface FloatingActionButtonProps {
  onClick?: () => void;
}

export default function FloatingActionButton({
  onClick,
}: FloatingActionButtonProps) {
  return (
    <Link href="/lapor">
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-orange-600 hover:bg-orange-700 text-white p-0 flex items-center justify-center z-30"
        title="Laporkan Sampah"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </Link>
  );
}
