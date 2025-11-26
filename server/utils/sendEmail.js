// Load environment varibles from .env file
require('dotenv').config();
const https = require('https');

// Async function to send email using Brevo API
// Supports template, HTML, or plain text emails
const sendEmail = async ({ to, subject, htmlContent, textContent, templateId, params = {} }) => {
  return new Promise((resolve, reject) => {
    try {
      const emailData = {
        sender: {
          name: 'Navigate La Salle',          // Display name for sender
          email: 'navigatelasalle@gmail.com' // Sender email
        },
        to: [{ email: to, name: params.FIRSTNAME || '' }] // Recepient details
      };

      if (subject) {
        emailData.subject = subject;
      }

      if (templateId) {
        emailData.templateId = parseInt(templateId);
        emailData.params = params;
      } else if (htmlContent) {
        emailData.htmlContent = htmlContent;
        if (!subject) {
          throw new Error('Subject is required when using htmlContent');
        }
      } else if (textContent) {
        emailData.textContent = textContent;
        if (!subject) {
          throw new Error('Subject is required when using textContent');
        }
      } else {
        throw new Error('Either templateId, htmlContent, or textContent is required');
      }

      const postData = JSON.stringify(emailData);

      console.log('Email data being sent:', postData);

      // Request for Brevo API
      const options = {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        // Response completion
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('Email sent successfully:', data);
            resolve(JSON.parse(data));
          } else {
            console.error('Send email error:', data);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      // Handle network/request errors
      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });

      req.write(postData);
      req.end();

    } catch (error) {
      console.error('Send email error:', error.message);
      reject(error);
    }
  });
};

module.exports = sendEmail;