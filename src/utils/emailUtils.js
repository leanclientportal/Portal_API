const EmailTemplate = require('../models/EmailTemplate');
const { sendEmail } = require('../services/emailService');
const config = require('../config');

const sendInvitationEmail = async (tenantId, name, email, invitationToken) => {
    const invitationLink = `${config.FrontEnd_Base_Url}/verify-invitation?token=${invitationToken}`;

    const emailTemplate = await EmailTemplate.findOne({ tenantId, templateId: config.Invitation_Email_Temaplate_Id, isActive: true });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
      subject = emailTemplate.subject;
      html = emailTemplate.body
        .replace(/{{name}}/g, name)
        .replace(/{{link}}/g, invitationLink);
      text = html.replace(/<[^>]*>?/gm, '');
    } else {
      console.warn(`Warning: 'user_invitation' email template not found for tenant ${tenantId}. Using default email content.`);
      subject = 'You have been invited to the Lean Client Portal';
      text = `Hello ${name},\n\nYou have been invited to the Lean Client Portal. Please click the following link to set up your account:\n\n${invitationLink}`;
      html = `<p>Hello ${name},</p><p>You have been invited to the Lean Client Portal. Please click the button below to set up your account:</p><a href="${invitationLink}">Set Up Account</a>`;
    }

    try {
      await sendEmail(email, subject, text, html);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw new Error('Failed to send invitation email.');
    }
};

module.exports = { sendInvitationEmail };
