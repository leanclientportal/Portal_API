const EmailTemplateType = Object.freeze({
    REGISTRATION: {
        code: 101,
        displayName: 'Registration'
    },
    LOGIN_OTP: {
        code: 102,
        displayName: 'Login OTP'
    },
    INVITATION: {
        code: 103,
        displayName: 'Invitation'
    },
    NEW_PROJECT: {
        code: 104,
        displayName: 'New Project'
    },
    PROJECT_STATUS_CHANGE: {
        code: 105,
        displayName: 'Project Status Change'
    },
    NEW_TASK: {
        code: 106,
        displayName: 'New Task'
    },
    TASK_UPDATE: {
        code: 107,
        displayName: 'Task Update'
    },
    DOCUMENT_UPLOAD: {
        code: 108,
        displayName: 'Document Upload'
    },
    INVOICE_UPLOAD: {
        code: 109,
        displayName: 'Invoice Upload'
    },
    INVOICE_PAID: {
        code: 110,
        displayName: 'Invoice Paid'
    },
});

module.exports = EmailTemplateType;
