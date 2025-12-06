# Two-Factor Authentication (2FA) - User Guide

**For**: All barq TechHub Users
**Last Updated**: 2025-12-06

## What is Two-Factor Authentication?

Two-Factor Authentication (2FA) adds an extra layer of security to your account. When enabled, you'll need:
1. **Something you know**: Your password
2. **Something you have**: Your mobile device with an authenticator app

This prevents unauthorized access even if someone knows your password.

## Supported Authenticator Apps

You can use any TOTP-compatible authenticator app:

- **Google Authenticator** (iOS/Android) - Recommended
- **Microsoft Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **1Password** (Includes TOTP generator)
- **Bitwarden** (Premium feature)
- **LastPass Authenticator**

## How to Enable 2FA

### Step 1: Access Settings

1. Log in to barq TechHub
2. Click your profile picture (top right)
3. Select **Settings**
4. Navigate to **Security** section

### Step 2: Start Setup

1. Click the **Enable 2FA** button
2. Enter your password when prompted
3. Click **Continue**

### Step 3: Scan QR Code

1. Open your authenticator app
2. Tap **Add Account** or **+** button
3. Select **Scan QR Code**
4. Point your camera at the QR code on screen
5. The app will add an entry: **barq TechHub (your-email@barq.com)**

**Can't scan the code?** Most apps let you enter the secret manually instead.

### Step 4: Verify Setup

1. Your authenticator app will show a 6-digit code
2. Enter this code in the verification field
3. Click **Verify & Enable**

⏰ **Note**: Codes refresh every 30 seconds. Use the currently displayed code.

### Step 5: Save Backup Codes

**IMPORTANT**: You'll be shown 10 backup codes. These are for emergency access.

1. Click **Copy Codes** or **Download** to save them
2. Store them in a secure location (password manager, encrypted file, safe)
3. Each code can only be used **once**
4. Click **Done** when you've saved them

✅ **2FA is now enabled!** You'll see a green "Enabled" badge in Settings.

## How to Log In with 2FA

### Normal Login Flow

1. Enter your email and password on the login page
2. Click **Sign In**
3. You'll be redirected to the **Two-Factor Authentication** page
4. Open your authenticator app
5. Enter the 6-digit code for **barq TechHub**
6. Click **Verify & Sign In**
7. You'll be logged in to the dashboard

### Using a Backup Code

If you lost your phone or can't access your authenticator app:

1. On the 2FA verification page, click **Use backup code instead**
2. Enter one of your saved backup codes
3. Click **Verify & Sign In**

⚠️ **Remember**: Each backup code works only once. You'll have fewer codes available after using one.

## How to Disable 2FA

**Warning**: Disabling 2FA makes your account less secure.

1. Go to **Settings** → **Security**
2. Click **Disable 2FA**
3. Enter your password
4. Click **Disable 2FA** to confirm

Your authenticator app entry will still exist but won't work for login.

## Troubleshooting

### "Invalid code" Error

**Possible Causes**:
- Code expired (they refresh every 30 seconds)
- Wrong account selected in authenticator app
- Clock out of sync

**Solutions**:
1. Wait for the next code to appear in your app
2. Make sure you're using the code for **barq TechHub**
3. Check your phone's date/time settings (should be automatic)

### Lost Phone or Authenticator App

**If you have backup codes**:
1. Use a backup code to log in
2. Go to Settings and disable 2FA
3. Re-enable 2FA with a new device

**If you lost backup codes too**:
1. Contact the IT Help Desk
2. Verify your identity (may require in-person verification)
3. IT admin will disable 2FA for your account
4. Log in with password only
5. **Immediately re-enable 2FA** for security

### Code Not Accepted (Clock Skew)

TOTP codes are time-based. If your phone's clock is wrong:

1. Go to your phone's Settings → Date & Time
2. Enable **Set Automatically**
3. Wait 30 seconds for a fresh code
4. Try logging in again

### Wrong QR Code Scanned

If you scanned an old or incorrect QR code:

1. Delete the **barq TechHub** entry from your authenticator app
2. Go to Settings and disable 2FA
3. Re-enable 2FA and scan the new QR code

## Security Best Practices

### ✅ DO:
- Save backup codes in a password manager
- Enable 2FA on all important accounts (email, banking, etc.)
- Use a reputable authenticator app
- Keep your authenticator app updated
- Set automatic date/time on your phone

### ❌ DON'T:
- Share your backup codes with anyone
- Take screenshots of QR codes (store securely instead)
- Use SMS-based 2FA if TOTP is available (less secure)
- Delete your authenticator app without disabling 2FA first
- Store backup codes in plain text (email, notes, etc.)

## Getting New Backup Codes

**Currently**: If you've used most of your backup codes, you need to:
1. Disable 2FA
2. Re-enable 2FA
3. You'll get 10 fresh backup codes

**Future Enhancement**: Regenerate codes without disabling 2FA (planned for v1.5.0)

## Multi-Device Setup

You can add the same account to multiple devices:

1. During 2FA setup, scan the QR code with **all** your devices
2. The same 6-digit code will appear on all devices
3. Use any device to generate codes for login

**Recommended**: Have 2FA on at least 2 devices in case you lose one.

## For Microsoft SSO Users

**Note**: If you log in using your Microsoft account (SSO):
- You use Microsoft's 2FA (if enabled by your organization)
- barq TechHub's 2FA is managed separately
- You may have 2FA on both systems for maximum security

## Frequently Asked Questions

### Q: Is 2FA required?
**A**: Currently optional. Your organization may require it in the future.

### Q: Can I use SMS instead of an app?
**A**: Not currently supported. Authenticator apps are more secure than SMS.

### Q: What happens if I change phones?
**A**: Transfer your authenticator to the new phone using the app's export/backup feature, or disable and re-enable 2FA.

### Q: Can I trust this device for 30 days?
**A**: Not yet. Planned for v1.5.0.

### Q: How many backup codes do I get?
**A**: 10 single-use codes.

### Q: Can I print my backup codes?
**A**: Yes, click Download and print them. Store the printout securely.

### Q: Does 2FA work on mobile browsers?
**A**: Yes, works on all devices with a browser.

## Need Help?

**IT Help Desk**:
- Email: it-support@barq.com
- Phone: [Internal Extension]
- Portal: [Internal Support Portal]

**Emergency Access**:
- If locked out, contact IT immediately
- Have your employee ID ready for verification
- In-person verification may be required

## Additional Resources

**Technical Documentation**:
- [Two-Factor Authentication Technical Guide](../features/TWO_FACTOR_AUTHENTICATION.md)

**Security Awareness**:
- [OWASP Multi-Factor Authentication Guide](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- [Google 2FA Best Practices](https://support.google.com/accounts/answer/185839)

---

**Last Updated**: 2025-12-06
**Version**: 1.0
**Applies To**: barq TechHub v1.4.0+
