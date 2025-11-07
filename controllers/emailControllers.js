const {sendDemoRequestEmail, sendCustomEmail} = require("../utils/sendEmail");

exports.requestDemo = async (req, res) => {
	try {
		const {email} = req.body;
		if (!email)
			return res
				.status(400)
				.json({success: false, message: "Email is required."});

		await sendDemoRequestEmail(email);
		res.json({success: true, message: `Demo request received from ${email}.`});
	} catch (err) {
		console.error("Error in requestDemo:", err);
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

		await sendCustomEmail(email, name, subject, message);
		res.json({success: true, message: "Feedback sent successfully."});
	} catch (err) {
		console.error("Error in giveFeedback:", err);
		res.status(500).json({success: false, message: "Failed to send feedback."});
	}
};
