const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/./../.env" });

const { validationResult } = require("express-validator");
const User = require("../models/user");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Error");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { email, password, name } = req.body;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        name,
        password: hashedPassword,
      });

      return user.save();
    })
    .then((dbUser) => {
      res.status(201).json({
        message: "User Created",
        userId: dbUser._id,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Error");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const { email, password } = req.body;
  let authUser;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error("User with Email Not Found");
        error.statusCode = 401;
        throw error;
      }
      authUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Incorrect Password");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          email: authUser.email,
          userId: authUser._id.toString(),
        },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

      res.status(200).json({
        token,
        userId: authUser._id.toString()
      })
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
