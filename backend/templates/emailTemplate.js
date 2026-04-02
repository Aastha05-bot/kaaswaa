function getEmailTemplate(otp) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #ffebf0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(255, 102, 153, 0.1); }
    .header { background-color: #ffffff; padding: 40px 20px 20px; text-align: center; color: #ff3377; border-bottom: 2px solid #fff0f5; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px; }
    .header p { margin: 10px 0 0; font-size: 14px; font-weight: 500; color: #ff99bb; letter-spacing: 1px; }
    .content { padding: 40px 30px; text-align: center; color: #333333; }
    .content p { font-size: 16px; line-height: 1.6; margin: 0 0 20px; color: #555555; }
    .otp-box { background-color: #ffffff; border: 2px dashed #ff6699; padding: 25px; margin: 30px auto; max-width: 300px; border-radius: 8px; }
    .otp-code { font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #ff3377; margin: 0; }
    .footer { background-color: #ffffff; padding: 25px; text-align: center; font-size: 13px; color: #888888; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kaa Swaa</h1>
      <p>HANDCRAFTED WITH LOVE</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for choosing Kaa Swaa! Please use the verification code below to complete your registration or login process.</p>
      
      <div class="otp-box">
        <p class="otp-code">${otp}</p>
      </div>
      
      <p>This code will expire securely in <strong>10 minutes</strong>.</p>
      <p style="font-size: 14px; color: #888;">If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Kaa Swaa. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = getEmailTemplate;
