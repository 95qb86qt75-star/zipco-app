import { describe, expect, it } from "vitest";
import { businessDays, emptySchedule } from "./businessConfigData";
import { groupSchedule } from "./ScheduleCard";

describe("ScheduleCard grouping", () => {
  it("groups days that share opening and closing times", () => {
    const schedule = structuredClone(emptySchedule);
    schedule.monday = { enabled: true, open: "08:00", close: "20:00" };
    schedule.tuesday = { enabled: true, open: "08:00", close: "20:00" };
    schedule.friday = { enabled: true, open: "08:00", close: "17:00" };

    expect(groupSchedule(businessDays, schedule)).toEqual([
      {
        dayIds: ["monday", "tuesday"],
        open: "08:00",
        close: "20:00",
      },
      { dayIds: ["friday"], open: "08:00", close: "17:00" },
    ]);
  });

  it("does not include closed days in an opening-hours group", () => {
    expect(groupSchedule(businessDays, emptySchedule)).toEqual([]);
  });

  it("preserves the normal weekly order inside each group", () => {
    const schedule = structuredClone(emptySchedule);
    schedule.monday = { enabled: true, open: "09:00", close: "18:00" };
    schedule.wednesday = { enabled: true, open: "09:00", close: "18:00" };
    schedule.sunday = { enabled: true, open: "09:00", close: "18:00" };

    expect(groupSchedule(businessDays, schedule)[0].dayIds).toEqual([
      "monday",
      "wednesday",
      "sunday",
    ]);
  });
});
