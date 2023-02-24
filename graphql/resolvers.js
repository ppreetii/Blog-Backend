const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: __dirname + "./../.env" });

const User = require("../models/user");

module.exports = {
  createUser: async function (args, req) {
    const { email, name, password } = args.userInput;

    //Validate Request Body
    const errors = [];
    if (!validator.isEmail(email)) errors.push("Invalid Email");
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    )
      errors.push("Password must be min. 5 characters length");

    if (errors.length > 0) {
      const error = new Error("Validation Error");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      const error = new Error("User already exists");
      throw error;
    }

    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      name,
      password: hashedPw,
    });

    const dbUser = await user.save();
    return {
      _id: dbUser._id.toString(),
      ...dbUser._doc,
    };
  },

  login: async function ({ email, password }, req) {
    //Validate Request Body
    const errors = [];
    if (!validator.isEmail(email)) errors.push("Invalid Email");
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    )
      errors.push("Password must be min. 5 characters length");

    if (errors.length > 0) {
      const error = new Error("Validation Error");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("User Not Found");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Incorrect PAssowrd");
      error.code = 400;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    return {
        token,
        userId: user._id.toString()
    }
  },
};
