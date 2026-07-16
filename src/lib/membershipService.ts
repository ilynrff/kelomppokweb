import prisma from "@/lib/prisma";

export async function validateMembershipStatus(userId: string) {
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return null;

    // Check if membership is ACTIVE and has expired
    if (
      user.membershipStatus === "ACTIVE" &&
      user.membershipExpiresAt &&
      new Date() >= new Date(user.membershipExpiresAt)
    ) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          membershipStatus: "EXPIRED",
          membership: "BASIC",
          updatedAt: new Date()
        }
      });
      console.log(`[MEMBERSHIP] User ${userId} membership automatically expired on ${user.membershipExpiresAt}`);
      return updatedUser;
    }

    return user;
  } catch (error) {
    console.error(`[MEMBERSHIP ERROR] Failed to validate membership for user ${userId}:`, error);
    return null;
  }
}
