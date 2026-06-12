import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  const identifier = (session?.user as any)?.whatsapp || (session?.user as any)?.email;

  if (!session || !identifier) {
    return NextResponse.json({ error: "Anda harus login terlebih dahulu" }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { whatsapp: identifier },
      data: { role: "ADMIN" }
    });

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0b0b0b; color: #ffffff;">
          <h1 style="font-weight: 900; font-size: 2.5rem; margin-bottom: 0.5rem; color: #d7ff3f;">Akses Admin Diberikan! ✅</h1>
          <p style="font-weight: 500; font-size: 1.1rem; color: rgba(255,255,255,0.6); margin-bottom: 2rem;">Akun <b>${identifier}</b> sekarang memiliki hak akses ADMIN.</p>
          <div style="display: flex; gap: 1rem;">
             <a href="/login" style="background: #ef4444; color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; text-decoration: none;">LOGOUT DULU</a>
             <a href="/admin" style="background: #d7ff3f; color: #000000; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 700; text-decoration: none;">MASUK DASHBOARD ADMIN</a>
          </div>
          <p style="margin-top: 2rem; font-size: 0.875rem; color: rgba(255,255,255,0.4);">Catatan: Kamu harus LOGOUT dan LOGIN kembali agar perubahan role terbaca oleh session.</p>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  } catch (_error: unknown) {
    console.error("Error updating role:", _error);
    return NextResponse.json({ error: "Gagal mengupdate role" }, { status: 500 });
  }
}
