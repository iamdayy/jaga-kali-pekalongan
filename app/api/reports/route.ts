import { createClient } from "@/lib/supabase/server"
import { reportSchema } from "@/lib/validations/report"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const severity = searchParams.get("severity")
    const status = searchParams.get("status")
    const mode = searchParams.get("mode")

    // Optimize select based on mode
    let selectFields = "*"
    if (mode === "map") {
      // Exclude user PII and heavy fields if not needed
      // We still need description for the popup, but maybe we'll handle truncation on client
      selectFields = "id, title, description, severity, status, report_type, latitude, longitude, address, confirmations_count, created_at"
    }

    let query = supabase.from("reports").select(selectFields).order("created_at", { ascending: false })

    if (reportType) query = query.eq("report_type", reportType)
    if (severity) query = query.eq("severity", severity)
    if (status) query = query.eq("status", status)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Validate payload
    const validation = reportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.format() }, 
        { status: 400 }
      )
    }

    const { data, error } = await supabase.from("reports").insert([validation.data]).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
