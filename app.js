const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const multer = require("multer");
const { v4:uuid4} = require("uuid");

dotenv.config();

const feedRoutes = require("./routes/feed");

const app = express();

const fileStorage = multer.diskStorage({
  destination : (req,file,cb) =>{
    cb(null,'images');
  },
  filename: (req,file,cb) =>{
    cb(null, uuid4() + '-' + file.originalname)
  }
});

const fileFilter = (req,file,cb) =>{
  if(
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ){
    cb(null,true)
  }else{
    cb(null, false)
  }
}

app.use(bodyParser.json());
app.use(multer({
  storage : fileStorage,
  fileFilter
}).single('image'))
app.use("/images", express.static(path.join(__dirname, "images")));
//handle CORS issue
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // wildcard(*) means allow from all origins
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  ); //allows different origins to access only these methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); //allows different origins to set Content-Type and Authorization
  next();
});
app.use("/feed", feedRoutes);

app.use((error, req, res,next)=>{
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;

  res.status(status).json({
    message
  })
})

mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    console.log("Database Connected");
    app.listen(process.env.PORT);
    console.log(`Server started at port ${process.env.PORT}`);
  })
  .catch((err) => console.log(err));
