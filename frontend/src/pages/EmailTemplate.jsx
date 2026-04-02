import React from 'react';
import '../Styles/EmailTemplate.css';

const EmailTemplate = () => {
  const otp = "123456";
  const currentYear = new Date().getFullYear();

  return (
    <div className="email-page-wrapper">
      <div className="email-preview-container">
        <div className="email-preview-header">
          <h1>Kaa Swaa</h1>
          <p>HANDCRAFTED WITH LOVE</p>
        </div>
        <div className="email-preview-content">
          <p>Hello,</p>
          <p>Thank you for choosing Kaa Swaa! Please use the verification code below to complete your registration or login process.</p>
          
          <div className="email-otp-box">
            <p className="email-otp-code">{otp}</p>
          </div>
          
          <p>This code will expire securely in <strong>10 minutes</strong>.</p>
          <p style={{ fontSize: '14px', color: '#888' }}>If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div className="email-preview-footer">
          <p>&copy; {currentYear} Kaa Swaa. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplate;
