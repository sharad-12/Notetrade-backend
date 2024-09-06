const mongoose = require('mongoose');

const productschema = new mongoose.Schema({
    userId: String,
    userEmail: String,
    userName: String,
    userMobile: String,
    semester: String,
    subject: String,
    description:String,
    status: { type: String, default: "available" }
});

module.exports = mongoose.model("productdatas", productschema);
