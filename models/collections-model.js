const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const collectionSchema = new Schema({
  name: { type: String, reqired: true },
  creationDate: { type: Date },
  updateDate: { type: Date },
  coverPicture: { type: String, reqired: true },
  description: { type: String, reqired: true },
  visibility: { type: String, reqired: true },
  creator: { type: mongoose.Types.ObjectId, reqired: true, ref: "User" },
  itemList: [{ type: mongoose.Types.ObjectId, ref: "Item" }],
});

module.exports = mongoose.model("Collection", collectionSchema);
