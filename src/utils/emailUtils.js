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
        emailTemplate = await EmailTemplate.findOne({ tenantId: null, templateId, isActive: true });
    }

    return emailTemplate;
};

const sendRegistrationEmail = async (tenantId, name, email, invitationToken) => {
    const invitationLink = `${config.FrontEnd_Base_Url}/verify-invitation?token=${invitationToken}`;
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.REGISTRATION.code);
    const tokenData = await getTokenData({ tenantId, clientId });
    tokenData.invitation = {
        link: invitationLink,
    };

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
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

const sendInvitationEmail = async (tenantId, clientId, email, invitationToken) => {
    const invitationLink = `${config.FrontEnd_Base_Url}/verify-invitation?token=${invitationToken}`;
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.INVITATION.code);
    const tokenData = await getTokenData({ tenantId, clientId });
    tokenData.invitation = {
        link: invitationLink,
    };

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.INVITATION.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = 'You have been invited to the Lean Client Portal';
        text = `Hello ,\n\nYou have been invited to the Lean Client Portal. Please click the following link to set up your account:\n\n${invitationLink}`;
        html = `<p>Hello ,</p><p>You have been invited to the Lean Client Portal. Please click the button below to set up your account:</p><a href="${invitationLink}">Set Up Account</a>`;
    }

    try {
        await sendEmail(tenantId, email, subject, text, html);
    } catch (error) {
        console.error('Error sending invitation email:', error);
        throw new Error('Failed to send invitation email.');
    }
};

const sendLoginOtpEmail = async (tenantId, recipientEmail, otp) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.LOGIN_OTP.code);
    const tokenData = await getTokenData({ tenantId });
    tokenData.system = { otp: otp };

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.LOGIN_OTP.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = 'Your One-Time Password (OTP)';
        html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
        text = `Your OTP is: ${otp}`;
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

const sendProjectStatusChangeEmail = async (tenantId, clientId, recipientEmail, projectId) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.PROJECT_STATUS_CHANGE.code);
    const tokenData = await getTokenData({ tenantId, clientId, projectId });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html;
        // text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.PROJECT_STATUS_CHANGE.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `Project Status Updated: ${tokenData.project.name}`;
        html = `<p>The status of project <strong>${tokenData.project.name}</strong> has been updated to <strong>${tokenData.project.status}</strong>.</p>`;
        text = `The status of project ${tokenData.project.name} has been updated to ${tokenData.project.status}.`;
    }
    console.warn(`Warning: '${html}' texttexttext ${text}.`);

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending project status change email:', error);
        throw new Error('Failed to send project status change email.');
    }
};

const sendNewTaskEmail = async (tenantId, clientId, projectId, recipientEmail, taskId) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.NEW_TASK.code);
    const tokenData = await getTokenData({ tenantId, clientId, projectId, taskId });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.NEW_TASK.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `New Task Assigned: ${tokenData.task.name}`;
        html = `<p>A new task, <strong>${tokenData.task.name}</strong>, has been assigned to you in the project <strong>${tokenData.project.name}</strong>.</p>`;
        text = `A new task, ${tokenData.task.name}, has been assigned to you in the project ${tokenData.project.name}.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending new task email:', error);
        throw new Error('Failed to send new task email.');
    }
};

const sendTaskUpdateEmail = async (tenantId, clientId, projectId, recipientEmail, taskId) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.TASK_UPDATE.code);
    const tokenData = await getTokenData({ tenantId, clientId, projectId, taskId });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.TASK_UPDATE.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `Task Status Updated: ${tokenData.task.name}`;
        html = `<p>The status of task <strong>${tokenData.task.name}</strong> has been updated to <strong>${tokenData.task.status}</strong>.</p>`;
        text = `The status of task ${tokenData.task.name} has been updated to ${tokenData.task.status}.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending task update email:', error);
        throw new Error('Failed to send task update email.');
    }
};

const sendDocumentUploadEmail = async (tenantId, clientId, projectId, recipientEmail, documentId) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.DOCUMENT_UPLOAD.code);
    const tokenData = await getTokenData({ tenantId, clientId, projectId, documentId });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.DOCUMENT_UPLOAD.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `New Document Uploaded: ${tokenData.document.name}`;
        html = `<p>A new document, <strong>${tokenData.document.name}</strong>, has been uploaded to the project <strong>${tokenData.project.name}</strong>.</p>`;
        text = `A new document, ${tokenData.document.name}, has been uploaded to the project ${tokenData.project.name}.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html);
    } catch (error) {
        console.error('Error sending document upload email:', error);
        throw new Error('Failed to send document upload email.');
    }
};

const sendInvoiceUploadEmail = async (tenantId, clientId, projectId, recipientEmail, invoiceId, attachments) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.INVOICE_UPLOAD.code);
    const tokenData = await getTokenData({ tenantId, clientId, projectId, invoiceId });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.INVOICE_UPLOAD.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `New Invoice: ${tokenData.invoice.title}`;
        html = `<p>A new invoice (<strong>${tokenData.invoice.title}</strong>) for the amount of <strong>${tokenData.invoice.amount}</strong> is available.</p>`;
        text = `A new invoice (${tokenData.invoice.title}) for the amount of ${tokenData.invoice.amount} is available.`;
    }

    try {
        await sendEmail(tenantId, recipientEmail, subject, text, html, attachments);
    } catch (error) {
        console.error('Error sending invoice upload email:', error);
        throw new Error('Failed to send invoice upload email.');
    }
};

const sendInvoicePaidEmail = async (tenantId, clientId, projectId, recipientEmail, invoiceId, attachments) => {
    const emailTemplate = await getEmailTemplate(tenantId, EmailTemplateType.INVOICE_PAID.code);
    const tokenData = await getTokenData({ tenantId, clientId, projectId, invoiceId });

    let subject;
    let html;
    let text;

    if (emailTemplate) {
        subject = replaceTokens(emailTemplate.subject, tokenData);
        html = replaceTokens(emailTemplate.body, tokenData);
        text = html.replace(/<[^>]*>?/gm, '');
    } else {
        console.warn(`Warning: '${EmailTemplateType.INVOICE_PAID.code}' email template not found for tenant ${tenantId}. Using default email content.`);
        subject = `Invoice Paid: ${tokenData.invoice.title}`;
        html = `<p>Thank you for your payment. Invoice <strong>${tokenData.invoice.title}</strong> for the amount of <strong>${tokenData.invoice.amount}</strong> has been paid.</p>`;
        text = `Thank you for your payment. Invoice ${tokenData.invoice.title} for the amount of ${tokenData.invoice.amount} has been paid.`;
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
