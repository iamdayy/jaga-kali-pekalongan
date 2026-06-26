import { isAdminAuthenticated } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { admin_logs } from "@/lib/schema"
import { desc, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const { reportId, action, adminUser, details } = body

    const [data] = await db.insert(admin_logs)
      .values({
        report_id: reportId,
        action,
        admin_user: adminUser,
        details,
      })
      .returning()

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("reportId")

    let query = db.select().from(admin_logs).orderBy(desc(admin_logs.created_at)).$dynamic()

    if (reportId) {
      query = query.where(eq(admin_logs.report_id, reportId))
    }

    const data = await query

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
