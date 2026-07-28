import { describe, it, expect } from "vitest";
import { isActionAllowed } from "./permission";
describe("isActionAllowed", () => {
    it("lets ADMIN use a known, restricted action", () => {
        expect(isActionAllowed("createProduct", "ADMIN")).toBe(true);
    });
    it("blocks VIEWER from a known, restricted action", () => {
        expect(isActionAllowed("createProduct", "VIEWER")).toBe(false);
    });
    it("falls back to ADMIN/MANAGER-only for an action with no entry", () => {
        expect(isActionAllowed("someBrandNewAction", "ADMIN")).toBe(true);
        expect(isActionAllowed("someBrandNewAction", "VIEWER")).toBe(false);
    });
});