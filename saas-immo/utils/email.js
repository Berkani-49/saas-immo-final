const Brevo = require('@getbrevo/brevo');

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@prelvio.com';
const FROM_NAME  = process.env.BREVO_FROM_NAME  || 'ImmoFlow';

/**
 * Envoie un email transactionnel via Brevo
 * @param {string} to - adresse email destinataire
 * @param {string} subject - sujet
 * @param {string} html - contenu HTML
 */
async function sendEmail(to, subject, html) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY manquante - email non envoyé');
    return { success: false, error: 'BREVO_NOT_CONFIGURED' };
  }

  const email = new Brevo.SendSmtpEmail();
  email.sender      = { name: FROM_NAME, email: FROM_EMAIL };
  email.to          = [{ email: to }];
  email.subject     = subject;
  email.htmlContent = html;

  const data = await apiInstance.sendTransacEmail(email);
  return { success: true, data };
}

module.exports = { sendEmail };
