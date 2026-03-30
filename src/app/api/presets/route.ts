import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { presets } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/presets
// Fetch all presets for the authenticated user
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userPresets = await db
      .select()
      .from(presets)
      .where(eq(presets.userId, session.user.id))
      .orderBy(asc(presets.title));

    return NextResponse.json(userPresets);
  } catch (error) {
    console.error("Error fetching presets:", error);
    return NextResponse.json(
      { error: "Failed to fetch presets" },
      { status: 500 }
    );
  }
}

// POST /api/presets
// Create a new preset
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const {
      id,
      title,
      isDeepWork,
      startTime,
      endTime,
      location,
      notes,
    } = body;

    // Validate required fields
    if (!id || !title || typeof isDeepWork !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const newPreset = await db
      .insert(presets)
      .values({
        id,
        userId: session.user.id,
        title,
        isDeepWork,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        location: location ?? null,
        notes: notes ?? null,
      })
      .returning();

    return NextResponse.json(newPreset[0], { status: 201 });
  } catch (error) {
    console.error("Error creating preset:", error);
    return NextResponse.json(
      { error: "Failed to create preset" },
      { status: 500 }
    );
  }
}
