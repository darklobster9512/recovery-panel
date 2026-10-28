import { describe, it, expect } from "vitest";
import { detectCampaign } from "@/lib/leads";
describe("detectCampaign", () => {
  it("fs1 -> fakeshop", () => expect(detectCampaign({ campaign_name: "fs1" })).toBe("fakeshop"));
  it("euro -> europol", () => expect(detectCampaign({ campaign_name: "Europol 2" })).toBe("europol"));
});
