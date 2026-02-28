# T-034: Today Index is Cached for Entire Session Lifetime

**Priority:** Medium  
**Category:** Bug

## Problem

In `Timeline.tsx` and `TodayLine.tsx`, today's day index is computed once using `useMemo(() => todayDayIndex(), [])` with an empty dependency array. This means the "today" line and "today" column highlighting will not update if the user keeps the app open past midnight — the line stays on the previous day.

## Location

- [src/ui/components/Timeline.tsx](../src/ui/components/Timeline.tsx) — `const today = useMemo(() => todayDayIndex(), []);`
- [src/ui/components/TodayLine.tsx](../src/ui/components/TodayLine.tsx) — `const today = useMemo(() => todayDayIndex(), []);`

## Expected Behavior

Either:
1. Set up a timer that recalculates the day index at midnight
2. Or recalculate on component mount/window focus to keep the today indicator accurate

## Acceptance Criteria

- [ ] Today line updates when the date changes past midnight
- [ ] Today column highlighting updates accordingly
- [ ] No excessive re-computation during normal usage
