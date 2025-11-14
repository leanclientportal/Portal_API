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
  }
};