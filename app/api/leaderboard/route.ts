
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: reports, error } = await supabase
    .from('reports')
    .select('user_name, address, confirmations_count, is_anonymous, id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const citizenStats: Record<string, { name: string; score: number; reports: number }> = {};

  reports.forEach((report) => {
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

  reports.forEach((report) => {
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
}
