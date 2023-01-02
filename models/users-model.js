const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, reqired: true },
  email: { type: String, reqired: true, unique: true },
  password: { type: String, reqired: true, minLength: 6 },
  registerationDate: { type: Date },
  profilePicture: { type: String, reqired: true },
  collectionList: [{ type: mongoose.Types.ObjectId, ref: "Collection" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
