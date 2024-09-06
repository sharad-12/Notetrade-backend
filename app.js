const express = require("express");
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Mail = require("./mail");
const requestMail = require('./contactMail');
require("dotenv").config();

const port = process.env.PORT || 5000;
const link = process.env.MONGO_LINK;

const app = express();
mongoose.connect(link).then(() => console.log("Database connected")).catch((err) => console.log(err));

const usermodel = require("./db/user");
const productmodel = require("./db/product");
const messagemodel = require("./db/message");
const requestmodel = require("./db/request");

app.use(bodyparser.urlencoded({ extended: true }));

app.use(express.json());
app.use(cors({origin:'https://note-trade.vercel.app',credentials:true}));
// app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(express.static(__dirname+"/build"));

app.post("/register", async (req, res) => {
  try {
    const check = await usermodel.findOne({ email: req.body.email });

    if (check) {
      res.json("exist");
    } else {
      req.body.password = await bcrypt.hash(req.body.password, 10);
      let user = new usermodel(req.body);
      let data = await user.save();

      res.send(data);
    }
  } catch (e) {
    res.json("not exist");
  }
});

app.post("/login", async (req, res) => {
  const result = await usermodel.findOne({ email: req.body.email });
  if (result) {
    const ismatch = await bcrypt.compare(req.body.password, result.password);

    if (ismatch) {
      res.send(result);
    } else {
      res.json("Notmatch");
    }
  } else {
    res.json("Notfound");
  }
});

let data = {};
let otp;
app.post("/getdata", async (req, res) => {
  otp = Mail.otp;
  console.log(Mail.otp);
  data = {
    Useremail:req.body.userEmail,
    userName:req.body.userName,
    requestUserEmail: req.body.email,
    requestUsername:req.body.name,
    requestUserNumber:req.body.userMobile,
    subject: req.body.subject,
    semester: req.body.semester,
  };
  Mail.sendMail(data.Useremail);
  res.json("true");
});

app.post("/confirmotp", async (req, res) => {
  if (req.body.otp === otp) {
    try {
      const existingRequest = await requestmodel.findOne({
        semester: data.semester,
        subject: data.subject,
        userEmail: data.Useremail,
        userName:data.userName,
        requestUserEmail: data.requestUserEmail,
      });

      if (existingRequest) {
        res.json("Already requested");
      } 
      else {
        const details = {
          userEmail: data.Useremail,
          userName:data.userName,
          requestUserEmail: data.requestUserEmail,
          requestUsername: data.requestUsername,
          requestUserNumber:data.requestUserNumber,
          semester: data.semester,
          subject: data.subject,
          status: "Pending",
          message: "",
        };

        const newRequest = new requestmodel(details);
        await newRequest.save();
        requestMail(details.requestUserEmail,details.userEmail,details.semester,details.subject);
        res.json("true");
      }
    } 
    catch (error) {
      console.error("Error processing the request:", error);
      res.status(500).json("Internal server error");
    }
  } 
  else {
    res.json("false");
  }
});

app.post("/products", async (req, res) => {
  const products = await productmodel.find({
    status: "available",
    userId: { $ne: req.body.userId },
  });
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send({ result: "No Products Found" });
  }
});

app.post("/myproducts", async (req, res) => {
  const products = await productmodel.find({ userId: req.body.userId });
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send({ result: "No Products Found" });
  }
});

app.post("/addproduct", async (req, res) => {
  const { userId, userEmail, userName, userMobile, formData } = req.body;
  const { semester, subject, description } = formData;

  const existingProduct = await productmodel.findOne({
    userEmail,
    semester,
    subject,
    description,
  });

  if (existingProduct) {
    res.status(409).send("Data already exists");
  } else {
    const obj = {
      userId,
      userEmail,
      userName,
      userMobile,
      semester,
      subject,
      description,
    };

    const product = new productmodel(obj);
    const result = await product.save();
    res.send(result);
  }
});


app.delete("/deleteproduct/:id", async (req, res) => {
  const result = await productmodel.deleteOne({ _id: req.params.id });
  res.send(result);
});

app.get("/getproducttoupdate/:id", async (req, res) => {
  const result = await productmodel.findOne({ _id: req.params.id });

  if (result) {
    res.send(result);
  } else {
    res.send({ result: "Not Found" });
  }
});

app.put("/updateproduct/:id", async (req, res) => {
  const result = await productmodel.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

app.get("/search/:key", async (req, res) => {
  const result = await productmodel.find({
    $or: [
      { semester: { $regex: req.params.key } },
      { subject: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

app.post("/sendmessage", async (req, res) => {
  let user = new messagemodel(req.body);
  let data = await user.save();

  res.json("true");
});

app.post('/myrequests', async (req, res) => {
    try {
      const { userEmail } = req.body;
  
      const myRequests = await requestmodel.find({ userEmail });
  
      res.status(200).json(myRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json('Internal server error');
    }
  });

  app.post('/requests', async (req, res) => {
    try {
      const { requestUserEmail } = req.body;
  
      const Requests = await requestmodel.find({ requestUserEmail });
  
      res.status(200).json(Requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      res.status(500).json('Internal server error');
    }
  });

  app.put('/changeStatusAccepted', async (req, res) => {
    try {
      console.log("Accept Request API");
      console.log(req.body);
      const filter = req.body;
      const update = { $set: { status: 'Accepted' } };
  
      const result = await requestmodel.updateOne(filter, update);
      console.log(result);
      if (result.modifiedCount === 1) {
        const productFilter = {
          userEmail: req.body.requestUserEmail,
          semester: req.body.semester,
          subject: req.body.subject,
        };
  
        const productUpdate = { $set: { status: 'unavailable' } };
        const productUpdateResult = await productmodel.updateOne(productFilter, productUpdate);

        res.status(200).json('Status updated to "Accepted"');
      } else {
        res.json('Status is already "Accepted"');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json('Internal server error');
    }
  });
  
  app.put('/changeStatusDecline', async (req, res) => {
    try {
      console.log("Decline Request API");
      console.log(req.body);
      const filter = req.body;
      const update = { $set: { status: 'Declined' } };
  
      const result = await requestmodel.updateOne(filter, update);
      console.log(result);
      if (result.modifiedCount === 1) {
        res.status(200).json('Status updated to "Declined"');
      } else {
        res.json('Status is already "Accepted"');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json('Internal server error');
    }
  });


  app.use('*',(req,res)=>
  {
    res.sendFile(__dirname+"/build/index.html");
  })

app.listen(port, () => {
  console.log("server started");
});
