"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader } from "lucide-react"
import { useState } from "react"

export default function AdminHeader() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    // Clear session cookie
    const response = await fetch("/api/admin/auth", { method: "POST" })
    if (response.ok) {
      router.push("/admin/login")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">JK</span>
          </div>
          <span className="font-bold text-foreground hidden md:inline">Jaga Kali - Admin</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/reports" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Laporan
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut} className="bg-transparent">
            {loggingOut ? <Loader className="w-4 h-4 animate-spin" /> : "Logout"}
          </Button>
        </nav>
      </div>
    </header>
  )
}
