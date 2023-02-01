const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

const checkAuth = (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: "Bearer TOKEN"
    if (!token) throw new Error("Authentication failed.");
    const decodedToken = jwt.verify(token, "secret-key");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication failed.", 401));
  }
};

const checkAuthForVisibility = (req, res, next) => {
  if (req.method === "OPTIONS") return next();

  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: "Bearer TOKEN"
    if (!token) throw new Error();
    const decodedToken = jwt.verify(token, "secret-key");
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    next();
  }
};

module.exports.checkAuth = checkAuth;
module.exports.checkAuthForVisibility = checkAuthForVisibility;
