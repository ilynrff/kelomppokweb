import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errorMessage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeWhatsApp(whatsapp: string) {
  let cleaned = whatsapp.replace(/\D/g, ""); // remove all non-digits
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (!cleaned.startsWith("62")) {
    // If it doesn't start with 62 and isn't 0, we assume it's a local number without 0
    // but the most common case in Indonesia is 08xx or 628xx.
    cleaned = "62" + cleaned;
  }
  return "+" + cleaned;
}

function validatePassword(password: string) {
  const minLength = 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return password.length >= minLength && hasLetter && hasNumber;
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();
    const { whatsapp, name, password } = body;

    if (!whatsapp || !name || !password) {
      return NextResponse.json({ error: "Missing required information" }, { status: 400 });
    }

    const normalizedWA = normalizeWhatsApp(whatsapp);

    // 1. Check if WhatsApp already exists
    const existingUser = await prisma.user.findUnique({
      where: { whatsapp: normalizedWA }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Nomor WhatsApp sudah digunakan" }, { status: 400 });
    }

    // 2. Validate password rules
    if (!validatePassword(password)) {
      return NextResponse.json({ 
        error: "Password tidak memenuhi syarat (min 8 karakter, harus mengandung huruf dan angka)" 
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        whatsapp: normalizedWA,
        name,
        password: hashedPassword,
        membership: "BASIC", // Default membership
      }
    });

    return NextResponse.json({ 
      id: user.id, 
      name: user.name, 
      whatsapp: user.whatsapp, 
      role: user.role,
      membership: user.membership
    }, { status: 201 });
  } catch (error: unknown) {
    console.log(error, "REGISTRATION_ERROR");
    return NextResponse.json({ 
      error: "Terjadi kesalahan internal", 
      details: getErrorMessage(error) 
    }, { status: 500 });
  }
}
