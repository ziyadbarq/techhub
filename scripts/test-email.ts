/**
 * Test Email Script
 *
 * Tests email sending via Microsoft Graph API for debugging.
 *
 * Run with: npx dotenv -e .env.local -- npx tsx scripts/test-email.ts [recipient-email]
 *
 * Example: npx dotenv -e .env.local -- npx tsx scripts/test-email.ts asalzuwayed@barq.com
 *
 * Prerequisites:
 * - AZURE_EMAIL_TENANT_ID, AZURE_EMAIL_CLIENT_ID, AZURE_EMAIL_CLIENT_SECRET set in .env.local
 * - AZURE_EMAIL_FROM set to the sender mailbox (e.g., Intranet@barraq.com.sa)
 * - Azure AD app must have Mail.Send application permission with admin consent
 */

import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function log(
  message: string,
  type: "info" | "success" | "error" | "warn" = "info",
) {
  const prefix = {
    info: `${colors.cyan}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  };
  console.log(`${prefix[type]} ${message}`);
}

function header(text: string) {
  console.log(`\n${colors.bright}${text}${colors.reset}`);
  console.log("─".repeat(60));
}

async function main() {
  console.log(`\n${colors.bright}📧 Email Test Script${colors.reset}`);
  console.log("═".repeat(60));

  // Get recipient from command line
  const recipient = process.argv[2];
  if (!recipient) {
    log(
      "Usage: npx dotenv -e .env.local -- npx tsx scripts/test-email.ts <recipient-email>",
      "error",
    );
    log(
      "Example: npx dotenv -e .env.local -- npx tsx scripts/test-email.ts asalzuwayed@barq.com",
      "info",
    );
    process.exit(1);
  }

  // Validate email format
  if (!recipient.includes("@")) {
    log(`Invalid email address: ${recipient}`, "error");
    process.exit(1);
  }

  header("1. Checking Environment Variables");

  const tenantId = process.env.AZURE_EMAIL_TENANT_ID;
  const clientId = process.env.AZURE_EMAIL_CLIENT_ID;
  const clientSecret = process.env.AZURE_EMAIL_CLIENT_SECRET;
  const fromEmail = process.env.AZURE_EMAIL_FROM;

  const envVars = [
    {
      name: "AZURE_EMAIL_TENANT_ID",
      value: tenantId,
      masked: tenantId ? `${tenantId.substring(0, 8)}...` : null,
    },
    {
      name: "AZURE_EMAIL_CLIENT_ID",
      value: clientId,
      masked: clientId ? `${clientId.substring(0, 8)}...` : null,
    },
    {
      name: "AZURE_EMAIL_CLIENT_SECRET",
      value: clientSecret,
      masked: clientSecret ? "***" : null,
    },
    { name: "AZURE_EMAIL_FROM", value: fromEmail, masked: fromEmail },
  ];

  let missingEnv = false;
  for (const env of envVars) {
    if (env.value) {
      log(`${env.name}: ${colors.dim}${env.masked}${colors.reset}`, "success");
    } else {
      log(`${env.name}: ${colors.red}NOT SET${colors.reset}`, "error");
      missingEnv = true;
    }
  }

  if (missingEnv) {
    log(
      "\nPlease set all required environment variables in .env.local",
      "error",
    );
    process.exit(1);
  }

  header("2. Authenticating with Azure AD");

  try {
    const credential = new ClientSecretCredential(
      tenantId!,
      clientId!,
      clientSecret!,
    );

    log("Getting access token...", "info");
    const tokenResponse = await credential.getToken(
      "https://graph.microsoft.com/.default",
    );
    log(
      `Access token acquired (expires: ${tokenResponse.expiresOnTimestamp ? new Date(tokenResponse.expiresOnTimestamp).toISOString() : "unknown"})`,
      "success",
    );
  } catch (error) {
    log(
      `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      "error",
    );
    log("\nPossible causes:", "warn");
    log("  - Invalid tenant ID, client ID, or client secret", "info");
    log("  - Azure AD app registration not properly configured", "info");
    log("  - Network connectivity issues", "info");
    process.exit(1);
  }

  header("3. Initializing Graph Client");

  const credential = new ClientSecretCredential(
    tenantId!,
    clientId!,
    clientSecret!,
  );

  const authProvider = {
    getAccessToken: async (): Promise<string> => {
      const token = await credential.getToken(
        "https://graph.microsoft.com/.default",
      );
      return token.token;
    },
  };

  const client = Client.initWithMiddleware({
    authProvider: authProvider as Parameters<
      typeof Client.initWithMiddleware
    >[0]["authProvider"],
  });

  log("Graph client initialized", "success");

  header("4. Sending Test Email");

  console.log(`\n  ${colors.dim}From:${colors.reset}    ${fromEmail}`);
  console.log(`  ${colors.dim}To:${colors.reset}      ${recipient}`);
  console.log(
    `  ${colors.dim}Subject:${colors.reset} Test Email from Barq ITAM\n`,
  );

  const timestamp = new Date().toISOString();
  const emailPayload = {
    message: {
      subject: `Test Email from Barq ITAM - ${timestamp}`,
      body: {
        contentType: "HTML",
        content: `
          <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #2563eb; margin-bottom: 20px;">📧 Test Email</h1>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  This is a test email sent from <strong>Barq ITAM</strong> via Microsoft Graph API.
                </p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    <strong>Timestamp:</strong> ${timestamp}<br/>
                    <strong>Sender:</strong> ${fromEmail}<br/>
                    <strong>Recipient:</strong> ${recipient}
                  </p>
                </div>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  If you received this email, the email service is working correctly! ✅
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #9ca3af; font-size: 12px;">
                  This email was sent automatically by the email testing script.<br/>
                  © Barq Financial Services
                </p>
              </div>
            </body>
          </html>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: recipient,
          },
        },
      ],
    },
    saveToSentItems: true,
  };

  try {
    log("Sending email via Graph API...", "info");

    await client.api(`/users/${fromEmail}/sendMail`).post(emailPayload);

    log("Email sent successfully!", "success");

    console.log(
      `\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}`,
    );
    console.log(`${colors.green}  ✓ Email sent successfully!${colors.reset}`);
    console.log(
      `${colors.green}  Check ${recipient} inbox for the test email.${colors.reset}`,
    );
    console.log(
      `${colors.bright}${colors.green}═══════════════════════════════════════════════════════════${colors.reset}\n`,
    );
  } catch (error) {
    log("Failed to send email", "error");

    if (error instanceof Error) {
      console.log(`\n${colors.red}Error Details:${colors.reset}`);
      console.log(`  Message: ${error.message}`);

      // Try to extract more details from Graph API error
      const graphError = error as {
        statusCode?: number;
        code?: string;
        body?: string;
      };
      if (graphError.statusCode) {
        console.log(`  Status Code: ${graphError.statusCode}`);
      }
      if (graphError.code) {
        console.log(`  Error Code: ${graphError.code}`);
      }
      if (graphError.body) {
        try {
          const body = JSON.parse(graphError.body);
          console.log(`  Details: ${JSON.stringify(body.error, null, 2)}`);
        } catch {
          console.log(`  Body: ${graphError.body}`);
        }
      }
    }

    console.log(`\n${colors.yellow}Troubleshooting Tips:${colors.reset}`);
    console.log(
      "  1. Verify AZURE_EMAIL_FROM mailbox exists and is licensed for Exchange Online",
    );
    console.log(
      "  2. Ensure Azure AD app has 'Mail.Send' application permission (not delegated)",
    );
    console.log(
      "  3. Confirm admin consent was granted for the Mail.Send permission",
    );
    console.log("  4. Check if the mailbox has any send restrictions");
    console.log("  5. Verify the recipient email address is valid");

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n💥 Unexpected error:", error);
  process.exit(1);
});
