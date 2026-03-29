# Deep Work Planner

A minimal, mobile-first daily planner web app built with Next.js, designed around the **Rhythmic Philosophy of Deep Work Scheduling**.

## Features

✅ **Dual Item Types**
- **Events**: Scheduled activities with start/end times, locations
- **To-Dos**: Unscheduled tasks that can be dragged into your timeline

✅ **Deep Work Tracking**
- Mark items as "Deep Work" with visual indicators (bold left border + icon)
- Distinguish focused work sessions from shallow tasks

✅ **Mobile-First Design**
- Optimized for touch devices
- Drag-and-drop reordering with haptic feedback
- Bottom sheet modals for easy data entry

✅ **Smart Daily Reset**
- Auto-clears schedule at midnight
- Always starts fresh each day

✅ **Theme Support**
- System-adaptive light/dark mode
- Smooth theme transitions

✅ **Local Storage Only**
- No login, no backend
- All data persists on device
- Privacy-first approach

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Usage

### Creating Items

1. Click the **floating "+" button** (bottom-right) or tap **"Plan Your Day"** when empty
2. Enter a title
3. Choose type: **To-Do** or **Event**
4. Toggle **Deep Work** if it's a focused work session
5. For events: add start/end times, location (optional)
6. Add notes if needed
7. Click **"Add Item"**

### Managing Your Schedule

- **Reorder items**: Drag and drop to rearrange
- **Complete to-dos**: Tap the checkbox
- **Edit items**: Tap any card to edit
- **Delete items**: Hover over a card and click the delete icon

### Timeline vs. Unscheduled

- **Unscheduled section**: To-dos and events without times appear here
- **Timeline section**: Events with start times appear here in chronological order
- Drag items between sections as your day evolves

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS v4
- **Drag & Drop**: @dnd-kit (touch-friendly, accessible)
- **State Management**: React Context + useReducer
- **Storage**: localStorage
- **Theme**: next-themes
- **IDs**: nanoid

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main app page
│   └── globals.css         # Global styles
├── components/
│   ├── AddItemSheet.tsx    # Modal for creating/editing items
│   ├── EmptyState.tsx      # Empty state with CTA
│   ├── Header.tsx          # App header with date & theme toggle
│   ├── ScheduleItemCard.tsx # Individual item card
│   ├── ThemeProvider.tsx   # Theme context wrapper
│   ├── ThemeToggle.tsx     # Light/dark mode toggle
│   └── Timeline.tsx        # Main schedule view with DnD
├── context/
│   └── ScheduleContext.tsx # Global schedule state management
├── hooks/
│   ├── useLocalStorage.ts  # Generic localStorage hook
│   └── useMidnightReset.ts # Auto-reset at midnight
└── types.ts                # TypeScript type definitions
```

## Data Model

### ScheduleItem
```typescript
{
  id: string;              // Unique identifier
  type: "event" | "todo";  // Item type
  title: string;           // Item title
  isDeepWork: boolean;     // Deep work flag
  completed: boolean;      // For todos only
  startTime?: string;      // HH:mm, for events
  endTime?: string;        // HH:mm, for events
  location?: string;       // For events
  notes?: string;          // Optional notes
  order: number;           // For manual sorting
}
```

### DaySchedule
```typescript
{
  date: string;            // YYYY-MM-DD
  items: ScheduleItem[];   // Array of schedule items
}
```

### localStorage Keys
- `dwp-schedule`: Serialized DaySchedule for today
- `dwp-settings`: Theme preferences (managed by next-themes)

## Design Principles

1. **Minimal Friction**: One-tap creation, easy editing
2. **Mobile-First**: Touch-optimized, responsive design
3. **Privacy-First**: No data leaves your device
4. **Daily Reset**: Fresh start each morning
5. **Clear Visual Hierarchy**: Deep work stands out
6. **Flexible Structure**: Mix scheduled and unscheduled seamlessly

## Future Enhancements

Potential features for future versions:
- **PWA Support**: Installable app with offline support
- **Recurring Templates**: Reuse schedule structures
- **Multi-day View**: Week/month planning
- **Export/Import**: Backup and restore schedules
- **Statistics**: Track deep work hours, completion rates
- **Custom Categories/Tags**: Beyond deep/shallow work

## License

MIT

