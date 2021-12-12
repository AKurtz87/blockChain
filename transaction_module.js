const crypto = require("crypto");

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://127.0.0.1:27017";

const prompt = require("prompt");

const colors = require("colors");
colors.setTheme({
  bgGreen: "bgGreen",
  bgCyan: "bgCyan",
  yellow: "yellow",
  bgBlue: "bgBlue",
  blue: "blue",
  bold: "bold",
});

calculateTransactionHash = function (addressFrom, addressTo, amount) {
  time = new Date();
  txHash = crypto
    .createHash("sha256")
    .update(time + addressFrom + addressTo + amount)
    .digest("hex");
  return txHash;
};

// here signTransaction
const signTransaction = function (userPrivateKey, userWalletAddress, txHash) {
  signKey = ec.keyFromPrivate(userPrivateKey);

  if (signKey.getPublic("hex") !== userWalletAddress) {
    throw new Error("You cannot sign transactions for other wallets!");
  }

  const sig = signKey.sign(txHash, "base64");

  signature = sig.toDER("hex");

  //console.log(signature);

  return signature;
};

const createTransaction = function (userWalletAddress, userPrivateKey) {
  prompt.get(["addressTo", "amount"], function (err, result) {
    //
    transaction = {
      addressFrom: userWalletAddress,
      addressTo: result.addressTo,
      amount: result.amount,
      txHash: calculateTransactionHash(
        this.addressFrom,
        this.addressTo,
        this.amount
      ),
      sign: signTransaction(userPrivateKey, userWalletAddress, this.txHash),
    };

    console.log(transaction);

    //calculateTransactionHash(transaction);

    //signTransaction(userPrivateKey, userWalletAddress, txHash);
  });
};

const submitTransaction = function () {
  prompt.get(["username", "password"], function (err, result) {
    //
    const user = result.username;
    const pass = result.password;
    loginHash = crypto.createHash("sha256").update(pass).digest("hex");
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      const dbo = db.db("users");

      dbo
        .collection("users")
        .find({ user: user })
        .toArray(function (err, result) {
          if (err) throw err;
          //console.log(result[0]);

          userName = result[0].user;
          userHash = result[0].hash;
          userWalletAddress = result[0].myWalletAddress;
          userPrivateKey = result[0].myKey;
          if ((userName === user) & (userHash === loginHash)) {
            console.log("");
            console.log(`Welcome ${userName}!`.blue.bold);
            console.log("");
            createTransaction(userWalletAddress, userPrivateKey);
          }

          db.close();
        });
    });
  });
};

submitTransaction();
