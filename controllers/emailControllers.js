const sgMail = require("@sendgrid/mail");

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Support email sends and receives all emails
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@yourdomain.com";

exports.requestDemo = async (req, res) => {
	try {
		const {email} = req.body;
		if (!email)
			return res
				.status(400)
				.json({success: false, message: "Email is required."});

		// Send confirmation to the user
		const userMsg = {
			to: email,
			from: SUPPORT_EMAIL,
			subject: "Demo Request Received",
			text: "Thank you for your interest! We have received your demo request and will be in touch soon.",
			html: `
                <h2>Thank You for Your Interest!</h2>
                <p>We have received your demo request and will be in touch soon.</p>
            `,
		};

		// Notify support about the demo request
		const supportMsg = {
			to: SUPPORT_EMAIL,
			from: SUPPORT_EMAIL,
			subject: "New Demo Request",
			text: `A new demo request has been received from: ${email}`,
			html: `
                <h2>New Demo Request</h2>
                <p><strong>Email:</strong> ${email}</p>
            `,
		};

		await Promise.all([sgMail.send(userMsg), sgMail.send(supportMsg)]);

		res.json({success: true, message: `Demo request received from ${email}.`});
	} catch (err) {
		console.error("Error in requestDemo:", err.response?.body || err);
		res
			.status(500)
			.json({success: false, message: "Failed to send demo request."});
	}
};

exports.giveFeedback = async (req, res) => {
	try {
		const {email, name, subject, message} = req.body;
		if (!email || !name || !subject || !message)
			return res
				.status(400)
				.json({success: false, message: "All fields are required."});

		const msg = {
			to: SUPPORT_EMAIL,
			from: SUPPORT_EMAIL,
			replyTo: email,
			subject: `Feedback: ${subject}`,
			text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
			html: `
                <h2>New Feedback Received</h2>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, "<br>")}</p>
            `,
		};

		await sgMail.send(msg);

		res.json({success: true, message: "Feedback sent successfully."});
	} catch (err) {
		console.error("Error in giveFeedback:", err.response?.body || err);
		res.status(500).json({success: false, message: "Failed to send feedback."});
	}
};
