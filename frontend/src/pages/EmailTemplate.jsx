import React from 'react';
import '../Styles/EmailTemplate.css';

const EmailTemplate = () => {
  const otp = "123456";
  const currentYear = new Date().getFullYear();

  return (
    <div className="email-page-wrapper">
      <div className="email-preview-container">

        <div className="email-preview-header">
          <div className="email-header-pill"><span>Kaa Swaa</span></div>
          <h1>Verify your identity</h1>
          <p>Handcrafted with love</p>
        </div>

        <div className="email-preview-content">
          <p>Hello there,<br />Thank you for choosing <strong>Kaa Swaa</strong>! Use the code below to complete your verification.</p>

          <div className="email-otp-box">
            <div className="email-otp-label">Your one-time code</div>
            <p className="email-otp-code">{otp}</p>
            <div className="email-otp-expire">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f08fb1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Expires in 10 minutes</span>
            </div>
          </div>

          <div className="email-info-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f08fb1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>If you didn't request this code, you can safely ignore this email. Your account remains secure.</span>
          </div>
        </div>

        <div className="email-preview-footer">
          <p className="email-footer-brand">KAA SWAA</p>
          <p>&copy; {currentYear} Kaa Swaa. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};

export default EmailTemplate;