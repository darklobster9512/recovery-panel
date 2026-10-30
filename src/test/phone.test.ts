import { describe, it, expect } from "vitest";
import { normalizePhone } from "../../supabase/functions/_shared/phone";

describe("normalizePhone", () => {
  it("treats +49, 0049 and 0 the same", () => {
    expect(normalizePhone("+49 171 2345678")).toBe("491712345678");
    expect(normalizePhone("0049-171-2345678")).toBe("491712345678");
    expect(normalizePhone("0171 / 234 56 78")).toBe("491712345678");
  });
  it("returns empty for missing numbers", () => {
    expect(normalizePhone(null)).toBe("");
  });
});
