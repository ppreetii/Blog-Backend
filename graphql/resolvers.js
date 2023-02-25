const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: __dirname + "./../.env" });

const User = require("../models/user");
const Post = require("../models/post");

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
      userId: user._id.toString(),
    };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;

    //Validate Request Body
    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 }))
      errors.push(
        "Input Proper Title. Check your length if it is less than 5 characters"
      );
    if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 }))
      errors.push(
        "Input Proper Content. Check your length if it is less than 5 characters"
      );

    if (errors.length > 0) {
      const error = new Error("Validation Error");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User Not Found");
      error.code = 401;
      throw error;
    }
    const post = await Post({
      title,
      content,
      imageUrl,
      creator: user,
    });

    user.posts.push(post);
    await user.save();
    const dbPost = await post.save();
    return {
      ...dbPost._doc,
      _id: dbPost._id.toString(),
      createdAt: dbPost.createdAt.toISOString(),
      updatedAt: dbPost.updatedAt.toISOString(),
    };
  },
  getPosts: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }

    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().populate("creator").sort({ createdAt: -1 });

    return {
      posts: posts.map((post) => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
      totalItems,
    };
  },
};
