import { assertEquals } from "@std/assert";
import { isValidDate, subtractYears } from "./date.ts";

Deno.test("date accepts only real ISO calendar dates", () => {
  assertEquals(isValidDate("2024-02-29"), true);
  assertEquals(isValidDate("2023-02-29"), false);
  assertEquals(isValidDate("2024-2-09"), false);
});

Deno.test("date does not roll leap day into another date", () => {
  assertEquals(subtractYears("2024-02-29", 1), null);
  assertEquals(subtractYears("2024-02-29", 2), null);
  assertEquals(subtractYears("2024-02-29", 4), "2020-02-29");
});
