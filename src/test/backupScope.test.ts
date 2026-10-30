import { describe, it, expect } from "vitest";
import { brandWhere, fileInBrand, importOrder } from "../../supabase/functions/_shared/backupScope";

describe("brand backup scope", () => {
  it("excludes backup secrets", () => {
    expect(brandWhere("public.backup_secrets", ["id"])).toBe("EXCLUDE");
  });
  it("keeps global tables complete", () => {
    expect(brandWhere("public.verifications", ["id", "created_by"])).toBeNull();
  });
  it("filters leads by branding_id", () => {
    expect(brandWhere("public.leads", ["id", "branding_id"])).toBe("branding_id = $1");
  });
  it("filters chat messages through the Vic", () => {
    expect(brandWhere("public.chat_messages", ["id", "vic_id"])).toContain("profiles WHERE branding_id = $1");
  });
  it("filters lead notes through the lead", () => {
    expect(brandWhere("public.lead_notes", ["lead_id"])).toContain("leads WHERE branding_id = $1");
  });
  it("assigns files by first path segment, logos are global", () => {
    const people = new Set(["v1"]);
    expect(fileInBrand("user-documents", "v1/personalausweis/a.jpg", people)).toBe(true);
    expect(fileInBrand("user-documents", "v2/x.jpg", people)).toBe(false);
    expect(fileInBrand("verification-logos", "any.png", people)).toBe(true);
  });
  it("imports auth users, brands and profiles before the rest", () => {
    expect(importOrder(["public.todos", "public.profiles", "auth.users", "public.brandings"]))
      .toEqual(["auth.users", "public.brandings", "public.profiles", "public.todos"]);
  });
});
