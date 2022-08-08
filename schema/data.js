const mongoose = require('mongoose')

const userSchem = new mongoose.Schema({
    userid: {type: Number, required: true, unique: true},
    balance: { type: Number, default: 0},
    tel: { type: Number, default: null},
    bl: { type: Number, default: 0},
    acclvl: { type: Number, default: 0}
})

const iconRoleSchem = new mongoose.Schema({ 
    roleId: {type: String, required: true, unique: true} 
})

module.exports = { userSchem, iconRoleSchem }