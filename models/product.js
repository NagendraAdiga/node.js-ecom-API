const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide product name"],
    trim: true,
    maxlength: [120, "Product name shouldn't exceed 120"],
  },
  price: {
    type: Number,
    required: true,
    maxlength: [5, "Price shouldn't be more than 5 digits"],
  },
  description: {
    type: String,
    required: [true, "Please provide description for the product"],
  },
  photos: [
    {
      id: {
        type: String,
        required: true,
      },
      secure_url: {
        type: String,
        required: true,
      },
    },
  ],
  category: {
    type: String,
    required: [
      true,
      "Please select a category from - short-sleeves, long-sleeves, sweat-shirts, hoodies",
    ],
    enum: {
      values: ["shortsleeves", "longsleeves", "sweatshirts", "hoodies"],
      message:
        "Please select category only from short-sleeves, long-sleeves, sweat-shirts and hoodies",
    },
  },
  stock: {
    type: Number,
    required: [true, "please add stock count"],
  },
  brand: {
    type: String,
    required: [true, "Please add a brand for the product"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      feedback: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
