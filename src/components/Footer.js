import React from 'react';
//import '../css/Footer.css';
import '../css/App.css'
const Footer = () => {
    return (
        <div className="footer-container">
            <div className="footer-top">
                <img src="/images/logo.png" alt="Logo" className="footer-logo" />
                <div className="social-links">
                    <a href="/" className="social-icon">
                        <i className="fab fa-twitter"></i>
                    </a>
                    <a href="/" className="social-icon">
                        <i className="fab fa-telegram"></i>
                    </a>
                    <a href="/" className="social-icon">
                        <i className="fab fa-medium"></i>
                    </a>
                    <a href="/" className="social-icon">
                        <i className="fab fa-github"></i>
                    </a>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="footer-links">
                    <a href="/" className="footer-link">
                        Home
                    </a>
                    <a href="/" className="footer-link">
                        Borrow
                    </a>
                    <a href="/" className="footer-link">
                        Lend
                    </a>
                    <a href="/" className="footer-link">
                        FAQ
                    </a>
                </div>
                <div className="disclaimer">
                    All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Footer;
