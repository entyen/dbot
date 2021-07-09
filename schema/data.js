const mongoose = require('mongoose')

const userSchem = new mongoose.Schema({ 
    userid: Number, 
    balance: Number, 
    tel: Number,
    bl: Number
})

module.exports = userSchem