import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { presets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/presets/[id]
// Update a preset (partial updates)
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
    // First, verify the preset belongs to the authenticated user
    const existingPreset = await db
      .select()
      .from(presets)
      .where(
        and(
          eq(presets.id, id),
          eq(presets.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingPreset.length === 0) {
      return NextResponse.json(
        { error: "Preset not found or unauthorized" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Update the preset with the provided fields
    const updatedPreset = await db
      .update(presets)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(presets.id, id))
      .returning();

    return NextResponse.json(updatedPreset[0]);
  } catch (error) {
    console.error("Error updating preset:", error);
    return NextResponse.json(
      { error: "Failed to update preset" },
      { status: 500 }
    );
  }
}

// DELETE /api/presets/[id]
// Delete a preset
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
    // First, verify the preset belongs to the authenticated user
    const existingPreset = await db
      .select()
      .from(presets)
      .where(
        and(
          eq(presets.id, id),
          eq(presets.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingPreset.length === 0) {
      return NextResponse.json(
        { error: "Preset not found or unauthorized" },
        { status: 404 }
      );
    }

    await db.delete(presets).where(eq(presets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting preset:", error);
    return NextResponse.json(
      { error: "Failed to delete preset" },
      { status: 500 }
    );
  }
}
