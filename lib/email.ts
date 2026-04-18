import nodemailer from 'nodemailer';

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.SMTP_HOST) {
      console.warn('Email service not configured. Skipping email.');
      return { success: true, skipped: true };
    }

    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@fastship.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function getApplicationSubmittedEmail(applicantName: string, applicationType: string, approvalId: string, email: string) {
  const type = applicationType === 'DRIVER' ? 'Driver' : 'Business';
  const checkStatusUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/check-status?email=${encodeURIComponent(email)}&type=${applicationType}`;

  return {
    subject: `Application Submitted - ${type} Registration`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Application Submitted Successfully</h2>
        <p>Hello ${applicantName},</p>
        <p>Thank you for submitting your application to join FastShip as a ${type.toLowerCase()}.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Application ID:</strong></p>
          <p style="font-family: monospace; color: #0066cc;">${approvalId}</p>
        </div>
        
        <p>Our admin team will review your application within <strong>24-48 hours</strong>.</p>
        <p>You can track your application status at any time using the link below:</p>
        
        <a href="${checkStatusUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Check Application Status
        </a>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          If you have any questions, please contact our support team at support@fastship.com
        </p>
      </div>
    `,
    text: `Application Submitted Successfully\n\nHello ${applicantName},\n\nThank you for submitting your application to join FastShip as a ${type.toLowerCase()}.\n\nApplication ID: ${approvalId}\n\nOur admin team will review your application within 24-48 hours.\n\nYou can check your application status at: ${checkStatusUrl}`,
  };
}

export function getApplicationApprovedEmail(applicantName: string, applicationType: string, approvalId: string, completionUrl: string) {
  const type = applicationType === 'DRIVER' ? 'Driver' : 'Business';

  return {
    subject: `Application Approved - Complete Your Registration`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Congratulations! Your Application is Approved</h2>
        <p>Hello ${applicantName},</p>
        <p>Great news! Your ${type.toLowerCase()} application has been approved by our admin team.</p>
        
        <p>Now you need to complete your registration by setting a password for your account.</p>
        
        <a href="${completionUrl}" style="display: inline-block; background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          Complete Your Registration
        </a>
        
        <p style="color: #666; font-size: 14px;">
          Or copy this link: <br/>
          <code style="background-color: #f5f5f5; padding: 5px 10px; border-radius: 3px;">${completionUrl}</code>
        </p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          If you have any questions, please contact our support team at support@fastship.com
        </p>
      </div>
    `,
    text: `Congratulations! Your Application is Approved\n\nHello ${applicantName},\n\nYour ${type.toLowerCase()} application has been approved!\n\nComplete your registration: ${completionUrl}`,
  };
}

export function getApplicationRejectedEmail(applicantName: string, applicationType: string, rejectionReason: string) {
  const type = applicationType === 'DRIVER' ? 'Driver' : 'Business';
  const reapplyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/${applicationType === 'DRIVER' ? 'driver' : 'business'}/apply`;

  return {
    subject: `Application Status Update`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Application Status Update</h2>
        <p>Hello ${applicantName},</p>
        <p>Thank you for submitting your application. After careful review, we are unable to approve your application at this time.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p><strong>Reason for Rejection:</strong></p>
          <p>${rejectionReason}</p>
        </div>
        
        <p>You are welcome to submit a new application after addressing the issues mentioned above.</p>
        
        <a href="${reapplyUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Submit New Application
        </a>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          If you believe this is an error or have questions, please contact our support team at support@fastship.com
        </p>
      </div>
    `,
    text: `Application Status Update\n\nHello ${applicantName},\n\nThank you for submitting your application. After review, we are unable to approve it at this time.\n\nReason: ${rejectionReason}\n\nYou can submit a new application at: ${reapplyUrl}`,
  };
}

export function getRegistrationCompleteEmail(applicantName: string, applicationType: string, loginUrl: string) {
  const type = applicationType === 'DRIVER' ? 'Driver' : 'Business';

  return {
    subject: `Welcome to FastShip - Account Activated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Welcome to FastShip!</h2>
        <p>Hello ${applicantName},</p>
        <p>Your ${type.toLowerCase()} account has been successfully created and is now active.</p>
        
        <p>You can now login to your account and start using FastShip:</p>
        
        <a href="${loginUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          Login to FastShip
        </a>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Next Steps:</h4>
          <ul style="margin: 10px 0;">
            <li>Complete your profile information</li>
            <li>Set up your payment methods</li>
            <li>Review our terms and conditions</li>
            <li>Start accepting deliveries!</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          If you have any questions, please visit our help center or contact support@fastship.com
        </p>
      </div>
    `,
    text: `Welcome to FastShip!\n\nHello ${applicantName},\n\nYour ${type.toLowerCase()} account is now active!\n\nLogin here: ${loginUrl}`,
  };
}
