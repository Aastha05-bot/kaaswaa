const nodemailer = require("nodemailer");
const getEmailTemplate = require("../templates/emailTemplate");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(email, otp, type = 'registration') {
  const htmlTemplate = getEmailTemplate(otp, type);

  await transporter.sendMail({
    from: `"Kaa Swaa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: type === 'password_reset' ? "Kaa Swaa Password Reset Code" : "Your Kaa Swaa Verification Code",
    html: htmlTemplate,
  });
}

module.exports = sendOTP;
