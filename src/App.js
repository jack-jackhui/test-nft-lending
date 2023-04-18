import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Navigate, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store"; // Import the Redux store
import { PeraWalletConnect } from "@perawallet/connect";
import Header from "./components/Header";
import HeroSection from "./components/Hero";
import Footer from "./components/Footer";
import "./css/App.css";
import Dashboard from './components/Dashboard';
import { useDispatch } from 'react-redux';
import { optInToUSDC } from './actions/optInToUSDC';
export const peraWallet = new PeraWalletConnect({chainId: 416002});

function App() {
    return (
        <Provider store={store}>
            <InnerApp />
        </Provider>
    );
}
function InnerApp() {
    const [accountAddress, setAccountAddress] = useState(null);
    const isConnectedToPeraWallet = !!accountAddress;
    const dispatch = useDispatch();

    useEffect(() => {
        peraWallet.reconnectSession().then((accounts) => {
            peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);

            if (accounts.length) {
                setAccountAddress(accounts[0]);
                // Call the opt-in action here
                dispatch(optInToUSDC(accounts[0]));
            }
        });
    }, []);

    return (
            <Router>
                <Routes>
                    <Route path="/" element={isConnectedToPeraWallet ? <Navigate to="/dashboard" /> : <LandingPage handleConnectWalletClick={handleConnectWalletClick} />} />
                    <Route path="/dashboard" element={<Dashboard accountAddress={accountAddress} />} />
                </Routes>
                <Header accountAddress={accountAddress} handleDisconnectWalletClick={handleDisconnectWalletClick} />
            </Router>
    );

    function handleConnectWalletClick() {
        try {
            peraWallet
                .connect()
                .then((newAccounts) => {
                    peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
                    setAccountAddress(newAccounts[0]);
                    // Call the opt-in action here
                    dispatch(optInToUSDC(newAccounts[0]));
                })
                .catch((error) => {
                    if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
                        console.error("Error connecting to Pera Wallet:", error);
                    }
                });
        } catch (error) {
            console.error("Error connecting to Pera Wallet:", error);
        }
    }

    function handleDisconnectWalletClick() {
        peraWallet.disconnect();
        setAccountAddress(null);
    }
}

function LandingPage({ handleConnectWalletClick }) {
    return (
        <div className="app-container">
            <Header />
            <HeroSection />
            <button className="connect-btn" onClick={handleConnectWalletClick}>
                Connect to Pera Wallet
            </button>
            <Footer />
        </div>
    );
}


export default App;
