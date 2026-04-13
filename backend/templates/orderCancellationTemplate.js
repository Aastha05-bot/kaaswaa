function getOrderCancellationTemplate(orderId) {
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
    .cancel-icon { font-size: 50px; color: #ff3377; margin-bottom: 20px; }
    .order-info { color: #888888; font-size: 14px; margin-top: 20px; }
    .footer { background-color: #ffffff; padding: 25px; text-align: center; font-size: 13px; color: #888888; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kaa Swaa</h1>
      <p>ORDER CANCELLED</p>
    </div>
    <div class="content">
      <div class="cancel-icon">✕</div>
      <p>Hello,</p>
      <p>Your order <strong>#${orderId}</strong> has been successfully cancelled as per your request.</p>
      <p>If you have already made a payment, it will be processed for a refund according to our policy. Please contact our support if you have any questions.</p>
      
      <p class="order-info">We're sorry to see you cancel, but we hope to serve you again soon!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Kaa Swaa. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = getOrderCancellationTemplate;
