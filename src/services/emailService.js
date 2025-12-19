const nodemailer = require('nodemailer');
const config = require('../config');
const Tenant = require('../models/Tenant');

const sendEmail = async (tenantId, to, subject, text, html, attachments) => {
  let transporterConfig = config.email.transport;
  let fromAddress = config.email.from;

  if (tenantId) {
    try {
      const tenant = await Tenant.findById(tenantId);
      if (tenant && tenant.smtpSetting && tenant.smtpSetting.user && tenant.smtpSetting.pass) {
        // If the tenant has SMTP settings, use them
        // We assume 'service' is provided as per the model. 
        // If 'service' is missing, nodemailer might need host/port which are not in the current model.
        if (tenant.smtpSetting.service) {
             transporterConfig = {
                service: tenant.smtpSetting.service,
                auth: {
                    user: tenant.smtpSetting.user,
                    pass: tenant.smtpSetting.pass
                }
            };
        }
       
        if (tenant.smtpSetting.from) {
          fromAddress = tenant.smtpSetting.from;
        }
      }
    } catch (error) {
      console.error('Error fetching tenant SMTP settings, falling back to default:', error);
    }
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  const mailOptions = {
    from: fromAddress,
    to: to,
    subject: subject,
    text: text,
    html: html,
    attachments: attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email: ', error);
    // Re-throw the error to be caught by the calling function
    throw new Error('Error sending email');
  }
};

module.exports = { sendEmail };