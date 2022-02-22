const mongoose = require('mongoose')

const userSchem = new mongoose.Schema({ 
    userid: {type: Number, required: true, unique: true}, 
    balance: { type: Number, default: 0}, 
    tel: { type: Number, default: null},
    bl: { type: Number, default: 0}
})

module.exports = userSchem