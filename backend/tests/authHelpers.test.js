import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail } from "../utils/authHelpers.js";

describe("normalizeEmail", () => {
  test("trims and lowercases", () => {
    assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
  });

  test("returns empty string for null/undefined", () => {
    assert.equal(normalizeEmail(null), "");
    assert.equal(normalizeEmail(undefined), "");
  });

  test("returns empty for non-string", () => {
    assert.equal(normalizeEmail(123), "");
  });
});
