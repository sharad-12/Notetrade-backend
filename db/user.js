const mongoose=require('mongoose');

const userschema=new mongoose.Schema({
    name:String,
    email:String,
    mobile:String,
    password:String,
});

module.exports=new mongoose.model("userdatas",userschema);