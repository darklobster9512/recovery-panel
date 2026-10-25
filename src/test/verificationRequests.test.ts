import { describe, it, expect } from "vitest";
import { auftragKey, isValidBirthDate } from "@/lib/verificationRequests";

describe("verification requests", () => {
  it("builds Auftrag names like the target service expects", () => {
    expect(auftragKey({ id: "1", title: "Deutsche Bank — Video-Ident", type: "videocall" })).toBe("DeutscheBank-videoident");
    expect(auftragKey({ id: "2", title: "Consorsbank — Postident", type: "postident" })).toBe("Consorsbank-postident");
  });
  it("accepts birth dates only as TT.MM.JJJJ", () => {
    expect(isValidBirthDate("24.07.1966")).toBe(true);
    expect(isValidBirthDate("1966-07-24")).toBe(false);
    expect(isValidBirthDate("31.02.1966")).toBe(false);
  });
});
