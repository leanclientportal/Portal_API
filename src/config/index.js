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
};