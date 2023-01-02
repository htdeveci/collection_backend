const multer = require("multer");
const { v1: uuidv1 } = require("uuid");
const path = require("path");

/* const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
}; */

const fileUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/images");
    },
    filename: (req, file, cb) => {
      const extantion = path.extname(file.originalname);
      cb(null, uuidv1() + "." + extantion);
    },
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!file.mimetype.match(/^image/);
    let error = isValid ? null : new Error("Invalid mime type!");
    cb(error, isValid);
  },
});

module.exports = fileUpload;
