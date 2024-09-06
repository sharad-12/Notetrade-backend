const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const otpGenerator=require("otp-generator");
const otp=otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });
const config = require('./config');
const OAuth2 = google.auth.OAuth2;

const OAuth2_client = new OAuth2(config.clientID,config.clientSecret);
OAuth2_client.setCredentials({refresh_token:config.refreshToken});

const sendMail=(recipient)=>
{
    const access_token =config.accessToken;
    const transport = nodemailer.createTransport(
        {
            service:'gmail',
            auth:{
                type:'OAUTH2',
                user:config.user,
                clientId:config.clientID,
                clientSecret:config.clientSecret,
                refreshToken:config.refreshToken,
                accessToken:access_token
            }
        }
    );
    const mailOption =
    {
        from:`NoteTrade ${config.user}`,
        to:recipient,
        subject:'Confirm OTP to get in Touch with the Provider',
        html:otp,
    }
    transport.sendMail(mailOption,(err,result)=>
    {
        if(err)
        {
            console.log(err);
            return err;
        }
        else
        {
            console.log(result);
            return "Successfully Send"
        }
    })
}

module.exports = {sendMail,otp};