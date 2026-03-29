const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOTP(email, otp) {
  await transporter.sendMail({
    from: `"Kaa Swaa" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your verification code",
    html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Expires in 10 minutes.</p>`,
  });
}

module.exports = sendOTP;