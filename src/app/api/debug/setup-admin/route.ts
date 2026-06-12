import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const whatsapp = "+628123456789";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({
      where: { whatsapp }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { whatsapp },
        data: { role: "ADMIN" }
      });
      return NextResponse.json({ message: `User ${whatsapp} sudah ada dan kini di-set sebagai ADMIN`, password: "admin123" });
    }

    await prisma.user.create({
      data: {
        whatsapp,
        name: "Super Admin",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ 
      message: "Admin Default Berhasil Dibuat!",
      whatsapp: whatsapp,
      password: password,
      note: "Silakan login menggunakan kredensial di atas."
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("DEBUG SETUP ADMIN ERROR:", error);
    return NextResponse.json({ 
      error: "Gagal membuat admin default", 
      details: errorMessage,
      suggestion: "Pastikan database PostgreSQL sudah menyala dan DATABASE_URL di .env sudah benar."
    }, { status: 500 });
  }
}
