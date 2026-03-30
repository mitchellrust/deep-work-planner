import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { scheduleItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/schedule?date=YYYY-MM-DD
// Fetch all schedule items for the authenticated user for a given date
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
  }

  try {
    const items = await db
      .select()
      .from(scheduleItems)
      .where(
        and(
          eq(scheduleItems.userId, session.user.id),
          eq(scheduleItems.date, date)
        )
      )
      .orderBy(scheduleItems.order);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching schedule items:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule items" },
      { status: 500 }
    );
  }
}

// POST /api/schedule
// Create a new schedule item
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const {
      id,
      date,
      title,
      isDeepWork,
      completed,
      startTime,
      endTime,
      location,
      notes,
      order,
    } = body;

    // Validate required fields
    if (!id || !date || !title || typeof isDeepWork !== "boolean" || typeof completed !== "boolean" || typeof order !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const newItem = await db
      .insert(scheduleItems)
      .values({
        id,
        userId: session.user.id,
        date,
        title,
        isDeepWork,
        completed,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        location: location ?? null,
        notes: notes ?? null,
        order,
      })
      .returning();

    return NextResponse.json(newItem[0], { status: 201 });
  } catch (error) {
    console.error("Error creating schedule item:", error);
    return NextResponse.json(
      { error: "Failed to create schedule item" },
      { status: 500 }
    );
  }
}
