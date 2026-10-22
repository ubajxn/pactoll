import { afterEach, expect, test } from "bun:test";
import { sameOrigin } from "../src/lib/auth/server";

const originalOrigin = process.env.BETTER_AUTH_URL;
afterEach(() => {
  if (originalOrigin === undefined) delete process.env.BETTER_AUTH_URL;
  else process.env.BETTER_AUTH_URL = originalOrigin;
});

test("chat uses the configured public HTTPS origin behind a reverse proxy", () => {
  process.env.BETTER_AUTH_URL = "https://crm.example.test";
  const request = (origin: string) =>
    new Request("http://localhost:3000/api/chat", {
      headers: { origin, host: "crm.example.test" },
    });
  expect(sameOrigin(request("https://crm.example.test"))).toBe(true);
  expect(sameOrigin(request("http://crm.example.test"))).toBe(false);
  expect(sameOrigin(request("https://other.example.test"))).toBe(false);
  expect(
    sameOrigin(
      new Request("http://localhost:3000/api/chat", {
        headers: {
          origin: "https://other.example.test",
          host: "other.example.test",
        },
      }),
    ),
  ).toBe(false);
});

test("local chat retains the requested host and permits authenticated server requests without Origin", () => {
  delete process.env.BETTER_AUTH_URL;
  expect(
    sameOrigin(
      new Request("http://localhost:3000/api/chat", {
        headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" },
      }),
    ),
  ).toBe(true);
  expect(
    sameOrigin(
      new Request("http://localhost:3000/api/chat", {
        headers: { origin: "http://localhost:3001", host: "localhost:3000" },
      }),
    ),
  ).toBe(false);
  expect(sameOrigin(new Request("http://localhost:3000/api/chat"))).toBe(true);
});
