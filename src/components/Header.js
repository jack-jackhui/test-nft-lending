import React from 'react';
import '../css/Header.css';

const Header = ({ accountAddress, handleDisconnectWalletClick }) => {
    const isConnected = !!accountAddress;

    function renderConnectionStatus() {
        if (isConnected) {
            const truncatedAddress = `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`;

            return (
                <div className="connection-status">
                    <span>Connected: {truncatedAddress}</span>
                    <button className="disconnect-btn" onClick={handleDisconnectWalletClick}>
                        Disconnect
                    </button>
                </div>
            );
        } else {
            return <span>Not connected</span>;
        }
    }

    return (
        <header className="header">
            <nav>
                <ul>
                    <li><a href="#">Home</a></li>
                    <li><a href="#">Deposit</a></li>
                    <li><a href="#">Borrowing</a></li>
                    <li><a href="#">FAQ</a></li>
                </ul>
            </nav>
            <h1>Usdc Deposit App</h1>
            {renderConnectionStatus()}
        </header>
    );
};

export default Header;
