const Router = require("express");
const { check } = require("express-validator");

const collectionsControllers = require("../controllers/collections-controllers");
const checkAuth = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");

const router = Router();

router.get("/", collectionsControllers.getAllCollections);

router.get("/:collectionId", collectionsControllers.getCollectionById);

router.get("/user/:userId", collectionsControllers.getCollectionsByUserId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [check("name").not().isEmpty(), check("description").not().isEmpty()],
  collectionsControllers.createCollection
);

router.patch("/:collectionId", collectionsControllers.updateCollection);

router.delete("/:collectionId", collectionsControllers.deleteCollection);

module.exports = router;
