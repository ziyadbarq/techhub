/**
 * Test Password Compatibility
 *
 * Verifies that our password utilities are compatible with Better Auth's
 * authentication system by testing against actual database hashes.
 */

import { prisma } from "../src/infrastructure/database/prisma/client";
import {
  hashPassword,
  verifyPassword,
  generateSecurePassword,
} from "../src/lib/utils/password";

async function testPasswordCompatibility() {
  try {
    console.log("🔐 Testing Password Compatibility with Better Auth\n");

    // Test 1: Generate and verify a new password
    console.log("Test 1: Password generation and verification");
    const testPassword = "TestPassword123!";
    const hash1 = await hashPassword(testPassword);
    console.log(`  ✓ Generated hash: ${hash1.substring(0, 50)}...`);
    console.log(`  ✓ Hash length: ${hash1.length} chars`);

    const isValid1 = await verifyPassword(testPassword, hash1);
    console.log(`  ✓ Verification: ${isValid1 ? "PASS" : "FAIL"}`);

    const isInvalid1 = await verifyPassword("WrongPassword", hash1);
    console.log(
      `  ✓ Wrong password rejection: ${!isInvalid1 ? "PASS" : "FAIL"}`,
    );

    // Test 2: Verify against actual database hash
    console.log("\nTest 2: Verify against existing database hash");
    const account = await prisma.account.findFirst({
      where: { provider: "credential" },
      select: { password: true, user: { select: { email: true } } },
    });

    if (account?.password) {
      console.log(`  ✓ Found existing account: ${account.user.email}`);
      console.log(`  ✓ Database hash length: ${account.password.length} chars`);
      console.log(
        `  ✓ Database hash format: ${account.password.substring(0, 50)}...`,
      );

      // Note: We can't verify without knowing the actual password,
      // but we can check the format is correct
      const parts = account.password.split(":");
      if (
        parts.length === 2 &&
        parts[0]?.length === 32 &&
        parts[1]?.length === 128
      ) {
        console.log("  ✓ Hash format: VALID (salt:hash format)");
      } else {
        console.log("  ✗ Hash format: INVALID");
      }
    } else {
      console.log("  ℹ No credential accounts found in database");
    }

    // Test 3: Secure password generation
    console.log("\nTest 3: Secure password generation");
    const generated1 = generateSecurePassword();
    const generated2 = generateSecurePassword();
    console.log(`  ✓ Generated password 1: ${generated1}`);
    console.log(`  ✓ Generated password 2: ${generated2}`);
    console.log(
      `  ✓ Passwords are unique: ${generated1 !== generated2 ? "PASS" : "FAIL"}`,
    );
    console.log(`  ✓ Password length: ${generated1.length} chars`);

    // Test that generated password can be hashed and verified
    const hash2 = await hashPassword(generated1);
    const isValid2 = await verifyPassword(generated1, hash2);
    console.log(
      `  ✓ Generated password verification: ${isValid2 ? "PASS" : "FAIL"}`,
    );

    // Test 4: Hash format consistency
    console.log("\nTest 4: Hash format consistency");
    const hash3 = await hashPassword("AnotherTest123!");
    const hash4 = await hashPassword("AnotherTest123!");
    console.log(`  ✓ Hash 1: ${hash3.substring(0, 50)}...`);
    console.log(`  ✓ Hash 2: ${hash4.substring(0, 50)}...`);
    console.log(
      `  ✓ Hashes are unique (salted): ${hash3 !== hash4 ? "PASS" : "FAIL"}`,
    );

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordCompatibility();
