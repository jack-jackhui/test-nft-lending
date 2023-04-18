// Dashboard.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DepositUSDC from '../DepositUSDC';
import '../css/Dashboard.css'; // Import the new CSS file
import Footer from "./Footer";
const Dashboard = ({ accountAddress }) => {
    const navigate = useNavigate();
    const isConnectedToPeraWallet = !!accountAddress;

    useEffect(() => {
        if (!isConnectedToPeraWallet) {
            navigate('/');
        }
    }, [isConnectedToPeraWallet, navigate]);

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <p>Welcome to the dashboard!</p>
            <div className="deposit-form-container">
                <DepositUSDC accountAddress={accountAddress} />
            </div>
            <Footer />
        </div>

    );
};

export default Dashboard;
