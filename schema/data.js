const mongoose = require("mongoose");

const userSchem = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  tel: { type: Number, default: null },
  bl: { type: Number, default: 0 },
  fine: { type: Number, default: 0 },
  acclvl: { type: Number, default: 0 },
  web3: { type: String, default: null },
  guildid: { type: String, default: null },
  nonce: { type: Number, default: Math.floor(Math.random() * 1000000) },
});

const iconRoleSchem = new mongoose.Schema({
  roleId: { type: String, required: true, unique: true },
});

const nftUpdateSchem = new mongoose.Schema({
  smartContract: { type: String, required: true, unique: true },
  blockId: { type: Number, required: true },
});

module.exports = { userSchem, iconRoleSchem, nftUpdateSchem };
