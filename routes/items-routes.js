const Router = require("express");
const { check } = require("express-validator");

const itemControllers = require("../controllers/items-controllers");
const checkAuth = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");

const router = Router();

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
  ],
  itemControllers.createItem
);

router.patch(
  "/:itemId",
  fileUpload.single("image"),
  itemControllers.updateItem
);

router.delete("/:itemId", itemControllers.deleteItem);

module.exports = router;
