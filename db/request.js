const mongoose=require('mongoose');

const requestschema=new mongoose.Schema({
    userEmail:String,
    userName:String,
    userNumber:String,
    requestUserEmail:String,
    requestUsername:String,
    semester:String,
    subject:String,
    status:String,
    message:String
});

module.exports=new mongoose.model("requestdatas",requestschema);