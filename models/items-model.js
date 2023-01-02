const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, reqired: true },
  creationDate: { type: Date },
  updateDate: { type: Date },
  coverPicture: { type: String, reqired: true },
  description: { type: String, reqired: true },
  mediaList: [{ type: String }],
  collectionId: {
    type: mongoose.Types.ObjectId,
    reqired: true,
    ref: "Collection",
  },
});

module.exports = mongoose.model("Item", itemSchema);
