const mongoose=require('mongoose');

const userschema=new mongoose.Schema({
    name:String,
    email:String,
    message:String,
});

module.exports=new mongoose.model("messagedatas",userschema);