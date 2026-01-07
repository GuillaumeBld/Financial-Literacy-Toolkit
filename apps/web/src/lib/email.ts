/**
 * Email utility functions for sending emails using Resend
 */

import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!resend) {
    const error = 'RESEND_API_KEY environment variable is not set';
    console.error('Email sending failed:', error);
    throw new Error(error);
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    const error = 'RESEND_FROM_EMAIL environment variable is not set';
    console.error('Email sending failed:', error);
    throw new Error(error);
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version if not provided
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      throw new Error(`Failed to send email: ${JSON.stringify(result.error)}`);
    }

    console.log('Email sent successfully:', {
      to: options.to,
      subject: options.subject,
      id: result.data?.id,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  courseCode: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&courseCode=${encodeURIComponent(courseCode)}`;
  
  const emailOptions: EmailOptions = {
    to: email,
    subject: 'Password Reset Request - Financial Literacy Assessment',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #8B1538; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Financial Literacy Toolkit</h1>
            <p style="margin: 5px 0 0 0;">L. University - Q School of Business</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #8B1538; margin-top: 0;">Password Reset Request</h2>
            
            <p>You requested to reset your password for the Financial Literacy Assessment.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #8B1538; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #8B1538; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              © 2025 L. University. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request - Financial Literacy Assessment
      
      You requested to reset your password for the Financial Literacy Assessment.
      
      Click this link to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
      
      © 2025 L. University. All rights reserved.
    `,
  };

  await sendEmail(emailOptions);
}

