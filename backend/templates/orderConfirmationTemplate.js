function getOrderConfirmationTemplate(orderId, totalAmount) {
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
    .order-box { background-color: #fff0f5; padding: 25px; margin: 30px auto; max-width: 400px; border-radius: 8px; border: 1px solid #ffebf0; }
    .order-id { font-size: 20px; font-weight: bold; color: #ff3377; margin: 0; }
    .total-amount { font-size: 24px; font-weight: bold; color: #333333; margin: 10px 0 0; }
    .footer { background-color: #ffffff; padding: 25px; text-align: center; font-size: 13px; color: #888888; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kaa Swaa</h1>
      <p>ORDER CONFIRMED</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for your order! We're excited to let you know that your order has been successfully placed and is now being processed.</p>
      
      <div class="order-box">
        <p style="margin: 0; font-size: 14px; color: #ff99bb; text-transform: uppercase;">Order Number</p>
        <p class="order-id">#${orderId}</p>
        <p style="margin: 20px 0 0; font-size: 14px; color: #ff99bb; text-transform: uppercase;">Total Amount</p>
        <p class="total-amount">Rs. ${totalAmount}</p>
      </div>
      
      <p>We will notify you as soon as your order status changes. You can track your order in your profile.</p>
      <p style="font-size: 14px; color: #888;">Thank you for supporting Kaa Swaa!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Kaa Swaa. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = getOrderConfirmationTemplate;
