const Router = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");

const router = Router();

router.get("/:userId", usersControllers.getUserById);

router.post("/login", usersControllers.login);

router.post(
  "/register",
  [
    check("username").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.register
);

router.patch(
  "/changePicture/:userId",
  fileUpload.single("image"),
  usersControllers.updateProfilePicture
);

router.patch("/:userId", usersControllers.updateUser);

router.delete("/:userId", usersControllers.deleteUser);

module.exports = router;
