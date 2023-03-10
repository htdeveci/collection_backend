const Router = require("express");
const { check } = require("express-validator");

const itemControllers = require("../controllers/items-controllers");
const {
  checkAuth,
  checkAuthForVisibility,
} = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");

const router = Router();

router.use(checkAuthForVisibility);

router.get("/:itemId", itemControllers.getItemById);

router.get("/collection/:collectionId", itemControllers.getItemsByCollectionId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("description").not().isEmpty(),
    check("collectionId").not().isEmpty(),
    check("visibility").not().isEmpty(),
  ],
  itemControllers.createItem
);

router.patch(
  "/addMedia/:itemId",
  fileUpload.single("image"),
  itemControllers.addMediaToItem
);

router.patch("/favorite/:itemId", itemControllers.toggleItemFavoriteStatus);

router.patch(
  "/:itemId",
  fileUpload.single("image"),
  itemControllers.updateItem
);

router.delete("/:itemId/media/:mediaName", itemControllers.deleteMediaByName);

router.delete("/:itemId", itemControllers.deleteItem);

module.exports = router;
