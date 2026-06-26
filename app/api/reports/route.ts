import { db } from "@/lib/db"
import { reports } from "@/lib/schema"
import { reportSchema } from "@/lib/validations/report"
import { desc, eq, and } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type")
    const severity = searchParams.get("severity")
    const status = searchParams.get("status")
    const mode = searchParams.get("mode")

    // Optimize select based on mode
    let columns = undefined
    if (mode === "map") {
      columns = {
        id: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        report_type: true,
        latitude: true,
        longitude: true,
        address: true,
        confirmations_count: true,
        created_at: true,
      }
    }

    let conditions = []
    if (reportType) conditions.push(eq(reports.report_type, reportType))
    if (severity) conditions.push(eq(reports.severity, severity))
    if (status) conditions.push(eq(reports.status, status))

    const data = await db.query.reports.findMany({
      columns: columns,
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(reports.created_at)],
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate payload
    const validation = reportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.format() }, 
        { status: 400 }
      )
    }

    const [data] = await db.insert(reports)
      .values({
        ...validation.data,
        latitude: validation.data.latitude.toString(),
        longitude: validation.data.longitude.toString(),
      })
      .returning()

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
