import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = (file as File).name || "image.jpg";
    const timestamp = Date.now();
    const fileName = `${timestamp}-${originalName.replace(/\s+/g, "_")}`;
    const filePath = join(UPLOAD_DIR, fileName);

    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error: unknown) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses upload", details: String(error) },
      { status: 500 }
    );
  }
}
