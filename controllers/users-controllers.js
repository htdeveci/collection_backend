const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const fs = require("fs");
const bcyrpt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/users-model");

const getUserById = async (req, res, next) => {
  const userId = req.params.userId;

  let user;
  try {
    user = await User.findById(userId, "-password")
      .populate({
        path: "collectionList",
        options: { sort: { creationDate: -1 } },
      })
      .populate("favoriteCollectionList")
      .populate("favoriteItemList");
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later.", 500)
    );
  }

  if (!user)
    return next(new HttpError("Could not find a user by provided id.", 404));

  const loggedInUserId = req.userData ? req.userData.userId : null;
  user.collectionList = user.collectionList.filter((col) => {
    if (col.visibility === "everyone") return col;
    else if (col.creator.toString() === loggedInUserId) {
      return col;
    }
  });

  res.status(200).json(user.toObject({ getters: true }));
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let identifiedUser;
  try {
    identifiedUser = await User.findOne({ email });
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later.", 500)
    );
  }

  if (!identifiedUser)
    return next(
      new HttpError(
        "Could not identify user, credentials seem to be wrong.",
        401
      )
    );

  let isValidPassword = false;
  try {
    isValidPassword = await bcyrpt.compare(password, identifiedUser.password);
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later.", 500)
    );
  }

  if (!isValidPassword)
    return next(
      new HttpError(
        "Could not identify user, credentials seem to be wrong.",
        401
      )
    );

  const token = generateToken(
    { userId: identifiedUser.id },
    new HttpError("Logging in failed, please try again later.", 500)
  );

  res.json({
    token,
    userId: identifiedUser.id,
    username: identifiedUser.username,
    email: identifiedUser.email,
  });
};

const register = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty())
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );

  const { username, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(
      new HttpError("Registration failed, please try again later.", 500)
    );
  }

  if (existingUser) {
    return next(
      new HttpError("User already exist, please login instead.", 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcyrpt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again.", 500));
  }

  const createdUser = new User({
    username,
    email,
    password: hashedPassword,
    registerationDate: new Date(),
    profilePicture: "",
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(
      new HttpError("Registration failed, please try again later.", 500)
    );
  }

  const token = generateToken(
    { userId: createdUser.id },
    new HttpError("Registration failed, please try again later.", 500)
  );

  res.status(201).json({
    token,
    userId: createdUser.id,
    username: createdUser.username,
    email: createdUser.email,
  });
};

const updateProfilePicture = async (req, res, next) => {
  const userId = req.params.userId;

  let updatedUser;
  try {
    updatedUser = await User.findById(userId);
  } catch (err) {
    return next(
      new HttpError(
        "Something went wrong, could not update profile picture.",
        500
      )
    );
  }

  if (!updatedUser)
    return next(
      new HttpError("Could not find a user for the provided id.", 404)
    );

  if (updatedUser.id.toString() !== req.userData.userId) {
    return next(
      new HttpError("Unathorized person can not update this user.", 500)
    );
  }

  let oldProfilePicture = updatedUser.profilePicture;
  updatedUser.profilePicture = req.file.path;

  try {
    await updatedUser.save();
  } catch (err) {
    return next(
      new HttpError(
        "Something went wrong, could not update profile picture.",
        500
      )
    );
  }

  if (oldProfilePicture !== "")
    fs.unlink(oldProfilePicture, (err) => {
      if (err) console.log(err);
    });

  res.status(200).json(updatedUser.toObject({ getters: true }));
};

const updateUser = async (req, res, next) => {
  const { username, email, password } = req.body;
  const userId = req.params.userId;

  let updatedUser;
  try {
    updatedUser = await User.findById(userId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update user.", 500)
    );
  }

  if (!updatedUser)
    return next(
      new HttpError("Could not find a user for the provided id.", 404)
    );

  if (updatedUser.id.toString() !== req.userData.userId) {
    return next(
      new HttpError("Unathorized person can not update this user.", 500)
    );
  }

  if (username) updatedUser.username = username;
  if (email) updatedUser.email = email;
  if (password) updatedUser.password = password;

  try {
    await updatedUser.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update user.", 500)
    );
  }

  res.status(200).json({ user: updatedUser.toObject({ getters: true }) });
};

const deleteUser = async (req, res, next) => {
  const userId = req.params.userId;

  let deletedUser;
  try {
    deletedUser = await User.findById(userId).populate({
      path: "collectionList",
      populate: {
        path: "itemList",
      },
    });
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete user.", 500)
    );
  }

  if (!deletedUser)
    return next(
      new HttpError("Could not find a user for the provided id.", 404)
    );

  if (deletedUser.id.toString() !== req.userData.userId) {
    return next(
      new HttpError("Unathorized person can not delete this user.", 500)
    );
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    deletedUser.collectionList.map(async (collection) => {
      collection.itemList.map(async (item) => {
        await item.remove();
      });
      await collection.remove();
    });
    await deletedUser.remove();
    session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete user.", 500)
    );
  }

  res.status(200).json({ message: "User deleted." });
};

const generateToken = (payload, error = HttpError) => {
  console.log("asafgwe");
  console.log(process.env.JWT_KEY);
  console.log(process.env.DB_NAME);
  console.log(process.env.DB_USER);
  try {
    const token = jwt.sign(payload, process.env.JWT_KEY, {
      expiresIn: "1h",
    });
    return token;
  } catch (err) {
    return next(error);
  }
};

exports.getUserById = getUserById;
exports.login = login;
exports.register = register;
exports.updateProfilePicture = updateProfilePicture;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
