import SibApiV3Sdk from 'sib-api-v3-sdk';

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Send reset email
export const sendResetEmail = async (toEmail, toName, resetLink) => {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
    };

    sendSmtpEmail.to = [{ email: toEmail, name: toName }];
    sendSmtpEmail.templateId = 3;
    sendSmtpEmail.params = {
        FIRSTNAME: toName,
        RESET_LINK: resetLink
    };

    await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
};

// Invite email
export const sendInviteEmail = async (toEmail, inviteLink) => {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL
    };

    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.templateId = 4;
    sendSmtpEmail.params = {
        INVITE_LINK: inviteLink
    };

    await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
};