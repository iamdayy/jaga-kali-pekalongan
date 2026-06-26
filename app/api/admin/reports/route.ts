import { isAdminAuthenticated } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { admin_logs, reports } from "@/lib/schema"
import { desc, eq, gte, lte, and } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let conditions = []
    if (status) conditions.push(eq(reports.status, status))
    if (type) conditions.push(eq(reports.report_type, type))
    if (severity) conditions.push(eq(reports.severity, severity))
    
    if (startDate) {
      conditions.push(gte(reports.created_at, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(reports.created_at, new Date(endDate)))
    }

    const data = await db.query.reports.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(reports.created_at)],
      with: {
        admin_logs: {
          columns: {
            action: true,
            admin_user: true,
            created_at: true,
          }
        }
      }
    })
    
    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    } 

    const body = await request.json()
    const { reportId, updates } = body

    const [data] = await db.update(reports)
      .set({
        ...updates,
        updated_at: new Date()
      })
      .where(eq(reports.id, reportId))
      .returning()

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
