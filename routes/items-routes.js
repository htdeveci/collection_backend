const Router = require("express");
const { check } = require("express-validator");

const itemControllers = require("../controllers/items-controllers");

const router = Router();

router.get("/:itemId", itemControllers.getItemById);

router.get("/collection/:collectionId", itemControllers.getItemsByCollectionId);

router.post(
  "/",
  [
    check("name").not().isEmpty(),
    check("description").not().isEmpty(),
    check("collectionId").not().isEmpty(),
  ],
  itemControllers.createItem
);

router.patch("/:itemId", itemControllers.updateItem);

router.delete("/:itemId", itemControllers.deleteItem);

module.exports = router;
