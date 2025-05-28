import { ActivityResult } from '../shared/types';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  template?: string;
}

export interface EmailResult {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string;
  deliveryStatus?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<ActivityResult<EmailResult>> {
  try {
    // This is a mock implementation for demonstration
    // In a real implementation, you would integrate with actual email services
    // like SendGrid, AWS SES, Nodemailer, etc.
    
    console.log(`Preparing to send email to ${params.to}: ${params.subject}`);
    
    // Simulate some validation
    if (!params.to.includes('@')) {
      return {
        success: false,
        error: 'Invalid recipient email address'
      };
    }

    if (!params.subject.trim()) {
      return {
        success: false,
        error: 'Email subject cannot be empty'
      };
    }

    if (!params.body.trim()) {
      return {
        success: false,
        error: 'Email body cannot be empty'
      };
    }

    // Generate mock email data
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const mockEmail: EmailResult = {
      id: emailId,
      to: params.to,
      subject: params.subject,
      body: params.body,
      status: 'queued',
      sentAt: now.toISOString(),
      deliveryStatus: 'pending'
    };

    // In a real implementation, this would make actual API calls to email services
    // Example with SendGrid:
    // const msg = {
    //   to: params.to,
    //   from: 'noreply@example.com',
    //   subject: params.subject,
    //   text: params.body,
    //   html: params.template ? renderTemplate(params.template, { body: params.body }) : params.body,
    // };
    // await sgMail.send(msg);

    // Simulate processing delay
    setTimeout(() => {
      console.log(`Email ${emailId} delivered to ${params.to}`);
    }, 1000);

    return {
      success: true,
      data: mockEmail,
      requiresApproval: true
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 