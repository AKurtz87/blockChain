const crypto = require("crypto");

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

let nonce = 0;
let difficulty = 6;

let allTransaction = [];

let allBlockHash = [];
let allProofHash = [];

let previousHash =
  "6dc860e85a0939878a167616be64cff2713a34aa659ce66f4db3f114cabd6967";

generateTransaction = function () {
  for (let i = 0; i < 10; i++) {
    transaction = { address: "address", amount: 1000 + i, date: Date.now() };
    stringTransaction = JSON.stringify(transaction);
    allTransaction.push(stringTransaction);
  }
};

function generateBlockHash(item, index, arr) {
  arr[index] = calculateBlockHash(item, index);
}

function generateProofHash(item, index, arr) {
  arr[index] = mineBlock(item);
}

calculateBlockHash = function (transaction, index) {
  previousHash = allBlockHash[index];
  time = new Date();
  blockHash = crypto
    .createHash("sha256")
    .update(previousHash + time + transaction + nonce)
    .digest("hex");
  allBlockHash.push(blockHash);
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
};

generateTransaction();

console.log(allTransaction);

console.log(allTransaction.length);

allBlockHash.push(previousHash);

allTransaction.forEach(generateBlockHash);

console.log(allBlockHash);

console.log(allBlockHash.length);

allBlockHash.forEach(generateProofHash);

console.log(allProofHash);

console.log(allProofHash.length);
