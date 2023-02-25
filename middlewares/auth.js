const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: __dirname + "./../.env" });

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    /*
        const error = new Error("Not Authenticated");
        error.statusCode = 401;
        throw error;
        */

    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    /*
        err.statusCode = 500;
        throw err;
        */
    req.isAuth = false;
    return next();
  }

  if (!decodedToken) {
    /*
        const error = new Error("Unauthorized");
        error.statusCode = 401;
        throw error;
    */
    req.isAuth = false;
    return next();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true;

  next();
};
