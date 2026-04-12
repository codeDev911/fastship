import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get("type");
    const search = searchParams.get("search");

    const users = await prisma.user.findMany({
      where: {
        // 1. Handle the User Type Filter
        // If type is "ALL" or null, we don't apply this filter
        role:userType,

        // 2. Handle the Search Logic
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { id: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      // Limit results for better performance during debounced searches
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true, // or whatever your type field is named
        profileImage: true,
      }
    });

    return NextResponse.json(users, { status: 200 });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}