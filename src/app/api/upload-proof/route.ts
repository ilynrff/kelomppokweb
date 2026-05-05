import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(req: Request) {
  console.log("DEBUG: POST /api/upload-proof called");
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      console.warn("DEBUG: Unauthorized upload proof attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin tidak boleh upload proof
    if (session.user.role === "ADMIN") {
      console.warn("DEBUG: Admin attempted to upload proof.");
      return NextResponse.json({ error: "Admin tidak dapat mengupload bukti pembayaran" }, { status: 403 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const bookingId = formData.get("bookingId") as string | null;

    console.log(`DEBUG: Processing upload for Booking ID: ${bookingId} by user ${userId}`);

    if (!file || !bookingId) {
      return NextResponse.json({ error: "Missing file or bookingId" }, { status: 400 });
    }

    // Verify booking belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { userId: true, status: true, expiresAt: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      console.warn(`DEBUG: User ${userId} attempted to upload proof for booking of user ${booking.userId}`);
      return NextResponse.json({ error: "Forbidden - Booking milik user lain" }, { status: 403 });
    }

    // Check if booking is expired
    if (booking.status === "EXPIRED") {
      return NextResponse.json({ error: "Booking sudah expired. Silakan lakukan booking baru." }, { status: 410 });
    }

    // Check if payment deadline has passed
    if (booking.expiresAt && new Date(booking.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Waktu pembayaran telah habis. Silakan lakukan booking baru." }, { status: 410 });
    }

    // 1. Write file to disk
    let fileUrl = "";
    try {
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const originalName = (file as File).name || "proof.jpg";
      const timestamp = Date.now();
      const fileName = `${timestamp}-${originalName.replace(/\s+/g, "_")}`;
      const filePath = join(UPLOAD_DIR, fileName);

      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${fileName}`;
      console.log(`DEBUG: File written to ${filePath}`);
    } catch (fsError: unknown) {
      const errorMessage = fsError instanceof Error ? fsError.message : String(fsError);
      console.error("DEBUG: File System Error:", fsError);
      return NextResponse.json({ error: "Gagal menyimpan file ke disk", details: errorMessage }, { status: 500 });
    }

    // 2. Update database - Save to Payment table and update Booking status
    try {
      // Check if payment record exists
      const existingPayment = await prisma.payment.findUnique({
        where: { bookingId: bookingId }
      });

      // Create or update payment record
      if (existingPayment) {
        await prisma.payment.update({
          where: { bookingId: bookingId },
          data: {
            proofImage: fileUrl,
            status: "PENDING"
          }
        });
      } else {
        await prisma.payment.create({
          data: {
            bookingId: bookingId,
            proofImage: fileUrl,
            status: "PENDING"
          }
        });
      }

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "PERLU_VERIFIKASI"
        }
      });
      console.log(`DEBUG: Database updated for booking ${bookingId}`);
    } catch (dbError: unknown) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error("DEBUG: Database Error:", dbError);
      return NextResponse.json({ error: "Gagal update status di database", details: errorMessage }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      status: "PERLU_VERIFIKASI"
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("DEBUG: Unexpected Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file (Unexpected Error)", details: String(error) },
      { status: 500 }
    );
  }
}
