export async function waitForConfirmation(algodClient, txId, timeout) {
    let startRound;
    let currentRound;

    const txInfo = await algodClient.pendingTransactionInformation(txId).do();
    startRound = txInfo['confirmed-round'];
    currentRound = startRound;

    while (currentRound < startRound + timeout) {
        const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
        if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
            return pendingInfo;
        }

        await algodClient.statusAfterBlock(currentRound).do();
        currentRound += 1;
    }

    throw new Error(`Transaction not confirmed after ${timeout} rounds`);
}
