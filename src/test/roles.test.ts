import { describe, it, expect } from "vitest";
import { managerCanOpen, managerCanSeeVic } from "@/lib/roles";

describe("manager visibility", () => {
  it("sees Vics assigned to him", () => {
    expect(managerCanSeeVic("m1", [], { assigned_manager_id: "m1", assigned_caller_id: null })).toBe(true);
  });
  it("sees Vics of his callers", () => {
    expect(managerCanSeeVic("m1", ["c1"], { assigned_manager_id: null, assigned_caller_id: "c1" })).toBe(true);
  });
  it("does not see Vics of other managers or callers", () => {
    expect(managerCanSeeVic("m1", ["c1"], { assigned_manager_id: "m2", assigned_caller_id: "c2" })).toBe(false);
  });
});

describe("manager menu", () => {
  it.each(["/admin", "/admin/vics", "/admin/vics/abc", "/admin/caller", "/admin/livechat", "/admin/termine",
    "/admin/telefonstatistik", "/admin/verifikationen", "/admin/ueberpruefung", "/admin/dokumente"])("allows %s", (p) => {
    expect(managerCanOpen(p)).toBe(true);
  });
  it.each(["/admin/manager", "/admin/leads", "/admin/todos", "/admin/emails", "/admin/telegram",
    "/admin/brandings", "/admin/einstellungen", "/admin/anfragen", "/admin/telefonnummern"])("blocks %s", (p) => {
    expect(managerCanOpen(p)).toBe(false);
  });
});
