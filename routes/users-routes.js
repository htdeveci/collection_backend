const Router = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const {
  checkAuth,
  checkAuthForVisibility,
} = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");

const router = Router();

router.use(checkAuthForVisibility);

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

router.use(checkAuth);

router.patch(
  "/changePicture/:userId",
  fileUpload.single("image"),
  usersControllers.updateProfilePicture
);

router.patch("/:userId", usersControllers.updateUser);

router.delete("/:userId", usersControllers.deleteUser);

module.exports = router;
