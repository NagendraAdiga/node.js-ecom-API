const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");
const user = require("../models/user");

exports.signup = BigPromise(async (req, res, next) => {
  if (!req.files) {
    return next(new CustomError("Photo is required!", 400));
  }

  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError("Name, email and password are required", 400));
  }

  let file = req.files.photo;

  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  // check values are there or not
  if (!email || !password) {
    return next(new CustomError("Both email and passwords required!", 400));
  }

  // get user from DB
  const user = await User.findOne({ email }).select("+password");

  // if user not exists
  if (!user) {
    return next(new CustomError("Email and password do not match", 400));
  }

  // validate password
  const isValidPwd = await user.isValidPassword(password);
  if (!isValidPwd) {
    return next(new CustomError("Email and password do not match", 400));
  }

  // generate token and return response
  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "logout successful",
  });
});

// send email to change password
exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // if user not found
  if (!user) {
    return next(new CustomError("Invalid email Id provided!", 400));
  }

  // generate password reset token
  const forgotToken = user.getForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  // http://localhost:4000/password/reset/:token
  const myUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;
  const message = `Use this link to reset your password \n\n${myUrl}`;

  // send email
  try {
    await mailHelper({
      toEmail: user.email,
      subject: "Nags TStore - Password Reset",
      message,
      url: myUrl,
    });
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.save({ validateBeforeSave: false });

    return next(new CustomError(error, 500));
  }
});

// change password if user forgot the old password
exports.resetPassword = BigPromise(async (req, res, next) => {
  const token = req.params.token;

  const encryToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("Token is invalid or has expired!", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError("Password and confirm password do not match!", 400)
    );
  }

  user.password = req.body.password;

  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save({ validateBeforeSave: false });
  cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    user,
  });
});

// if the user wants to update the password
exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("+password");

  const isValidOldPassword = await user.isValidPassword(req.body.oldPassword);
  if (!isValidOldPassword) {
    return next(new CustomError("Invalid old password", 400));
  }
  user.password = req.body.newPassword;
  await user.save({ validateBeforeSave: false });

  cookieToken(user, res);
});

exports.updateUserProfile = BigPromise(async (req, res, next) => {
  if (!req.body.name || !req.body.email) {
    return next(new CustomError("Both email and name reuired", 400));
  }

  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  if (req.files) {
    if (req.files.photo) {
      const user = await User.findById(req.user.id);
      const imageId = user.photo.id;

      // delete old photo from cloudinary
      const resp = cloudinary.v2.uploader.destroy(imageId);

      // upload new photo
      const file = req.files.photo;
      const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: "users",
        width: 150,
        crop: "scale",
      });

      newData.photo = {
        id: result.public_id,
        secure_url: result.secure_url,
      };
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  if (!user) {
    return next(new CustomError("Update failed", 500));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

// for admin only
exports.adminGetAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

exports.adminGetSignleUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomError("No user found", 400));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateUser = BigPromise(async (req, res, next) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({ success: true });
});

exports.adminDeleteUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new CustomError("User not found!", 401));
  }
  // delete photo on cloudinary
  const imageId = user.photo.id;
  await cloudinary.v2.uploader.destroy(imageId);
  // delete the user
  await user.remove();
  res.status(200).json({
    success: true,
  });
});

exports.managerGetAllUsers = BigPromise(async (req, res, next) => {
  let users = await User.find({ role: "user" });
  for (item in users) {
    users[item].role = undefined;
    users[item].createdAt = undefined;
    users[item].__v = undefined;
    users[item].photo = undefined;
  }
  res.json({
    users,
  });
});
