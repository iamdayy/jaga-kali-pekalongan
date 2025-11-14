import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query = supabase
      .from("reports")
      .select("*, admin_logs:admin_logs(action, admin_user, created_at)")
      .order("created_at", { ascending: false })

    if (status) query = query.eq("status", status)
    if (type) query = query.eq("report_type", type)
    if (severity) query = query.eq("severity", severity)

    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { reportId, updates } = body

    const { data, error } = await supabase.from("reports").update(updates).eq("id", reportId).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
