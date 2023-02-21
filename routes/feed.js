const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuthorized = require("../middlewares/auth");

const router = express.Router();

router.get("/posts", isAuthorized, feedController.getPosts);
router.post(
  "/post",
  isAuthorized,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

router.get("/post/:postId", isAuthorized, feedController.getPost);
router.put(
  "/post/:postId",
  isAuthorized,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost
);

router.delete("/post/:postId", isAuthorized, feedController.deletePost);

module.exports = router;
