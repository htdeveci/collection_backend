const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Item = require("../models/items-model");
const Collection = require("../models/collections-model");

const getItemById = async (req, res, next) => {
  const itemId = req.params.itemId;

  let item;
  try {
    item = await Item.findById(itemId);
  } catch (err) {
    return next(
      new HttpError("Fetching item failed, please try again later.", 500)
    );
  }

  if (!item) {
    return next(
      new HttpError("Could not find an item for the provided id.", 404)
    );
  }

  res.status(200).json(item.toObject({ getters: true }));
};

const getItemsByCollectionId = async (req, res, next) => {
  const collectionId = req.params.collectionId;

  let items;
  try {
    items = await Item.find({ collectionId });
  } catch (err) {
    return next(
      new HttpError("Fetching items failed, please try again later.", 500)
    );
  }

  if (!items || items.length === 0) {
    return next(
      new HttpError("Could not find an item for the provided id.", 404)
    );
  }

  res
    .status(200)
    .json({ items: items.map((item) => item.toObject({ getters: true })) });
};

const createItem = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );

  const { name, description, collectionId } = req.body;

  let collection;
  try {
    collection = await getCollectionById(collectionId);
  } catch (err) {
    return next(err);
  }

  const createdItem = new Item({
    collectionId,
    name,
    creationDate: new Date(),
    updateDate: new Date(),
    coverPicture: "",
    description,
    mediaList: [],
  });

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdItem.save({ session });
    collection.itemList.push(createdItem);
    await collection.save({ session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating item failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ item: createdItem.toObject({ getters: true }) });
};

const updateItem = async (req, res, next) => {
  const { name, description, collectionId } = req.body;
  const itemId = req.params.itemId;

  let updatedItem;
  try {
    updatedItem = await Item.findById(itemId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update item.", 500)
    );
  }

  if (!updatedItem)
    return next(
      new HttpError("Could not find an item for the provided id.", 404)
    );

  if (name) updatedItem.name = name;
  if (description) updatedItem.description = description;
  updatedItem.updateDate = new Date();

  // This change must be done lastly
  if (collectionId && collectionId !== updatedItem.collectionId.toString()) {
    let oldCollection;
    try {
      oldCollection = await getCollectionById(updatedItem.collectionId);
    } catch (err) {
      return next(err);
    }
    let newCollection;
    try {
      newCollection = await getCollectionById(collectionId);
    } catch (err) {
      return next(err);
    }
    updatedItem.collectionId = collectionId;

    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      await updatedItem.save({ session });
      oldCollection.itemList.pull(updatedItem);
      oldCollection.updateDate = new Date();
      await oldCollection.save({ session });
      newCollection.itemList.push(updatedItem);
      newCollection.updateDate = new Date();
      await newCollection.save({ session });
      await session.commitTransaction();
    } catch (err) {
      return next(
        new HttpError("Something went wrong, could not update item.", 500)
      );
    }
  } else {
    try {
      await updatedItem.save();
    } catch (err) {
      return next(
        new HttpError("Something went wrong, could not update item.", 500)
      );
    }
  }

  res.status(200).json({ item: updatedItem.toObject({ getters: true }) });
};

const deleteItem = async (req, res, next) => {
  const itemId = req.params.itemId;

  let item;
  try {
    item = await Item.findById(itemId).populate("collectionId");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete item.", 500)
    );
  }

  if (!item) throw new HttpError("Could not find an item for that id.", 404);

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await item.remove({ session });
    item.collectionId.itemList.pull(item);
    item.collectionId.updateDate = new Date();
    await item.collectionId.save({ session });
    await session.commitTransaction();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete item.", 500)
    );
  }

  res.status(200).json({ message: "Item deleted." });
};

// This is not an exported function, so this function is not routed.
const getCollectionById = async (collectionId) => {
  let collection;

  try {
    collection = await Collection.findById(collectionId);
  } catch (err) {
    throw new HttpError(
      "Fetching collection failed, please try again later.",
      500
    );
  }

  if (!collection)
    throw new HttpError("Could not find collection for provided id.", 404);

  return collection;
};

exports.getItemById = getItemById;
exports.getItemsByCollectionId = getItemsByCollectionId;
exports.createItem = createItem;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
