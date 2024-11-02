const { Schema, model } = require("mongoose");

const userSchem = new Schema({
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

const iconRoleSchem = new Schema({
  roleId: { type: String, required: true, unique: true },
});

const nftUpdateSchem = new Schema({
  smartContract: { type: String, required: true, unique: true },
  blockId: { type: Number, required: true },
});

const serverSchema = new Schema({
  serverId: { type: String, require: true, unique: true },
  serverName: { type: String, default: null },
  active: { type: Boolean, default: true },
  serverCurrencyName: { type: String, default: null },
  serverCurrencyEmoji: { type: String, default: null },
  whoCanTransferCurrency: { type: String, default: null },
  whoCanCreateCurrency: { type: String, default: null },
});

const serverUserSchema = new Schema({
  serverId: { type: String, require: true },
  userId: { type: String, require: true },
  userName: { type: String, default: null },
  serverRole: { type: String, default: null },
  dkpPoints: { type: Number, default: 0 },
  activityPoints: { type: Number, default: 0 },
});

const givingPointsSchema = new Schema({
  serverId: { type: String, require: true },
  giverId: { type: String, require: true },
  getterId: { type: String, require: true },
  givingPoints: { type: Number, require: true },
  givingReason: { type: String, default: null },
});

serverUserSchema.index({ serverId: 1, userId: 1 }, { unique: true });

const serverdb = model("servers", serverSchema);
const serverUserdb = model("servers_users", serverUserSchema);
const pointsdb = model('points', givingPointsSchema)

module.exports = {
  userSchem,
  iconRoleSchem,
  nftUpdateSchem,
  serverdb,
  serverUserdb,
  pointsdb
};
