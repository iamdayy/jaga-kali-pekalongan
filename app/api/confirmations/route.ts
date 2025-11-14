import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("confirmations").insert([body]).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Increment confirmations count in reports table
    const reportId = body.report_id
    await supabase
      .from("reports")
      .update({ confirmations_count: supabase.rpc("increment_confirmations", { report_id: reportId }) })
      .eq("id", reportId)

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
