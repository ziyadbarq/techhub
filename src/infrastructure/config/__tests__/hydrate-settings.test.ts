import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const connect = vi.fn();
  const query = vi.fn();
  const end = vi.fn();
  const client = vi.fn(function MockClient() {
    return {
      connect,
      query,
      end,
    };
  });
  const decrypt = vi.fn((value: string) => `decrypted:${value}`);

  return {
    connect,
    query,
    end,
    client,
    decrypt,
  };
});

vi.mock("pg", () => ({
  Client: mocks.client,
}));

vi.mock("@/lib/auth/encryption", () => ({
  decrypt: mocks.decrypt,
}));

import { hydrateSettingsIntoEnv } from "../hydrate-settings";

const originalEnv = { ...process.env };

describe("hydrateSettingsIntoEnv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DATABASE_URL:
        "postgresql://user:password@localhost:5432/test?schema=public",
    };

    delete process.env.LOG_LEVEL;
    delete process.env.MICROSOFT_CLIENT_SECRET;
    delete process.env.NEXT_PUBLIC_ENABLE_MS_AUTH;

    mocks.connect.mockResolvedValue(undefined);
    mocks.query.mockResolvedValue({
      rows: [
        { key: "LOG_LEVEL", value: "debug", isEncrypted: false },
        {
          key: "MICROSOFT_CLIENT_SECRET",
          value: "ciphertext",
          isEncrypted: true,
        },
        {
          key: "NEXT_PUBLIC_ENABLE_MS_AUTH",
          value: "true",
          isEncrypted: false,
        },
      ],
    });
    mocks.end.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("hydrates only restart-required settings and decrypts encrypted values", async () => {
    const hydrated = await hydrateSettingsIntoEnv();

    expect(mocks.client).toHaveBeenCalledWith({
      connectionString: process.env.DATABASE_URL,
    });
    expect(mocks.query).toHaveBeenCalledWith(
      'SELECT "key", "value", "isEncrypted" FROM "system_settings" WHERE "key" = ANY($1::text[])',
      [expect.arrayContaining(["LOG_LEVEL", "MICROSOFT_CLIENT_SECRET"])],
    );
    expect(process.env.LOG_LEVEL).toBe("debug");
    expect(process.env.MICROSOFT_CLIENT_SECRET).toBe("decrypted:ciphertext");
    expect(process.env.NEXT_PUBLIC_ENABLE_MS_AUTH).toBeUndefined();
    expect(hydrated).toBe(2);
  });
});
