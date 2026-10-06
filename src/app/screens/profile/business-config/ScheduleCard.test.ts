import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { businessDays, emptySchedule } from "./businessConfigData";
import ScheduleCard, { groupSchedule } from "./ScheduleCard";
import ScheduleEditorScreen from "./ScheduleEditorScreen";
import ScheduleSummaryCard from "./ScheduleSummaryCard";

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

  it("shows a compact summary in the general configuration screen", () => {
    const schedule = structuredClone(emptySchedule);
    schedule.monday = { enabled: true, open: "08:00", close: "20:00" };
    schedule.tuesday = { enabled: true, open: "08:00", close: "20:00" };

    const html = renderToStaticMarkup(
      createElement(ScheduleSummaryCard, {
        days: businessDays,
        schedule,
        onEdit: vi.fn(),
      }),
    );

    expect(html).toContain("Horarios de Atención");
    expect(html).toContain("Editar");
    expect(html).toContain("Lunes · Martes");
    expect(html).toContain("8:00–20:00");
  });

  it("renders schedule editing as an independent screen", () => {
    const html = renderToStaticMarkup(
      createElement(ScheduleEditorScreen, {
        days: businessDays,
        initialSchedule: emptySchedule,
        onCancel: vi.fn(),
        onApply: vi.fn(),
      }),
    );

    expect(html).toContain("Agrupa los días que tienen el mismo horario");
    expect(html).toContain("Guardar horarios");
    expect(html).toContain("Guardar cambios");
  });

  it("shows a true empty state before any schedule is configured", () => {
    const html = renderToStaticMarkup(
      createElement(ScheduleCard, {
        days: businessDays,
        schedule: emptySchedule,
        setSchedule: vi.fn(),
      }),
    );

    expect(html).toContain("Aún no hay horarios configurados");
    expect(html).not.toContain("Días sin configurar");
  });

  it("keeps edit and delete controls for configured schedules", () => {
    const schedule = structuredClone(emptySchedule);
    schedule.monday = { enabled: true, open: "08:00", close: "20:00" };

    const html = renderToStaticMarkup(
      createElement(ScheduleCard, {
        days: businessDays,
        schedule,
        setSchedule: vi.fn(),
      }),
    );

    expect(html).toContain("Editar Lunes");
    expect(html).toContain("Eliminar Lunes");
    expect(html).toContain("Días sin configurar");
  });
});
