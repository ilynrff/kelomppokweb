import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const email = "admin@padelgo.com";
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" }
      });
      return NextResponse.json({ message: "User admin@padelgo.com sudah ada dan kini di-set sebagai ADMIN", password: "admin123" });
    }

    await prisma.user.create({
      data: {
        email,
        name: "Super Admin",
        password: hashedPassword,
        role: "ADMIN"
      }
    });

    return NextResponse.json({ 
      message: "Admin Default Berhasil Dibuat!",
      email: email,
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
