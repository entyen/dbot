const mongoose = require('mongoose')

const userSchem = new mongoose.Schema({ 
    userid: {type: Number, required: true, unique: true}, 
    balance: Number, 
    tel: Number,
    bl: Number
})

module.exports = userSchem