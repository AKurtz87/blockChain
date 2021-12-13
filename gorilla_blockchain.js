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

const createTransaction = function (userWalletAddress, userPrivateKey, user) {
  console.log("Insert TO (Username) & Amount\n".blue.bold);
  prompt.get(["username", "amount"], function (err, result) {
    let userTo = result.username;
    let userFrom = user;
    if (!userTo || !result.amount) {
      console.log("\nEmpty username or amount not allowed!\n".red.bold);
      return submitTransaction();
    }
    if (userTo === userFrom) {
      console.log("\nYou can't send money to your wallet!\n".red.bold);
      return submitTransaction();
    }
    let amount = parseFloat(result.amount);
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      const dbo = db.db("users");
      dbo
        .collection("users")
        .find({ user: userFrom }, { projection: { _id: 0, balance: 1 } })
        .toArray(function (err, result) {
          if (err) throw err;

          let userFromBalance = parseFloat(result[0].balance);

          dbo
            .collection("users")
            .find(
              { user: userTo },
              { projection: { _id: 0, myWalletAddress: 1, balance: 1 } }
            )
            .toArray(function (err, result) {
              if (err) throw err;

              if (result.length === 0) {
                console.log("\nUsername not found!\n".red.bold);
                return submitTransaction();
              }

              if (amount <= 0) {
                console.log(
                  "\nError in amount, no 0 or negative amount allowed!\n".red
                    .bold
                );
                return submitTransaction();
              }

              if (amount > userFromBalance) {
                console.log("\nBalance insufficient!\n".red.bold);
                return submitTransaction();
              }

              let userToBalance = parseFloat(result[0].balance);

              let newFromBalance = parseFloat(userFromBalance - amount);

              let newToBalance = parseFloat(userToBalance + amount);

              //console.log(newFromBalance, newToBalance);

              addressTo = result[0].myWalletAddress;

              transaction = {
                addressFrom: userWalletAddress,
                addressTo: addressTo,
                amount: amount,
                txHash: calculateTransactionHash(
                  this.addressFrom,
                  this.addressTo,
                  this.amount
                ),
                sign: signTransaction(
                  userPrivateKey,
                  userWalletAddress,
                  this.txHash
                ),
              };

              tx = JSON.stringify(transaction);

              myqueryFrom = { user: userFrom };
              newvaluesFrom = { $set: { balance: newFromBalance } };
              dbo
                .collection("users")
                .updateOne(myqueryFrom, newvaluesFrom, function (err, res) {
                  if (err) throw err;
                });

              myqueryTo = { user: userTo };
              newvaluesTo = { $set: { balance: newToBalance } };
              dbo
                .collection("users")
                .updateOne(myqueryTo, newvaluesTo, function (err, res) {
                  if (err) throw err;
                });

              dbo
                .collection("transaction")
                .insertOne({ tx: tx }, function (err, res) {
                  if (err) throw err;
                  db.close();
                  generateBlocks();
                });
            });
        });
    });
  });
};

const submitTransaction = function () {
  console.log("");
  console.log("");

  console.log("────── ▄██████████████████▄──────".yellow.bold);
  console.log("─────▄██▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██▄────".yellow.bold);
  console.log("────▄█▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒█▄───".yellow.bold);
  console.log("───▄█▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒█▄──".yellow.bold);
  console.log("──▄█▒▒▒▄██████▄▒▒▒▒▄█████▄▒▒▒▒█──".yellow.bold);
  console.log("──█▒▒▒█▀░░░░░▀█─▒▒▒█▀░░░░▀█▒▒▒█──".yellow.bold);
  console.log("──█▒▒▒█░░▄░░░░▀████▀░░░▄░░█▒▒▒█──".yellow.bold);
  console.log("▄███▄▒█▄░▐▀▄░░░░░░░░░▄▀▌░▄█▒▒███▄".yellow.bold);
  console.log("█▀░░█▄▒█░▐▐▀▀▄▄▄─▄▄▄▀▀▌▌░█▒▒█░░▀█".yellow.bold);
  console.log("█░░░░█▒█░▐▐──▄▄─█─▄▄──▌▌░█▒█░░░░█".yellow.bold);
  console.log("█░▄░░█▒█░▐▐▄─▀▀─█─▀▀─▄▌▌░█▒█░░▄░█".yellow.bold);
  console.log("█░░█░█▒█░░▌▄█▄▄▀─▀▄▄█▄▐░░█▒█░█░░█".yellow.bold);
  console.log("█▄░█████████▀░░▀▄▀░░▀█████████░▄█".yellow.bold);
  console.log("─██▀░░▄▀░░▀░░▀▄░░░▄▀░░▀░░▀▄░░▀██".yellow.bold);
  console.log("██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██".yellow.bold);
  console.log("█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█".yellow.bold);
  console.log("█░▄░░░░░░░░░░░░░░░░░░░░░░░░░░░▄░█".yellow.bold);
  console.log("█░▀█▄░░░░░░░░░░░░░░░░░░░░░░░▄█▀░█".yellow.bold);
  console.log("█░░█▀███████████████████████▀█░░█".yellow.bold);
  console.log("█░░█────█───█───█───█───█────█░░█".yellow.bold);
  console.log("█░░▀█───█───█───█───█───█───█▀░░█".yellow.bold);
  console.log("█░░░▀█▄▄█▄▄▄█▄▄▄█▄▄▄█▄▄▄█▄▄█▀░░░█".yellow.bold);
  console.log("▀█░░░█──█───█───█───█───█──█░░░█▀".yellow.bold);
  console.log("─▀█░░▀█▄█───█───█───█───█▄█▀░░█▀─".yellow.bold);
  console.log("──▀█░░░▀▀█▄▄█───█───█▄▄█▀▀░░░█▀──".yellow.bold);
  console.log("───▀█░░░░░▀▀█████████▀▀░░░░░█▀───".yellow.bold);
  console.log("────▀█░░░░░▄░░░░░░░░░▄░░░░░█▀────".yellow.bold);
  console.log("─────▀██▄░░░▀▀▀▀▀▀▀▀▀░░░▄██▀─────".yellow.bold);
  console.log("────────▀██▄▄░░░░░░░▄▄██▀────────".yellow.bold);
  console.log("───────────▀▀███████▀▀───────────\n".yellow.bold);
  console.log("┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴".yellow.bold);
  console.log("┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬\n".yellow.bold);

  console.log("────── GORILLA CRIPTO COIN ──────\n".yellow.bold);
  console.log("Insert Account Username & Password\n".blue.bold);

  prompt.get(["username", "password"], function (err, result) {
    //
    const user = result.username;
    const pass = result.password;
    if (user || pass) {
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
              console.log(`Welcome ${userName}!\n`.blue.bold);
              console.log("┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴".yellow.bold);
              console.log("┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬\n".yellow.bold);
              createTransaction(userWalletAddress, userPrivateKey, user);
            } else {
              console.log("\nWrong username or password!\n".red.bold);
              submitTransaction();
            }

            db.close();
          });
      });
    } else {
      console.log("\nEmpty username or password not allowed!\n".red.bold);
      submitTransaction();
    }
  });
};

submitTransaction();

////////////////////////////____MINING MODULE____////////////////////

let nonce = 0;
let difficulty = 5;

let allTransaction = [];

let allBlockHash = [];
let allProofHash = [];

generateBlockHashZero = function (blockHashZero) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;

    const dbo = db.db("users");
    dbo
      .collection("blockHash")
      .insertOne({ blockHash: blockHashZero }, function (err, res) {
        if (err) throw err;
        db.close();
      });
  });
};

let previousHash =
  "6dc860e85a0939878a167616be64cff2713a34aa659ce66f4db3f114cabd6967";

//generateBlockHashZero(previousHash);

/*
generateTransaction = function () {
  for (let i = 0; i < 10; i++) {
    transaction = { address: "address", amount: 1000 + i, date: Date.now() };
    stringTransaction = JSON.stringify(transaction);
    allTransaction.push(stringTransaction);
  }
};
*/
generateBlocks = function () {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("users");
    dbo
      .collection("blockProofHash")
      .find({}, { projection: { _id: 0, blockProofHash: 1 } })
      .toArray(function (err, result) {
        if (err) throw err;
        n = result.length;

        dbo
          .collection("transaction")
          .find({}, { projection: { _id: 0, tx: 1 } })
          .toArray(function (err, result) {
            if (err) throw err;
            db.close();
            //console.log(result[0]);

            for (let i = 0 + n; i < result.length; i++) {
              stringTransaction = JSON.stringify(result[i]);
              if (stringTransaction) {
                allTransaction.push(stringTransaction);
              }
            }

            if (allTransaction.length === 0) {
              console.log("\nNo new transaction to process!\n".red.bold);
            }

            //console.log(allTransaction);

            //console.log(allTransaction.length);

            allTransaction.forEach(generateBlockHash);
          });
      });
  });
};

function generateBlockHash(item, index, arr) {
  arr[index] = calculateBlockHash(item);
}

function generateProofHash(item, index, arr) {
  arr[index] = mineBlock(item);
}

calculateBlockHash = function (transaction) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("users");
    dbo
      .collection("blockHash")
      .find({}, { projection: { _id: 0, blockHash: 1 } })
      .toArray(function (err, result) {
        if (err) throw err;

        n = result.length;
        previousHash = result[n - 1].blockHash;

        blockHash = crypto
          .createHash("sha256")
          .update(previousHash + transaction + nonce)
          .digest("hex");

        //console.log("\nPreviousHash is:\n".green.bold);
        console.log("\n┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴\n".yellow.bold);
        //console.log(previousHash + "\n");

        allBlockHash.push(blockHash);

        //console.log(allBlockHash);
        console.log(
          "Added n: ".green.bold +
            allBlockHash.length +
            "  BlockHash\n".green.bold
        );

        allBlockHash.forEach(generateProofHash);

        //console.log(allProofHash);

        console.log(
          "Added n: ".blue.bold +
            allProofHash.length +
            "  BlockHash\n".blue.bold
        );
        console.log("┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴".yellow.bold);
        console.log("┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬".yellow.bold);
        console.log("┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴".yellow.bold);
        console.log("┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬".yellow.bold);
        console.log("          BLOCK  MINED!          ".yellow.bold);
        console.log("┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴".yellow.bold);
        console.log("┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬".yellow.bold);
        console.log("┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴".yellow.bold);
        console.log("┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬\n".yellow.bold);

        dbo
          .collection("blockHash")
          .insertOne({ blockHash: blockHash }, function (err, res) {
            if (err) throw err;
            db.close();
          });
      });
  });
};

calculateHash = function (hash) {
  proofHash = crypto
    .createHash("sha256")
    .update(hash + nonce)
    .digest("hex");
  return proofHash;
};

mineBlock = function (blockHash) {
  while (
    blockHash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
  ) {
    nonce++;
    blockHash = calculateHash(blockHash);
  }

  allProofHash.push(blockHash);
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;

    const dbo = db.db("users");
    dbo
      .collection("blockProofHash")
      .insertOne({ blockProofHash: blockHash }, function (err, res) {
        if (err) throw err;
        db.close();
      });
  });
};
