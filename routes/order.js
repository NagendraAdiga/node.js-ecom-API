const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");

const {
  createOrder,
  getOneOrder,
  getCurrentUserOrders,
  adminGetAllOrders,
  adminUpdateOneOrder,
  adminDeleteOneOrder,
} = require("../controllers/orderController");

router.route("/order/create").post(isLoggedIn, createOrder);
router.route("/order/myorder").get(isLoggedIn, getCurrentUserOrders);
router.route("/order/:orderId").get(isLoggedIn, getOneOrder);

router
  .route("/admin/orders")
  .get(isLoggedIn, customRole("admin"), adminGetAllOrders);
router
  .route("admin/order/:orderId")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneOrder)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneOrder);

module.exports = router;
