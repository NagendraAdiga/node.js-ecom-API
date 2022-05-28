const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/user");

const {
  getStripeKey,
  getRazorpayKey,
  captureStripePayment,
  captureRazorpayPayment,
} = require("../controllers/paymentController");

router.route("/stripekey").get(isLoggedIn, getStripeKey);
router.route("/razorpaykey").get(isLoggedIn, getRazorpayKey);

router.route("/capturestripe").post(isLoggedIn, captureStripePayment);
router.route("/capturerazorpay").post(isLoggedIn, captureRazorpayPayment);

module.exports = router;
