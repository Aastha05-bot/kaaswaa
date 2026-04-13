function getOrderStatusUpdateTemplate(orderId, status) {
  let statusMessage = "Your order status has been updated.";
  const statusLower = status.toLowerCase();

  if (statusLower === "confirmed") {
    statusMessage = "Your order has been confirmed and is being prepared.";
  } else if (statusLower === "processing") {
    statusMessage = "We are now processing your order.";
  } else if (statusLower === "packed") {
    statusMessage = "Good news! Your order has been packed and is ready for shipment.";
  } else if (statusLower === "shipped") {
    statusMessage = "Your order is on its way! It has been shipped.";
  } else if (statusLower === "delivered") {
    statusMessage = "Yay! Your order has been delivered. We hope you love it!";
  }

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
    .status-badge { display: inline-block; background-color: #ff3377; color: #ffffff; padding: 8px 20px; border-radius: 50px; font-weight: bold; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px; }
    .order-info { color: #888888; font-size: 14px; margin-top: 10px; }
    .footer { background-color: #ffffff; padding: 25px; text-align: center; font-size: 13px; color: #888888; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kaa Swaa</h1>
      <p>ORDER UPDATE</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>${statusMessage}</p>
      
      <div class="status-badge">
        ${status}
      </div>
      
      <p class="order-info">Order Number: <strong>#${orderId}</strong></p>
      
      <p>You can see the full details of your order by visiting your profile on our website.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Kaa Swaa. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = getOrderStatusUpdateTemplate;
