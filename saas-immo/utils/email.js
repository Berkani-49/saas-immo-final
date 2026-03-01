const axios = require('axios');

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'noreply@prelvio.com';
const FROM_NAME  = process.env.BREVO_FROM_NAME  || 'ImmoFlow';

/**
 * Envoie un email transactionnel via l'API Brevo
 * @param {string} to - adresse email destinataire
 * @param {string} subject - sujet
 * @param {string} html - contenu HTML
 */
async function sendEmail(to, subject, html) {
  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY manquante - email non envoyé');
    return { success: false, error: 'BREVO_NOT_CONFIGURED' };
  }

  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html
  }, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  return { success: true };
}

module.exports = { sendEmail };
