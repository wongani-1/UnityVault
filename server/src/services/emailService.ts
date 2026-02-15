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

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (!env.email.user || !env.email.pass) {
      console.warn("Email credentials not configured. Email functionality will be disabled.");
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.email.user,
          pass: env.email.pass,
        },
      });

      console.log("Email service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize email service:", error);
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn("Email service not configured. Skipping email send.");
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"UnityVault" <${env.email.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""),
      });

      console.log("Email sent successfully:", info.messageId);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
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
                <strong>Important:</strong> This invitation expires on <strong>${expiryDate}</strong>
              </div>
              
              <p><strong>Registration Steps:</strong></p>
              <ol>
                <li>Click the activation link above</li>
                <li>Enter the OTP: <strong>${params.otp}</strong></li>
                <li>Set your password</li>
                <li>Start contributing!</li>
              </ol>
              
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

  async sendMemberApproval(params: {
    to: string;
    memberName: string;
    groupName: string;
    loginUrl: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Approved!</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              
              <p>Hello <strong>${params.memberName}</strong>,</p>
              
              <p>Great news! Your membership to <strong>${params.groupName}</strong> has been approved.</p>
              
              <p>You can now access all member features including:</p>
              <ul>
                <li>View your contribution history</li>
                <li>Make monthly contributions</li>
                <li>Apply for loans</li>
                <li>Track your savings and penalties</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${params.loginUrl}" class="button">Login to Your Account</a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #10b981;">${params.loginUrl}</p>
              
              <div class="footer">
                <p>This is an automated message from UnityVault. Please do not reply to this email.</p>
                <p>If you have any questions, please contact your group admin.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: params.to,
      subject: `${params.groupName} Membership Approved - Welcome!`,
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
