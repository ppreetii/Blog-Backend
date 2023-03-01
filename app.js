const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const multer = require("multer");
const { v4: uuid4 } = require("uuid");

const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middlewares/auth");
const Utils = require("./utils/helper");

dotenv.config();

// const feedRoutes = require("./routes/feed");
// const authRoutes = require("./routes/auth");

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null,  uuid4() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//handle CORS issue
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // wildcard(*) means allow from all origins
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  ); //allows different origins to access only these methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); //allows different origins to set Content-Type and Authorization

  //Graphql only takes GET and POST requests. Browser will always make automatic OPTIONS request before
  // making the intended HTTP request(GET,POST, PATCH, DELETE , etc). For Graphql , we will get method not allowed error for
  // OPTIONS request, if following code is not added.
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  multer({
    storage: fileStorage,
    fileFilter,
  }).single("image")
);

/* 
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);
*/
app.use(auth);

app.put("/post-image", (req, res, next) => {
  if(!req.isAuth){
    throw new Error("Not Authenticated.")
  }
  if (!req.file) {
    return res.status(200).json({
      message: "No file provided.",
    });
  }

  if (req.body.oldPath) {
    Utils.clearImage(req.body.oldPath);
  }
  console.log(req.file.path)
  return res.status(201).json({
    message: "File Uploaded.",
    filePath: req.file.path,
  });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      console.log(err.originalError);
      const data = err.originalError.data;
      const code = err.originalError.code || 500;
      const message = err.originalError.message || "An error occurred";
      return {
        status: code,
        message,
        data,
      };
    },
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  let err = {
    message: error.message,
  };

  if (error.data) {
    err.data = error.data;
  }

  res.status(status).json(err);
});

mongoose
  .connect(process.env.MONGODB_URL)
  .then((result) => {
    console.log("Database Connected");
    app.listen(process.env.PORT);
    console.log(`Server started at port ${process.env.PORT}`);
    /* 
    const server = app.listen(process.env.PORT);
   
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client Connected");
    });
    */
  })
  .catch((err) => console.log(err));
