import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const amount = parseInt(formData.get("amount") as string) || 150000;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // Process file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${userId}-${Date.now()}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/membership");
    const filePath = path.join(uploadDir, fileName);
    const relativePath = `/uploads/membership/${fileName}`;

    await writeFile(filePath, buffer);

    // Use a transaction to ensure both records are updated
    await prisma.$transaction([
      // 1. Create the membership request
      prisma.membershipRequest.create({
        data: {
          userId,
          proofImage: relativePath,
          amount,
          status: "PENDING",
        },
      }),
      // 2. Update user status to PENDING
      prisma.user.update({
        where: { id: userId },
        data: {
          membershipStatus: "PENDING",
        },
      }),
    ]);

    return NextResponse.json({ 
      message: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.",
      status: "PENDING"
    }, { status: 201 });

  } catch (error: any) {
    console.error("MEMBERSHIP UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Gagal memproses unggahan bukti pembayaran." }, { status: 500 });
  }
}
