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


