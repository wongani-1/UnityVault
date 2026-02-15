# Email Service Integration - UnityVault

## Overview

The UnityVault backend now includes a comprehensive email notification service using Nodemailer and Gmail. This service automatically sends emails for key user actions without requiring manual intervention.

## Features

### 1. Member Invitation Emails
- **Trigger**: When an admin creates a member invite
- **Content**: 
  - Welcome message with group name
  - 6-digit OTP code (large, centered display)
  - Activation link
  - Expiration date (7 days)
  - Step-by-step instructions
- **Template**: Professional HTML with branded styling

### 2. Member Approval Emails
- **Trigger**: When an admin approves a pending member
- **Content**:
  - Approval confirmation
  - List of available features
  - Login link
  - Welcome message
- **Template**: Success-themed HTML design

### 3. Contribution Payment Confirmations
- **Trigger**: When a member makes a contribution payment
- **Content**:
  - Payment amount (highlighted)
  - Transaction details (month, ID, date)
  - Updated member balance
  - Group name
  - Record-keeping notice
- **Template**: Receipt-style HTML with transaction breakdown

### 4. OTP Email (Generic)
- **Purpose**: Can be used for password resets, verification, etc.
- **Features**:
  - Secure 6-digit code
  - Customizable purpose message
  - Expiration time (configurable)
  - Security tips
- **Template**: Security-focused design

## Setup Instructions

### 1. Install Dependencies
Already installed via npm:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Configure Gmail App Password

1. **Enable 2-Step Verification**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Navigate to "2-Step Verification"
   - Follow prompts to enable it

2. **Generate App Password**:
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select "Other" as the device and name it "UnityVault"
   - Copy the 16-character password (no spaces)

3. **Update Environment Variables**:
   Create or update `server/.env`:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=your-16-character-app-password
   ```

### 3. Environment Variables Reference

See `server/.env.example` for all required configuration:
- `GMAIL_USER`: Your Gmail address
- `GMAIL_PASS`: Your Gmail app password (not your regular password)
- `APP_BASE_URL`: Frontend URL for generating links (default: `http://localhost:5173`)

## Architecture

### Service Design

The `EmailService` class follows the project's existing patterns:

- **Singleton Transporter**: Created once on initialization, reused for all emails
- **Graceful Degradation**: If email credentials aren't configured, the system logs a warning and continues without sending emails
- **Async Operation**: Emails are sent asynchronously to avoid blocking API responses
- **Error Handling**: Email failures are logged but don't crash the application

### Integration Points

#### MemberService
```typescript
// In createInvite()
if (params.email) {
  this.emailService.sendMemberInvite({...}).catch(console.error);
}

// In approve()
if (member.email) {
  this.emailService.sendMemberApproval({...}).catch(console.error);
}
```

#### ContributionService
```typescript
// In recordPayment()
if (member.email && updated && updatedMember) {
  this.emailService.sendContributionConfirmation({...}).catch(console.error);
}
```

### File Structure

```
server/src/
├── services/
│   └── emailService.ts          # Email sending logic and templates
├── config/
│   └── env.ts                   # Email config added
└── container.ts                 # EmailService registered
```

## Email Templates

All email templates include:
- Professional HTML design
- Responsive layout (mobile-friendly)
- Consistent branding (primary color: #4F46E5)
- Clear call-to-action buttons
- Security notices where appropriate
- Footer with automated message disclaimer

### Template Customization

To customize email templates, edit the HTML strings in `emailService.ts`:
- Modify colors by changing hex values
- Update branding by changing "UnityVault" references
- Adjust styling in the `<style>` blocks
- Add/remove content sections as needed

## Testing

### 1. Verify Configuration
```typescript
const isConfigured = await container.emailService.verify();
console.log('Email service ready:', isConfigured);
```

### 2. Test Email Sending
```typescript
// Send a test OTP email
await container.emailService.sendOTP({
  to: 'test@example.com',
  memberName: 'Test User',
  otp: '123456',
  purpose: 'testing',
  expiresInMinutes: 10,
});
```

### 3. Monitor Logs
The service logs all operations:
- `Email service initialized successfully` - Service ready
- `Email sent successfully: <messageId>` - Email sent
- `Failed to send email: <error>` - Email failed (check credentials)
- `Email service not configured` - Credentials missing (graceful degradation)

## Production Considerations

### Security
- ✅ Never commit `.env` file to version control (add to `.gitignore`)
- ✅ Use environment-specific credentials in production
- ✅ App passwords are more secure than regular passwords
- ✅ Regularly rotate app passwords
- ✅ Monitor email sending limits (Gmail: 500/day for free accounts)

### Reliability
- ✅ Emails are sent asynchronously (non-blocking)
- ✅ Email failures don't break API responses
- ✅ Transporter is verified on initialization
- ✅ Detailed error logging for debugging

### Scalability
For production environments:
- Consider using dedicated email service (SendGrid, AWS SES, etc.)
- Implement email queue for high volume
- Add retry logic for failed sends
- Monitor email delivery rates

## API Impact

No breaking changes to existing endpoints. Email functionality is transparent:

- ✅ All existing endpoints continue to work
- ✅ Emails are sent automatically when appropriate
- ✅ No additional API requests required
- ✅ Email failures don't affect API responses

## Troubleshooting

### Email Not Sending

1. **Check credentials**:
   ```bash
   echo $GMAIL_USER
   echo $GMAIL_PASS
   ```

2. **Verify app password** (not regular password):
   - App passwords are 16 characters
   - No spaces or dashes
   - Generated from Google Account settings

3. **Check logs**:
   - Look for "Email service initialized successfully"
   - Check for error messages in console

4. **Test transporter**:
   ```typescript
   const verified = await emailService.verify();
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Use app password, not regular password |
| "Less secure app access" | Enable 2-Step Verification first |
| "Daily limit exceeded" | Gmail free accounts limited to 500/day |
| "Connection timeout" | Check firewall/network settings |

## Future Enhancements

Potential additions:
- [ ] Loan approval/rejection emails
- [ ] Penalty notification emails
- [ ] Monthly contribution reminders
- [ ] Admin activity summaries
- [ ] Email templates management UI
- [ ] Multi-language support
- [ ] SMS integration as fallback

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with `emailService.verify()` method
4. Review Gmail account settings

---

**Note**: This feature is production-ready and follows all existing project conventions. It gracefully degrades if email credentials are not provided, ensuring the application continues to function normally.
