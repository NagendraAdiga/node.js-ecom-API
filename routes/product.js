const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");

const {
  addProduct,
  getAllProducts,
  adminGetAllProducts,
  getSingleProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  addReview,
  deleteReview,
  getOnlyReview,
} = require("../controllers/productController");

// user route
router.route("/products").get(getAllProducts);
router.route("/product/:id").get(getSingleProduct);
router
  .route("/product/review")
  .get(getOnlyReview)
  .put(isLoggedIn, addReview)
  .delete(isLoggedIn, deleteReview);

// admin route
router
  .route("/admin/product/add")
  .post(isLoggedIn, customRole("admin"), addProduct);

router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetAllProducts);

router
  .route("/admin/product/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateProduct)
  .delete(isLoggedIn, customRole("admin"), adminDeleteProduct);

module.exports = router;
