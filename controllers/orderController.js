const Order = require("../models/order");
const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");

exports.createOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new CustomError("Order not found!", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getCurrentUserOrders = BigPromise(async (req, res, next) => {
  const order = await Order.find({ user: req.user._id });
  if (!order) {
    return next(new CustomError("Order not found!", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// admin route
exports.adminGetAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find({});

  if (!orders) {
    return next(new CustomError("No orders found", 401));
  }
  res.stats(200).json({
    success: true,
    orders,
  });
});

exports.adminUpdateOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(requ.params.orderId);
  if (order.orderStatus === "delivered") {
    return next(new CustomError("Order already has delivered!", 401));
  }
  order.orderStatus = req.body.orderStatus;
  await order.save();
  order.orderItems.forEach(async (prod) => {
    await updateProductStock(prod.product, prod.quantity);
  });
  res.stats(200).json({
    success: true,
  });
});

async function updateProductStock(productId, quantity) {
  const product = await Product.findById(productId);
  product.stock = product.stock - quantity;
  await product.save({ validateBeforeSave: false });
}

exports.adminDeleteOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  order.remove();

  res.status(200).json({
    success: true,
  });
});
