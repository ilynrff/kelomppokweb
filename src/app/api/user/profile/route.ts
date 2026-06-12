import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};

    // Update name if provided
    if (name && name !== user.name) {
      dataToUpdate.name = name;
    }

    // Update password if current and new passwords are provided
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Password saat ini salah." }, { status: 400 });
      }
      
      // Strict validation for new password
      const hasLetter = /[a-zA-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      
      if (newPassword.length < 8 || !hasLetter || !hasNumber) {
        return NextResponse.json({ 
          error: "Password baru minimal 8 karakter dan harus mengandung huruf serta angka." 
        }, { status: 400 });
      }

      dataToUpdate.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "No changes requested." }, { status: 200 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    return NextResponse.json({ 
      message: "Profil berhasil diperbarui.",
      user: {
        name: updatedUser.name,
        whatsapp: updatedUser.whatsapp,
        membership: updatedUser.membership
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}
