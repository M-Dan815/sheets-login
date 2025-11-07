const nodemailer = require("nodemailer");
require("dotenv").config();

// 🔧 Create a reusable transporter using your PrivateEmail SMTP
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: false, // true for 465, false for 587
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

/**
 * Sends a stylized email notifying that someone requested a demo.
 * @param {string} requesterEmail - The email of the person requesting the demo.
 */
exports.sendDemoRequestEmail = async (requesterEmail) => {
	const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 20px;">
        <h2 style="color: #0052cc;">New Demo Request</h2>
        <p style="font-size: 16px;">The following user has requested a demo:</p>
        <p style="font-size: 18px; font-weight: bold; color: #333;">${requesterEmail}</p>
        <hr style="margin: 20px 0;">
        <p style="color: #777; font-size: 14px;">This notification was sent automatically from your website.</p>
      </div>
    </div>
  `;

	const mailOptions = {
		from: process.env.SMTP_USER,
		to: process.env.SMTP_USER, // You can change this to a different inbox if needed
		subject: "Demo Request Notification",
		html,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`✅ Demo request email sent for ${requesterEmail}`);
	} catch (err) {
		console.error("❌ Failed to send demo request email:", err.message);
	}
};

/**
 * Sends a stylized email using user-provided details.
 * @param {string} senderEmail - The sender's email address.
 * @param {string} senderName - The sender's name.
 * @param {string} subject - The email subject.
 * @param {string} message - The email message body.
 */
exports.sendCustomEmail = async (senderEmail, senderName, subject, message) => {
	const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f3f3f3; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 20px;">
        <h2 style="color: #333;">New Message from ${senderName}</h2>
        <p style="font-size: 16px;"><strong>Sender:</strong> ${senderName} (${senderEmail})</p>
        <p style="font-size: 16px;"><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top: 20px; background: #f9f9f9; border-left: 4px solid #0052cc; padding: 15px;">
          <p style="font-size: 15px; line-height: 1.6; color: #333;">${message}</p>
        </div>
        <hr style="margin: 20px 0;">
        <p style="color: #777; font-size: 14px;">This message was sent via your website’s contact form.</p>
      </div>
    </div>
  `;

	const mailOptions = {
		from: process.env.SMTP_USER,
		to: process.env.SMTP_USER, // Send to your support inbox
		subject: `📩 Message from ${senderName}: ${subject}`,
		html,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(
			`✅ Custom email from ${senderName} <${senderEmail}> sent successfully.`
		);
	} catch (err) {
		console.error("❌ Failed to send custom email:", err.message);
	}
};
