"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        throw new Error("Invalid password")
      }

      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-6">Masukkan password admin untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-base font-semibold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
              />
            </div>

            {error && <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

            <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Verifikasi...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
