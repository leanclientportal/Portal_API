module.exports = {
  // Twilio configuration
  TWILIO_ACCOUNT_SID: 'your-account-sid',
  TWILIO_AUTH_TOKEN: 'your-auth-token',
  TWILIO_PHONE_NUMBER: 'your-twilio-phone-number',

  // Gmail configuration
  GMAIL_USER: 'leanclientportal@gmail.com',
  GMAIL_PASS: 'lkbwnbxpegoubjko',

  // JWT configuration
  JWT_SECRET: 'client-portal-secret',
  JWT_EXPIRES_IN: '1d',

  // Email transport configuration
  email: {
    from: 'leanclientportal@gmail.com',
    transport: {
      service: 'gmail',
      auth: {
        user: 'leanclientportal@gmail.com',
        pass: 'lkbwnbxpegoubjko'
      }
    }
  },

  Client: 'client',
  Tenant: 'tenant',
  Admin: 'admin',
  AdminId: '693174809b4006d3b4b06fcd',


  Registation_OTP_Email_Temaplate_Id: 101,
  Login_OTP_Email_Temaplate_Id: 102,
  Invitation_Email_Temaplate_Id: 103,
  Project_Email_Temaplate_Id: 104,
  Project_Email_Temaplate_Id: 105,
  Task_Email_Temaplate_Id: 106,
  Task_Email_Temaplate_Id: 107,
  Document_Email_Temaplate_Id: 108,
  Invoice_Email_Temaplate_Id: 109,
  Invoice_Email_Temaplate_Id: 110,

  FrontEnd_Base_Url: 'https://9000-firebase-clientportal-1762332719156.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev',

  // Plan_Keys
  Free_Plan: 'Free',
  Starter_Plan: 'Starter',
  Growth_Plan: 'Growth',
  Pro_Plan: 'Pro',

  Project_count: 'project_count',
  Client_count: 'client_count',
  Storage_size: 'storage_size',
  Email_notifications: 'email_notifications',
  Smtp_sender: 'smtp_sender',
  File_upload: 'file_upload',
  Invoice_sharing: 'invoice_sharing',
  Branding: 'branding',
  Task_list: 'task_list',
  Team_members: 'team_members',
  Support: 'support'
};