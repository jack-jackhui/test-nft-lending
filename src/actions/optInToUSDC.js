// Add this import at the top of the file
import { waitForConfirmation } from '../utils/waitForConfirmation';
import { peraWallet } from '../App';
//import {PeraWalletConnect} from "@perawallet/connect";
import algosdk from 'algosdk';

//const peraWallet = new PeraWalletConnect({shouldShowSignTxnToast: false});
export const OPT_IN_USDC = 'OPT_IN_USDC';
export const optInToUSDC = (accountAddress) => async (dispatch) => {
    //console.log(accountAddress);
    const usdcAssetId = 10458941;
    const contractId = 194583154;
    /*
    const testAccount = 'DG6PDXODHSU5J2ZBLDFALJTHGB44FFE7H5KIDIEBUSGB5UOLMF3P4VXYMQ'

    if (testAccount === accountAddress) {
        console.log("testAccount and accountAddress are the same.");
    } else {
        console.log("testAccount and accountAddress are different.");
    }
     */

    try {

        const token =""
        const server = 'https://testnet-api.algonode.cloud'
        const port = '';
        const algodClient = new algosdk.Algodv2(token, server, port);

        const suggestedParams = await algodClient.getTransactionParams().do();
        suggestedParams.flatFee = false; // Enable dynamic fee calculation

        try {
            await peraWallet.connect();
        } catch (error) {
            console.error('Error connecting to PeraWallet:', error);
            return;
        }

        /*
        console.log(suggestedParams);

        if (!algosdk.isValidAddress(accountAddress)) {
            console.error("Invalid account address:", accountAddress);
            return;
        }

         */

        const accountInfo = await algodClient.accountInformation(accountAddress).do();
        const hasOptedIn = accountInfo.assets.some((asset) => asset['asset-id'] === usdcAssetId);
        const hasOptedInContract = accountInfo['apps-local-state'].some(app => app.id === contractId);
        console.log(accountInfo);
        console.log(hasOptedInContract);
        //const hasOptedInContract = accountInfo.applications.some((applications) => applications['app-id'] === contractId)

        if (!hasOptedIn) {

        // Create the asset opt-in transaction
        const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: accountAddress,
            to: accountAddress,
            suggestedParams,
            assetIndex: usdcAssetId,
            amount: 0,
        });

        console.log(optInTxn);

        // Sign the opt-in transaction
        const optInTxnGroup = { txn: optInTxn, signers: [accountAddress] };

        const optInTxnSignature = await peraWallet.signTransaction([[optInTxnGroup]]);
        console.log(optInTxnSignature);

        // Send the opt-in transaction
        const txnResponse = await algodClient.sendRawTransaction(optInTxnSignature).do();
        console.log(txnResponse);

        // Wait for the transaction to be confirmed (Optional)
        const confirmedTxn = await waitForConfirmation(algodClient, txnResponse.txId, 4);

        dispatch({
            type: OPT_IN_USDC,
            payload: confirmedTxn,
        });

        } else {
            console.log('User has already opted-in to USDC');
        }

        if (!hasOptedInContract) {

            // Create the asset opt-in transaction
            //const enc = new TextEncoder();
            //const appArgs = enc.encode("deposit");
            const optInAppTxn = algosdk.makeApplicationOptInTxnFromObject({
                from: accountAddress,
                appIndex: contractId,
                suggestedParams
            });

            console.log(optInAppTxn);

            // Sign the opt-in transaction
            const optInAppTxnGroup = { txn: optInAppTxn, signers: [accountAddress] };

            const optInAppTxnSignature = await peraWallet.signTransaction([[optInAppTxnGroup]]);
            console.log(optInAppTxnSignature);

            // Send the opt-in transaction
            const txnResponse = await algodClient.sendRawTransaction(optInAppTxnSignature).do();
            console.log(txnResponse);

            // Wait for the transaction to be confirmed (Optional)
            const confirmedTxn = await waitForConfirmation(algodClient, txnResponse.txId, 4);

            dispatch({
                type: OPT_IN_USDC,
                payload: confirmedTxn,
            });

        } else {
            console.log('User has already opted-in to the Smart Contract');
        }

    } catch (error) {
        console.error('Error opting in:', error);
    }
};
