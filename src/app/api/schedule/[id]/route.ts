import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { scheduleItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/schedule/[id]
// Update a schedule item (partial updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First, verify the item belongs to the authenticated user
    const existingItem = await db
      .select()
      .from(scheduleItems)
      .where(
        and(
          eq(scheduleItems.id, id),
          eq(scheduleItems.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: "Schedule item not found or unauthorized" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Update the item with the provided fields
    const updatedItem = await db
      .update(scheduleItems)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(scheduleItems.id, id))
      .returning();

    return NextResponse.json(updatedItem[0]);
  } catch (error) {
    console.error("Error updating schedule item:", error);
    return NextResponse.json(
      { error: "Failed to update schedule item" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedule/[id]
// Delete a schedule item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First, verify the item belongs to the authenticated user
    const existingItem = await db
      .select()
      .from(scheduleItems)
      .where(
        and(
          eq(scheduleItems.id, id),
          eq(scheduleItems.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: "Schedule item not found or unauthorized" },
        { status: 404 }
      );
    }

    await db.delete(scheduleItems).where(eq(scheduleItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule item:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule item" },
      { status: 500 }
    );
  }
}
