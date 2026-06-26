import { db } from '@/lib/db';
import { reports } from '@/lib/schema';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await db.select({
      user_name: reports.user_name,
      address: reports.address,
      confirmations_count: reports.confirmations_count,
      is_anonymous: reports.is_anonymous,
      id: reports.id,
    }).from(reports);

    const citizenStats: Record<string, { name: string; score: number; reports: number }> = {};

    data.forEach((report) => {
      if (report.is_anonymous || !report.user_name || report.user_name === 'Nama Anonym') {
        return;
      }

      const name = report.user_name;
      if (!citizenStats[name]) {
        citizenStats[name] = { name, score: 0, reports: 0 };
      }
      
      const pointsForReport = 10; 
      const pointsForValidations = (report.confirmations_count || 0) * 5; // 5 points per validation

      citizenStats[name].score += pointsForReport + pointsForValidations;
      citizenStats[name].reports += 1;
    });

    const citizens = Object.values(citizenStats)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const locationStats: Record<string, { address: string; score: number; reports: number }> = {};

    data.forEach((report) => {
      if (!report.address) return;
      const address = report.address.trim();
      if (!locationStats[address]) {
        locationStats[address] = { address, score: 0, reports: 0 };
      }
      const pointsForReport = 10;
      const pointsForValidations = (report.confirmations_count || 0) * 5;

      locationStats[address].score += pointsForReport + pointsForValidations;
      locationStats[address].reports += 1;
    });

    const locations = Object.values(locationStats)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      citizens,
      locations,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
