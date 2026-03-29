import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { scheduleItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// PUT /api/schedule/reorder
// Bulk update order values for multiple items
export async function PUT(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items: Array<{ id: string; order: number }> = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: items array is required" },
        { status: 400 }
      );
    }

    // Verify all items belong to the authenticated user
    const itemIds = items.map((item) => item.id);
    const existingItems = await db
      .select({ id: scheduleItems.id })
      .from(scheduleItems)
      .where(
        and(
          eq(scheduleItems.userId, session.user.id),
          sql`${scheduleItems.id} = ANY(${itemIds})`
        )
      );

    if (existingItems.length !== items.length) {
      return NextResponse.json(
        { error: "Some items not found or unauthorized" },
        { status: 403 }
      );
    }

    // Update all items in a transaction
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(scheduleItems)
          .set({ order: item.order, updatedAt: new Date() })
          .where(eq(scheduleItems.id, item.id));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering schedule items:", error);
    return NextResponse.json(
      { error: "Failed to reorder schedule items" },
      { status: 500 }
    );
  }
}
