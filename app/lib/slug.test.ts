import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
    it("lowercases and replaces spaces with dashes", () => {
        expect(slugify("Treadwell Logistics")).toMatch(/^treadwell-logistics-[a-z0-9]{4}$/);
    });

    it("strips characters that aren't letters or numbers", () => {
        expect(slugify("Alex's Co.!!")).toMatch(/^alex-s-co-[a-z0-9]{4}$/)
    })
})