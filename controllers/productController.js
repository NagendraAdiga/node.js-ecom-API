const Product = require("../models/product");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cloudinary = require("cloudinary").v2;
const WhereClause = require("../utils/whereClause");

// user controllers
exports.addProduct = BigPromise(async (req, res, next) => {
  let imagesArray = [];

  if (!req.files) {
    return next(new CustomError("Product images are required", 401));
  }
  if (req.files) {
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products",
        }
      );
      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }

  req.body.photos = imagesArray;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);
  res.status(200).json({
    success: true,
    product,
  });
});

exports.getAllProducts = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;
  const totalProductCount = await Product.countDocuments();
  let productsObj = new WhereClause(Product.find(), req.query)
    .search()
    .filter();
  let products = await productsObj.base.clone();
  const filteredProductCount = products.length;
  productsObj.pager(resultPerPage);
  products = await productsObj.base;

  res.status(200).json({
    success: true,
    products,
    totalProductCount,
    filteredProductCount,
  });
});

exports.getSingleProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError("No product found matching this id", 401));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

exports.addReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;
  const { rating, feedback } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    feedback,
  };
  const product = await Product.findById(productId);
  const hasReviwedAlready = await product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );
  if (hasReviwedAlready) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.rating = rating;
        review.feedback = feedback;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  //   calculate ratings
  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save({ validateBeforeSave: true });
  res.status(200).json({ succes: true });
});

exports.deleteReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;
  const product = await Product.findById(productId);

  const reviews = product.reviews.filter(
    (rev) => rev.user.toString() === req.user._id.toString()
  );
  const numberOfReviews = reviews.length;

  const ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  // update the product
  await Product.findByIdAndUpdate(
    productId,
    {
      ratings,
      numberOfReviews,
      reviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
});

exports.getOnlyReview = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// admin only controllers
exports.adminGetAllProducts = BigPromise(async (req, res, next) => {
  const products = await Product.find({});

  res.status(200).json({
    success: true,
    products,
  });
});

exports.adminUpdateProduct = BigPromise(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  let imagesArray = [];
  if (!product) {
    return next(new CustomError("No product found matching this id", 401));
  }
  if (req.files) {
    //   delete existing images
    for (let index = 0; index < product.photos.length; index++) {
      const result = await cloudinary.uploader.destroy(
        product.photos[index].id
      );
    }
    // upload new images
    for (let index = 0; index < req.files.photos.length; index++) {
      let result = await cloudinary.uploader.upload(
        req.files.photos[index].tempFilePath,
        {
          folder: "products",
        }
      );
      imagesArray.push({
        id: result.public_id,
        secure_url: result.secure_url,
      });
    }
  }
  req.body.photos = imagesArray;
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    product,
  });
});

exports.adminDeleteProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new CustomError("No product found matching this id", 401));
  }
  for (let index = 0; index < product.photos.length; index++) {
    await cloudinary.uploader.destroy(product.photos[index].id);
  }
  await product.remove();
  res.status(200).json({
    success: true,
    message: "Product deleted!",
  });
});
