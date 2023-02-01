const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const HttpError = require("../models/http-error");
const Collection = require("../models/collections-model");
const User = require("../models/users-model");

const getAllCollections = async (req, res, next) => {
  let userId = req.userData ? req.userData.userId : null;

  let collections;
  try {
    collections = await Collection.find({
      $or: [{ creator: userId }, { visibility: "everyone" }],
    });
  } catch (err) {
    return next(
      new HttpError("Fetching collections failed, please try again later.", 500)
    );
  }

  res.status(200).json({
    collections: collections.map((collection) =>
      collection.toObject({ getters: true })
    ),
  });
};

const getCollectionById = async (req, res, next) => {
  const collectionId = req.params.collectionId;

  let collection;
  try {
    collection = await Collection.findById(collectionId)
      .populate({ path: "itemList", options: { sort: { creationDate: -1 } } })
      .populate("creator", "username");
  } catch (err) {
    return next(
      new HttpError("Fetching collection failed, please try again later.", 500)
    );
  }

  if (!collection) {
    return next(
      new HttpError("Could not find a collection for the provided id.", 404)
    );
  }

  res.status(200).json(collection.toObject({ getters: true }));
};

const getCollectionsByUserId = async (req, res, next) => {
  const userId = req.params.userId;

  let collections;
  try {
    collections = await Collection.find({ creator: userId }).sort({
      creationDate: -1,
    });
  } catch (err) {
    return next(
      new HttpError("Fetching collections failed, please try again later.", 500)
    );
  }

  if (!collections || collections.length === 0) {
    return next(
      new HttpError(
        "Could not find any collections for the provided user id.",
        404
      )
    );
  }

  res.status(200).json({
    collections: collections.map((collection) =>
      collection.toObject({ getters: true })
    ),
  });
};

const createCollection = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty())
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );

  const { name, description, visibility } = req.body;
  const userId = req.userData.userId;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return next(
      new HttpError("Creating collection failed, please try again later.", 500)
    );
  }

  if (!user)
    return next(new HttpError("Could not find user for provided id.", 404));

  let coverPicture = "";
  if (req.file) coverPicture = req.file.path;
  else
    return next(
      new HttpError("Creating collection failed, please try again later.", 500)
    );

  const createdCollection = new Collection({
    name,
    description,
    visibility,
    creator: userId,
    creationDate: new Date(),
    updateDate: new Date(),
    coverPicture,
  });

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdCollection.save({ session });
    user.collectionList.push(createdCollection);
    await user.save({ session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating collection failed, please try again.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ collection: createdCollection.toObject({ getters: true }) });
};

const updateCoverPicture = async (req, res, next) => {
  const collectionId = req.params.collectionId;

  let updatedCollection;
  try {
    updatedCollection = await Collection.findById(collectionId);
  } catch (err) {
    return next(
      new HttpError(
        "Something went wrong, could not update cover picture.",
        500
      )
    );
  }

  if (!updatedCollection)
    return next(
      new HttpError("Could not find a collection for the provided id.", 404)
    );

  if (updatedCollection.creator.toString() !== req.userData.userId) {
    return next(
      new HttpError("Unathorized person can not update this collection.", 500)
    );
  }

  let oldCoverPicture = updatedCollection.coverPicture;
  updatedCollection.coverPicture = req.file.path;

  try {
    await updatedCollection.save();
  } catch (err) {
    return next(
      new HttpError(
        "Something went wrong, could not update cover picture.",
        500
      )
    );
  }

  if (oldCoverPicture !== "")
    fs.unlink(oldCoverPicture, (err) => {
      if (err) console.log(err);
    });

  res.status(200).json(updatedCollection.toObject({ getters: true }));
};

const updateCollection = async (req, res, next) => {
  const { name, description, visibility } = req.body;
  const collectionId = req.params.collectionId;

  let updatedCollection;
  try {
    updatedCollection = await Collection.findById(collectionId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update collection.", 500)
    );
  }

  if (!updatedCollection)
    return next(
      new HttpError("Could not find a collection for the provided id.", 404)
    );

  if (updatedCollection.creator.toString() !== req.userData.userId) {
    return next(
      new HttpError("Unathorized person can not update this collection.", 500)
    );
  }

  if (name) updatedCollection.name = name;
  if (description) updatedCollection.description = description;
  if (visibility) updatedCollection.visibility = visibility;

  let oldCoverPicture = null;
  if (req.file) {
    oldCoverPicture = updatedCollection.coverPicture;
    updatedCollection.coverPicture = req.file.path;
  }

  updatedCollection.updateDate = new Date();

  try {
    await updatedCollection.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update collection.", 500)
    );
  }

  if (!!oldCoverPicture) {
    fs.unlink(oldCoverPicture, (err) => {
      if (err) console.log(err);
    });
  }

  res
    .status(200)
    .json({ collection: updatedCollection.toObject({ getters: true }) });
};

const deleteCollection = async (req, res, next) => {
  const collectionId = req.params.collectionId;

  let deletedCollection;
  try {
    deletedCollection = await Collection.findById(collectionId)
      .populate("creator")
      .populate("itemList");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete collection.", 500)
    );
  }

  if (!deletedCollection)
    return next(
      new HttpError("Could not find a collection for the provided id.", 404)
    );

  if (deletedCollection.creator.id.toString() !== req.userData.userId) {
    return next(
      new HttpError("Unathorized person can not delete this collection.", 500)
    );
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await deletedCollection.remove({ session });
    deletedCollection.creator.collectionList.pull(deletedCollection);
    await deletedCollection.creator.save({ session });
    deletedCollection.itemList.map(async (item) => await item.remove());
    await session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete collection.", 500)
    );
  }

  if (deletedCollection.coverPicture) {
    fs.unlink(deletedCollection.coverPicture, (err) => {
      if (err) console.log(err);
    });
  }

  deletedCollection.itemList.forEach((item) => {
    item.mediaList.forEach((media) => {
      fs.unlink(media, (err) => {
        if (err) console.log(err);
      });
    });
  });

  res.status(200).json({ message: "Collection deleted." });
};

exports.getAllCollections = getAllCollections;
exports.getCollectionById = getCollectionById;
exports.getCollectionsByUserId = getCollectionsByUserId;
exports.createCollection = createCollection;
exports.updateCoverPicture = updateCoverPicture;
exports.updateCollection = updateCollection;
exports.deleteCollection = deleteCollection;
