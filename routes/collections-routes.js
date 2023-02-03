const Router = require("express");
const { check } = require("express-validator");

const collectionsControllers = require("../controllers/collections-controllers");
const {
  checkAuth,
  checkAuthForVisibility,
} = require("../middleware/check-auth");

const fileUpload = require("../middleware/file-upload");

const router = Router();

router.use(checkAuthForVisibility);

router.get("/", collectionsControllers.getAllCollections);

router.get("/:collectionId", collectionsControllers.getCollectionById);

// This route is never used
router.get("/user/:userId", collectionsControllers.getCollectionsByUserId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("description").not().isEmpty(),
    check("visibility").not().isEmpty(),
  ],
  collectionsControllers.createCollection
);

router.patch(
  "/changeCoverPicture/:collectionId",
  fileUpload.single("image"),
  collectionsControllers.updateCoverPicture
);

router.patch(
  "/:collectionId",
  fileUpload.single("image"),
  collectionsControllers.updateCollection
);

router.delete("/:collectionId", collectionsControllers.deleteCollection);

module.exports = router;
