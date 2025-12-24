const EmailTemplate = require('../models/EmailTemplate');
const { sendEmail } = require('../services/emailService');
const config = require('../config');
const EmailTemplateType = require('../enums/EmailTemplateType');
const { getTokenData } = require('../services/tokenService');
const { replaceTokens } = require('./replaceTokens');

const getEmailTemplate = async (tenantId, templateId) => {
    const emailTemplate = await EmailTemplate.findOne({ tenantId, templateId, isActive: true });

    if (!emailTemplate) {
        console.warn(`Warning: Email template with templateId '${templateId}' not found for tenant ${tenantId}.`);
        return null;
    }

    return emailTemplate;
};

const sendRegistrationEmail = async (tenantId, name, email, invitationToken) => {
    const invitationLink = `${config.FrontEnd_Base_Url}/verify-invitation?token=${invitationToken}`;

    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.REGISTRATION.code);

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
        console.warn(`Warning: '${EmailTemplateType.REGISTRATION.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = 'You have been invited to the Lean Client Portal';
        text = `Hello ${name},\n\nYou have been invited to the Lean Client Portal. Please click the following link to set up your account:\n\n${invitationLink}`;
        html = `<p>Hello ${name},</p><p>You have been invited to the Lean Client Portal. Please click the button below to set up your account:</p><a href="${invitationLink}">Set Up Account</a>`;
    }

    try {
        await sendEmail(tenantId, email, subject, text, html);
    } catch (error) {
        console.error('Error sending registration email:', error);
        throw new Error('Failed to send registration email.');
    }
};

const sendInvitationEmail = async (tenantId, name, email, invitationToken) => {
    const invitationLink = `${config.FrontEnd_Base_Url}/verify-invitation?token=${invitationToken}`;

    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.INVITATION.code);

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
        console.warn(`Warning: '${EmailTemplateType.INVITATION.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = 'You have been invited to the Lean Client Portal';
        text = `Hello ${name},\n\nYou have been invited to the Lean Client Portal. Please click the following link to set up your account:\n\n${invitationLink}`;
        html = `<p>Hello ${name},</p><p>You have been invited to the Lean Client Portal. Please click the button below to set up your account:</p><a href="${invitationLink}">Set Up Account</a>`;
    }

    try {
        await sendEmail(tenantId, email, subject, text, html);
    } catch (error) {
        console.error('Error sending invitation email:', error);
        throw new Error('Failed to send invitation email.');
    }
};

const sendLoginOtpEmail = async (tenantId, recipientEmail, otpDetails) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.LOGIN_OTP.code);

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = emailTemplate.subject;
        html = emailTemplate.body.replace(/{{otp}}/g, otpDetails.otp);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.LOGIN_OTP.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = 'Your One-Time Password (OTP)';
        html = `<p>Your OTP is: <strong>${otpDetails.otp}</strong></p>`;
        text = `Your OTP is: ${otpDetails.otp}`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending login OTP email:', error);
        throw new Error('Failed to send login OTP email.');
    }
};

const sendNewProjectEmail = async (tenant, client, project) => {
    const emailTemplate = await getEmailTemplate(tenant._id, EmailTemplateType.NEW_PROJECT.code);
    const tokenData = await getTokenData({ tenantId: tenant._id, clientId: client._id, projectId: project._id });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.NEW_PROJECT.code}' email template not found for tenant ${tenant._id}. Using default email content.`);
        subject = `New Project Created: ${tokenData.project.name}`;
        html = `<p>Hello,</p><p>A new project has been created:</p><p><b>Project Name:</b> ${tokenData.project.name}</p><p><b>Client:</b> ${tokenData.client.name}</p>`;
        text = `Hello,\n\nA new project has been created:\n\nProject Name: ${tokenData.project.name}\nClient: ${tokenData.client.name}`;
    }

    try {
        await sendEmail(tenant._id, client.email, subject, text, html);
    } catch (error) {
        console.error('Error sending new project email:', error);
        throw new Error('Failed to send new project email.');
    }
};

const sendProjectStatusChangeEmail = async (tenantId, recipientEmail, projectDetails) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.PROJECT_STATUS_CHANGE.code);

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = emailTemplate.subject.replace(/{{projectName}}/g, projectDetails.name);
        html = emailTemplate.body
            .replace(/{{projectName}}/g, projectDetails.name)
            .replace(/{{status}}/g, projectDetails.status);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.PROJECT_STATUS_CHANGE.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `Project Status Updated: ${projectDetails.name}`;
        html = `<p>The status of project <strong>${projectDetails.name}</strong> has been updated to <strong>${projectDetails.status}</strong>.</p>`;
        text = `The status of project ${projectDetails.name} has been updated to ${projectDetails.status}.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending project status change email:', error);
        throw new Error('Failed to send project status change email.');
    }
};

const sendNewTaskEmail = async (tenantId, recipientEmail, taskDetails) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.NEW_TASK.code);

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = emailTemplate.subject.replace(/{{taskName}}/g, taskDetails.name);
        html = emailTemplate.body
            .replace(/{{taskName}}/g, taskDetails.name)
            .replace(/{{projectName}}/g, taskDetails.projectName);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.NEW_TASK.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `New Task Assigned: ${taskDetails.name}`;
        html = `<p>A new task, <strong>${taskDetails.name}</strong>, has been assigned to you in the project <strong>${taskDetails.projectName}</strong>.</p>`;
        text = `A new task, ${taskDetails.name}, has been assigned to you in the project ${taskDetails.projectName}.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending new task email:', error);
        throw new Error('Failed to send new task email.');
    }
};

const sendTaskUpdateEmail = async (tenantId, recipientEmail, taskDetails) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.TASK_UPDATE.code);

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = emailTemplate.subject.replace(/{{taskName}}/g, taskDetails.name);
        html = emailTemplate.body
            .replace(/{{taskName}}/g, taskDetails.name)
            .replace(/{{status}}/g, taskDetails.status);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.TASK_UPDATE.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `Task Status Updated: ${taskDetails.name}`;
        html = `<p>The status of task <strong>${taskDetails.name}</strong> has been updated to <strong>${taskDetails.status}</strong>.</p>`;
        text = `The status of task ${taskDetails.name} has been updated to ${taskDetails.status}.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending task update email:', error);
        throw new Error('Failed to send task update email.');
    }
};

const sendDocumentUploadEmail = async (tenantId, recipientEmail, documentDetails) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.DOCUMENT_UPLOAD.code);

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = emailTemplate.subject.replace(/{{documentName}}/g, documentDetails.name);
        html = emailTemplate.body
            .replace(/{{documentName}}/g, documentDetails.name)
            .replace(/{{projectName}}/g, documentDetails.projectName);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.DOCUMENT_UPLOAD.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `New Document Uploaded: ${documentDetails.name}`;
        html = `<p>A new document, <strong>${documentDetails.name}</strong>, has been uploaded to the project <strong>${documentDetails.projectName}</strong>.</p>`;
        text = `A new document, ${documentDetails.name}, has been uploaded to the project ${documentDetails.projectName}.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending document upload email:', error);
        throw new Error('Failed to send document upload email.');
    }
};

const sendInvoiceUploadEmail = async (tenantId, recipientEmail, invoiceDetails, attachments) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.INVOICE_UPLOAD.code);

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = emailTemplate.subject.replace(/{{invoiceNumber}}/g, invoiceDetails.number);
        html = emailTemplate.body
            .replace(/{{invoiceNumber}}/g, invoiceDetails.number)
            .replace(/{{amount}}/g, invoiceDetails.amount);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.INVOICE_UPLOAD.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `New Invoice: ${invoiceDetails.number}`;
        html = `<p>A new invoice (<strong>${invoiceDetails.number}</strong>) for the amount of <strong>${invoiceDetails.amount}</strong> is available.</p>`;
        text = `A new invoice (${invoiceDetails.number}) for the amount of ${invoiceDetails.amount} is available.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html, attachments);
    } catch (error) {
        console.error('Error sending invoice upload email:', error);
        throw new Error('Failed to send invoice upload email.');
    }
};

const sendInvoicePaidEmail = async (tenantId, recipientEmail, invoiceDetails, attachments) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.INVOICE_PAID.code);

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = emailTemplate.subject.replace(/{{invoiceNumber}}/g, invoiceDetails.number);
        html = emailTemplate.body
            .replace(/{{invoiceNumber}}/g, invoiceDetails.number)
            .replace(/{{amount}}/g, invoiceDetails.amount);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.INVOICE_PAID.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `Invoice Paid: ${invoiceDetails.number}`;
        html = `<p>Thank you for your payment. Invoice <strong>${invoiceDetails.number}</strong> for the amount of <strong>${invoiceDetails.amount}</strong> has been paid.</p>`;
        text = `Thank you for your payment. Invoice ${invoiceDetails.number} for the amount of ${invoiceDetails.amount} has been paid.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html, attachments);
    } catch (error) {
        console.error('Error sending invoice paid email:', error);
        throw new Error('Failed to send invoice paid email.');
    }
};

module.exports = {
    getEmailTemplate,
    sendRegistrationEmail,
    sendInvitationEmail,
    sendLoginOtpEmail,
    sendNewProjectEmail,
    sendProjectStatusChangeEmail,
    sendNewTaskEmail,
    sendTaskUpdateEmail,
    sendDocumentUploadEmail,
    sendInvoiceUploadEmail,
    sendInvoicePaidEmail
};
