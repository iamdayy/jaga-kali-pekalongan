import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        // Kirim request ke Python Backend (running di localhost:8000)
        // Pastikan URL ini sesuai dengan tempat Anda menjalankan Python
        const pythonResponse = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL}/predict`, {
            method: "POST",
            body: formData, 
            // Fetch otomatis mengatur Content-Type untuk FormData
        });

        if (!pythonResponse.ok) {
            throw new Error("Gagal menghubungi Python AI Service");
        }

        const data = await pythonResponse.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Gagal memproses AI" }, { status: 500 });
    }
}