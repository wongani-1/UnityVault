import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export class EmailService {
  private transporter: Transporter | null = null;
  private initialized = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (!env.email.user || !env.email.pass) {
      console.warn("Email credentials not configured. Email functionality will be disabled.");
      console.warn("Set GMAIL_USER and GMAIL_PASS environment variables to enable email.");
      return;
    }

    try {
      // Use explicit SMTP config instead of service shorthand for better
      // compatibility with cloud hosting providers (Render, Railway, etc.)
      this.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // SSL
        auth: {
          user: env.email.user,
          pass: env.email.pass,
        },
        // Increase timeouts for cloud environments
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        // Enable debug logging in production to diagnose issues
        logger: env.isProduction,
        debug: env.isProduction,
      });

      console.log(`Email service initialized (user: ${env.email.user})`);

      // Verify connection asynchronously on startup
      this.verifyOnStartup();
    } catch (error) {
      console.error("Failed to initialize email service:", error);
      this.transporter = null;
    }
  }

  private async verifyOnStartup() {
    try {
      await this.transporter!.verify();
      this.initialized = true;
      console.log("✓ Email transporter verified - SMTP connection is working");
    } catch (error: any) {
      console.error("✗ Email transporter verification FAILED:", error?.message || error);
      console.error("  This means emails will NOT be delivered.");
      console.error("  Check that GMAIL_USER and GMAIL_PASS (App Password) are correct.");
      console.error("  For Gmail, you must use an App Password, not your regular password.");
      console.error("  Generate one at: https://myaccount.google.com/apppasswords");
      // Keep the transporter — it may still work for individual sends even if verify fails
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn("Email service not configured. Skipping email to:", options.to);
      return false;
    }

    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Sending email (attempt ${attempt}/${maxRetries}): to=${options.to}, subject="${options.subject}"`);

        const info = await this.transporter.sendMail({
          from: `"UnityVault" <${env.email.user}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ""),
        });

        console.log(`Email sent successfully: messageId=${info.messageId}, to=${options.to}`);
        return true;
      } catch (error: any) {
        lastError = error;
        console.error(`Email send attempt ${attempt} failed:`, {
          to: options.to,
          error: error?.message || error,
          code: error?.code,
          command: error?.command,
          responseCode: error?.responseCode,
          response: error?.response,
        });

        // Don't retry on auth errors — they won't resolve
        if (error?.responseCode === 535 || error?.code === "EAUTH") {
          console.error("Authentication failed. Check GMAIL_USER and GMAIL_PASS env vars.");
          break;
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.error(`All ${maxRetries} email send attempts failed for ${options.to}:`, lastError?.message);
    return false;
  }

  async sendMemberInvite(params: {
    to: string;
    memberName: string;
    groupName: string;
    otp: string;
    link: string;
    expiresAt: string;
  }): Promise<boolean> {
    const expiryDate = new Date(params.expiresAt).toLocaleString();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; background: linear-gradient(to right, #3b82f6, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; border: 2px solid #4F46E5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }
            .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UnityVault</div>
              <h1>Welcome to ${params.groupName}!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.memberName}</strong>,</p>
              
              <p>You have been invited to join <strong>${params.groupName}</strong> on UnityVault.</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Your One-Time Password (OTP)</p>
                <div class="otp">${params.otp}</div>
              </div>
              
              <p>To complete your registration, click the button below and enter the OTP:</p>
              
              <div style="text-align: center;">
                <a href="${params.link}" class="button">Activate Your Account</a>
              </div>
              
              <div class="warning">
                <strong>Important:</strong> Your activation link and OTP expire in <strong>5 minutes</strong> (at <strong>${expiryDate}</strong>).
              </div>
              
              <p><strong>Registration Steps:</strong></p>
              <ol>
                <li>Click the activation link above</li>
                <li>Enter the OTP: <strong>${params.otp}</strong></li>
                <li>Set your password</li>
                <li>Start contributing!</li>
              </ol>

              <p style="color: #b45309; font-weight: 600;">After 5 minutes, both the activation link and OTP will expire and you'll need a new invitation.</p>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${params.link}</p>
              
              <div class="footer">
                <p>This is an automated message from UnityVault. Please do not reply to this email.</p>
                <p>If you didn't request this invitation, please ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `Welcome to ${params.groupName} - Activate Your Account`,
      html,
    });
  }

  async sendLoanApproval(params: {
    to: string;
    memberName: string;
    groupName: string;
    loanAmount: number;
    totalDue: number;
    installments: number;
    interestRate: number;
    loginUrl: string;
  }): Promise<boolean> {
    const formattedLoanAmount = `MWK ${params.loanAmount.toLocaleString()}`;
    const formattedTotalDue = `MWK ${params.totalDue.toLocaleString()}`;
    const installmentAmount = params.totalDue / params.installments;
    const formattedInstallment = `MWK ${installmentAmount.toLocaleString()}`;
    const interestPercent = (params.interestRate * 100).toFixed(1);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; background: linear-gradient(to right, #3b82f6, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .amount-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { color: #6b7280; }
            .detail-value { font-weight: bold; }
            .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
            .info-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UnityVault</div>
              <h1>Loan Approved! 🎉</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              
              <p>Hello <strong>${params.memberName}</strong>,</p>
              
              <p>Great news! Your loan application has been approved by the <strong>${params.groupName}</strong> administrators.</p>
              
              <div class="amount-box">
                <h2 style="margin: 0; color: #10b981;">${formattedLoanAmount}</h2>
                <p style="margin: 5px 0 0 0; color: #6b7280;">Loan Amount Approved</p>
              </div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Loan Amount:</span>
                  <span class="detail-value">${formattedLoanAmount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Interest Rate:</span>
                  <span class="detail-value">${interestPercent}%</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total to Repay:</span>
                  <span class="detail-value">${formattedTotalDue}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of Installments:</span>
                  <span class="detail-value">${params.installments} months</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Monthly Payment:</span>
                  <span class="detail-value">${formattedInstallment}</span>
                </div>
              </div>
              
              <div class="info-box">
                <strong>📅 Repayment Schedule:</strong> Your first installment is due in one month. You can view your complete repayment schedule and make payments through your dashboard.
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Log in to your account to view your full repayment schedule</li>
                <li>Make sure to pay each installment on time to avoid penalties</li>
                <li>You can make early payments at any time</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="${params.loginUrl}" class="button">View Loan Details</a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #10b981;">${params.loginUrl}</p>
              
              <div class="footer">
                <p>This is an automated message from UnityVault. Please do not reply to this email.</p>
                <p>If you have any questions about your loan, please contact your group admin.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `${params.groupName} - Loan Approved!`,
      html,
    });
  }

  async sendContributionConfirmation(params: {
    to: string;
    memberName: string;
    groupName: string;
    amount: number;
    month: string;
    transactionId: string;
    newBalance: number;
  }): Promise<boolean> {
    const formattedAmount = `MWK ${params.amount.toLocaleString()}`;
    const formattedBalance = `MWK ${params.newBalance.toLocaleString()}`;
    const monthName = new Date(params.month + "-01").toLocaleString("default", { month: "long", year: "numeric" });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; background: linear-gradient(to right, #3b82f6, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .amount-box { background-color: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { color: #6b7280; }
            .detail-value { font-weight: bold; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UnityVault</div>
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.memberName}</strong>,</p>
              
              <p>Thank you! Your contribution payment has been successfully received and recorded.</p>
              
              <div class="amount-box">
                <h2 style="margin: 0; color: #10b981;">✓ ${formattedAmount}</h2>
              </div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Group:</span>
                  <span class="detail-value">${params.groupName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Month:</span>
                  <span class="detail-value">${monthName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Transaction ID:</span>
                  <span class="detail-value">${params.transactionId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Your New Balance:</span>
                  <span class="detail-value">${formattedBalance}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date().toLocaleString()}</span>
                </div>
              </div>
              
              <p>This payment has been added to your savings balance and recorded in the group's accounts.</p>
              
              <p><strong>Important:</strong> Keep this email as proof of payment for your records.</p>
              
              <div class="footer">
                <p>This is an automated message from UnityVault. Please do not reply to this email.</p>
                <p>If you have any questions about this transaction, please contact your group admin.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `Payment Confirmed - ${monthName} Contribution`,
      html,
    });
  }

  async sendOTP(params: {
    to: string;
    memberName: string;
    otp: string;
    purpose: string;
    expiresInMinutes: number;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; background: linear-gradient(to right, #3b82f6, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-box { background-color: white; border: 2px solid #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp { font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 10px; }
            .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UnityVault</div>
              <h1>Verification Code</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${params.memberName}</strong>,</p>
              
              <p>Your one-time password (OTP) for ${params.purpose}:</p>
              
              <div class="otp-box">
                <div class="otp">${params.otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Enter this code to continue</p>
              </div>
              
              <div class="warning">
                <strong>Security Notice:</strong> This code expires in <strong>${params.expiresInMinutes} minutes</strong>
              </div>
              
              <p><strong>Important Security Tips:</strong></p>
              <ul>
                <li>Never share this code with anyone</li>
                <li>UnityVault staff will never ask for your OTP</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
              
              <div class="footer">
                <p>This is an automated message from UnityVault. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `Your UnityVault Verification Code: ${params.otp}`,
      html,
    });
  }

  /**
   * Verify transporter is configured and working
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email transporter verification failed:", error);
      return false;
    }
  }
}
