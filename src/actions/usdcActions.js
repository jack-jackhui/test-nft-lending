import { peraWallet } from '../App';
import algosdk from 'algosdk';

export const DEPOSIT_USDC = 'DEPOSIT_USDC';
export const depositUSDC = (amount, accountAddress, callback) => async (dispatch) => {
    try {
        const senderAddress = accountAddress;
        const appId = 194583154;
        const usdcAssetId = 10458941;

        const token = {
            'X-API-Key': '1nYJyGUcqI4QNR7ChogoU2839CD3Osh7a6EVEBtv',
        };
        const server = 'https://testnet-algorand.api.purestake.io/ps2';
        const port = '';
        const algodClient = new algosdk.Algodv2(token, server, port);

        const params = await algodClient.getTransactionParams().do();

        const depositArg = new Uint8Array(Buffer.from("deposit"));
        const appCallTxn = algosdk.makeApplicationNoOpTxn(senderAddress, params, appId, [depositArg]);

        const validAmount = Number(amount) * 1000000;

        if (validAmount <= 0 || validAmount >= (2 ** 64 - 1) / 1000000) {
            throw new Error("Invalid amount. Must be a positive number and smaller than the maximum representable value.");
        }

        const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(senderAddress, senderAddress, undefined, undefined, validAmount, new Uint8Array(0), usdcAssetId, params);

        /*
        const transactionGroups = [
            { txn: appCallTxn, signers: [senderAddress] },
            { txn: assetTransferTxn, signers: [senderAddress] },
        ];

        const signedTransactionGroup = await peraWallet.signTransaction([transactionGroups]);

        const signedAppCallTxn = signedTransactionGroup[0];
        const signedAssetTransferTxn = signedTransactionGroup[1];

         */

        /*
        const group = algosdk.assignGroupID([appCallTxn, assetTransferTxn]);

        const appCallTxnGroup = { txn: appCallTxn, signers: [senderAddress] };
        const assetTransferTxnGroup = { txn: assetTransferTxn, signers: [senderAddress] };

        const appCallTxnSignature = await peraWallet.signTransaction([[appCallTxnGroup]]);
        const assetTransferTxnSignature = await peraWallet.signTransaction([[assetTransferTxnGroup]]);

        const signedAppCallTxn = appCallTxnSignature[0];
        const signedAssetTransferTxn = assetTransferTxnSignature[0];

         */

        algosdk.assignGroupID([appCallTxn, assetTransferTxn]);

        const appCallTxnGroup = { txn: appCallTxn, signers: [senderAddress] };
        const assetTransferTxnGroup = { txn: assetTransferTxn, signers: [senderAddress] };

        const signedTransactionGroup = await peraWallet.signTransaction([[appCallTxnGroup, assetTransferTxnGroup]]);

        const signedAppCallTxn = signedTransactionGroup[0];
        const signedAssetTransferTxn = signedTransactionGroup[1];

        console.log("signedAppCallTxn:", signedAppCallTxn);
        console.log("signedAssetTransferTxn:", signedAssetTransferTxn);

        const txns = [signedAppCallTxn, signedAssetTransferTxn];

        const txnResponse = await algodClient.sendRawTransaction(txns).do();
        console.log(txnResponse.txId);

        dispatch({
            type: DEPOSIT_USDC,
            payload: txnResponse,
        });

        if (callback) {
            callback({ type: DEPOSIT_USDC, payload: txnResponse });
        }

    } catch (error) {
        console.error('Error depositing USDC:', error);
    }
};

