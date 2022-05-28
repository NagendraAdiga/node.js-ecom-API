const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    maxlength: [40, "Name should be under 40 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide a email"],
    validate: [validator.isEmail, "Please enter valid email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password should be atleast 6 characters"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  photo: {
    id: {
      type: String,
      required: true,
    },
    secure_url: {
      type: String,
      required: true,
    },
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// encrypt password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// validte password with the current password, passed by the user
userSchema.methods.isValidPassword = async function (currentPassword) {
  return await bcrypt.compare(currentPassword, this.password);
};

// generate and return jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

// generate and return forgot password token
userSchema.methods.getForgotPasswordToken = function () {
  // generate long random string
  const forgotPwdToken = crypto.randomBytes(20).toString("hex");

  //getting hashed token
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotPwdToken)
    .digest("hex");

  // token expiry
  this.forgotPasswordExpiry = Date.now() + 10 * 60 * 1000;

  return forgotPwdToken;
};

module.exports = mongoose.model("User", userSchema);
