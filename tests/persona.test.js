import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("persona file exists and is non-empty", async () => {
  const content = await readFile(new URL("../persona/persona.md", import.meta.url), "utf8");
  assert.ok(content.trim().length > 20);
});
