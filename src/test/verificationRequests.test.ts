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

import { blockedBanks as _bb } from "@/lib/verificationRequests";
describe("blockedBanks", () => {
  const vs = [
    { id: "1", title: "Targobank — Video-Ident", type: "videocall" },
    { id: "2", title: "Deutsche Bank — Video-Ident", type: "videocall" },
    { id: "3", title: "Commerzbank — Video-Ident", type: "videocall" },
  ];
  it("Sparkasse Targobank blocks Targobank", () => expect([..._bb("Sparkasse Targobank", vs)]).toEqual(["Targobank-videoident"]));
  it("comma list blocks Deutsche Bank", () => expect(_bb("Sparkasse, Deutsche Bank", vs).has("DeutscheBank-videoident")).toBe(true));
  it("no-space spelling", () => expect(_bb("deutschebank", vs).has("DeutscheBank-videoident")).toBe(true));
  it("Sparkasse blocks nothing", () => expect(_bb("Sparkasse", vs).size).toBe(0));
});

import { priorAuftraege } from "@/lib/verificationRequests";
describe("priorAuftraege", () => {
  const v = [{ id: "1", title: "Commerzbank — Video-Ident", type: "videoident" }, { id: "2", title: "BBVA — Video-Ident", type: "videoident" }];
  it("blocks assigned and requested Aufträge", () => {
    const m = priorAuftraege(v, [{ verification_id: "1" }], [{ auftrag_key: "BBVA-videoident", verification_id: null, status: "fehlgeschlagen" }]);
    expect(m.get("Commerzbank-videoident")).toBe("Bereits zugewiesen");
    expect(m.get("BBVA-videoident")).toBe("Fehlgeschlagen");
  });
});
