"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const aptos_1 = require("aptos");
const assert_1 = __importDefault(require("assert"));
const NODE_URL = process.env.APTOS_NODE_URL || "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = process.env.APTOS_FAUCET_URL || "https://faucet.devnet.aptoslabs.com";
const { AccountAddress, TypeTagStruct, ScriptFunction, StructTag, TransactionPayloadScriptFunction, RawTransaction, ChainId, } = aptos_1.TxnBuilderTypes;
/**
 * This code example demonstrates the process of moving test coins from one account to another.
 */
(async () => {
    const client = new aptos_1.AptosClient(NODE_URL);
    const faucetClient = new aptos_1.FaucetClient(NODE_URL, FAUCET_URL);
    // Generates key pair for a new account
    const account1 = new aptos_1.AptosAccount();
    // To get the secret key of account 1
    //   let secret1 = Buffer.from(account1.signingKey.secretKey)
    //     .toString("hex")
    //     .slice(0, 64);
    //   console.log(secret1);
    console.log("account1 address", account1.address());
    // Creates the account on Aptos chain and fund the account with 5000 AptosCoin
    await faucetClient.fundAccount(account1.address(), 5000);
    // Each address have modules (move smart contract code) and resourses (tokens, NFTs)
    // Get the resources of account 1
    let resources = await client.getAccountResources(account1.address());
    // Find Aptos coin resourse
    let accountResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
    let balance = parseInt(accountResource?.data.coin.value);
    (0, assert_1.default)(balance === 5000);
    console.log(`account1 coins: ${balance}. Should be 5000!`);
    // Creates the second account
    const account2 = new aptos_1.AptosAccount();
    // Prints the address of second account
    console.log("account2 address", account2.address());
    // Fund the second account with 0 AptosCoin
    await faucetClient.fundAccount(account2.address(), 0);
    // Get the resources of account 2
    resources = await client.getAccountResources(account2.address());
    // Find Aptos coin resourse
    accountResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
    balance = parseInt(accountResource?.data.coin.value);
    (0, assert_1.default)(balance === 0);
    console.log(`account2 coins: ${balance}. Should be 0!`);
    const token = new TypeTagStruct(StructTag.fromString("0x1::aptos_coin::AptosCoin"));
    // TS SDK support 3 types of transaction payloads: `ScriptFunction`, `Script` and `Module`.
    // See https://aptos-labs.github.io/ts-sdk-doc/ for the details.
    const scriptFunctionPayload = new TransactionPayloadScriptFunction(ScriptFunction.natural(
    // Fully qualified module name, `AccountAddress::ModuleName`
    "0x1::coin", 
    // Module function
    "transfer", 
    // The coin type to transfer
    [token], 
    // Arguments for function `transfer`: receiver account address and amount to transfer
    [
        aptos_1.BCS.bcsToBytes(AccountAddress.fromHex(account2.address())),
        aptos_1.BCS.bcsSerializeUint64(717),
    ]));
    // Get the sequence number from account 1 && Get chain ID
    const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
        client.getAccount(account1.address()),
        client.getChainId(),
    ]);
    // See class definiton here
    // https://aptos-labs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.RawTransaction.html#constructor.
    const rawTxn = new RawTransaction(
    // Transaction sender account address
    AccountAddress.fromHex(account1.address()), BigInt(sequenceNumber), scriptFunctionPayload, 
    // Max gas unit to spend
    1000n, 
    // Gas price per unit
    1n, 
    // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
    BigInt(Math.floor(Date.now() / 1000) + 10), new ChainId(chainId));
    // Sign the raw transaction with account1's private key
    const bcsTxn = aptos_1.AptosClient.generateBCSTransaction(account1, rawTxn);
    // Submit the signed Transaction
    const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
    // Wait for the transaction to complete
    await client.waitForTransaction(transactionRes.hash);
    // Get balance of account 2
    resources = await client.getAccountResources(account1.address());
    accountResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
    balance = parseInt(accountResource?.data.coin.value);
    (0, assert_1.default)(balance === 4210);
    console.log(`account1 coins: ${balance}. Should be 4210!`);
    // Get balance of account 2
    resources = await client.getAccountResources(account2.address());
    accountResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
    balance = parseInt(accountResource?.data.coin.value);
    (0, assert_1.default)(balance === 717);
    console.log(`account2 coins: ${balance}. Should be 717!`);
})();
//# sourceMappingURL=account.js.map