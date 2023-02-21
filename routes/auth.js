const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");
const User = require("../models/user");
const isAuthorised = require("../middlewares/auth");

const router = express.Router();

router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({
          email: value,
        }).then((user) => {
          if (user) return Promise.reject("Email already exists");
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
  ],
  authController.login
);

router.get("/status", isAuthorised, authController.getUserStatus);
router.patch(
  "/status",
  isAuthorised,
  [body("status").trim().not().isEmpty()],
  authController.updateUserStatus
);

module.exports = router;
