import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { depositUSDC } from './actions/usdcActions';
import Modal from './components/Modal'; // Import the Modal component
const DepositUSDC = ({ accountAddress }) => {
    const [amount, setAmount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [txnId, setTxnId] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(depositUSDC(amount, accountAddress, (result) => {
            setTxnId(result.payload.txId);
            setShowNotification(true);
        }));
    };
    const closeModal = () => {
        setShowNotification(false);
    };

    return (
        <div className="deposit-container">
            <h2>Deposit USDC</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="amount">Amount:</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <button type="submit">Deposit</button>
            </form>
            <Modal isOpen={showNotification} onClose={closeModal}>
                <h3>Deposit Completed</h3>
                <p>Deposit transaction completed successfully! Transaction ID: {txnId}</p>
            </Modal>
        </div>
    );
};

export default DepositUSDC;
