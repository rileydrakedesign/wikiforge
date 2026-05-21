import { describe, expect, it } from "vitest";
import Handlebars from "handlebars";
import "../src/utils/render.js";

describe("Handlebars helpers", () => {
  describe("eq", () => {
    it("returns true for strict equality", () => {
      const tmpl = Handlebars.compile("{{#if (eq a b)}}yes{{else}}no{{/if}}");
      expect(tmpl({ a: "x", b: "x" })).toBe("yes");
      expect(tmpl({ a: 1, b: 1 })).toBe("yes");
    });

    it("returns false for inequality", () => {
      const tmpl = Handlebars.compile("{{#if (eq a b)}}yes{{else}}no{{/if}}");
      expect(tmpl({ a: "x", b: "y" })).toBe("no");
      expect(tmpl({ a: 1, b: "1" })).toBe("no");
    });
  });

  describe("includes", () => {
    it("returns true when array contains value", () => {
      const tmpl = Handlebars.compile(
        "{{#if (includes arr v)}}in{{else}}out{{/if}}",
      );
      expect(tmpl({ arr: ["a", "b", "c"], v: "b" })).toBe("in");
    });

    it("returns false when array does not contain value", () => {
      const tmpl = Handlebars.compile(
        "{{#if (includes arr v)}}in{{else}}out{{/if}}",
      );
      expect(tmpl({ arr: ["a", "b"], v: "z" })).toBe("out");
    });

    it("returns false when arr is undefined or non-array", () => {
      const tmpl = Handlebars.compile(
        "{{#if (includes arr v)}}in{{else}}out{{/if}}",
      );
      expect(tmpl({ arr: undefined, v: "x" })).toBe("out");
      expect(tmpl({ arr: "not-an-array", v: "x" })).toBe("out");
    });
  });

  describe("join", () => {
    it("joins array with separator", () => {
      const tmpl = Handlebars.compile("{{join arr ', '}}");
      expect(tmpl({ arr: ["a", "b", "c"] })).toBe("a, b, c");
    });

    it("returns empty string for non-array input", () => {
      const tmpl = Handlebars.compile("{{join arr ', '}}");
      expect(tmpl({ arr: undefined })).toBe("");
      expect(tmpl({ arr: "not-an-array" })).toBe("");
    });

    it("handles empty array", () => {
      const tmpl = Handlebars.compile("{{join arr ', '}}");
      expect(tmpl({ arr: [] })).toBe("");
    });
  });
});
