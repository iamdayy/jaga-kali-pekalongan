import { db } from "@/lib/db"
import { confirmations, reports } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Insert confirmation
    const [data] = await db.insert(confirmations)
      .values({
        report_id: body.report_id,
        user_identifier: body.user_identifier,
      })
      .returning()

    // Increment confirmations count in reports table atomically
    await db.update(reports)
      .set({
        confirmations_count: sql`${reports.confirmations_count} + 1`
      })
      .where(eq(reports.id, body.report_id))

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
