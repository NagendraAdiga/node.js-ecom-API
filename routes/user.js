const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getLoggedInUserDetails,
  changePassword,
  updateUserProfile,
  adminGetAllUsers,
  managerGetAllUsers,
  adminGetSignleUser,
  adminUpdateUser,
  adminDeleteUser,
} = require("../controllers/userController");
const { isLoggedIn, customRole } = require("../middlewares/user");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgotPassword").post(forgotPassword);
router.route("/password/reset/:token").post(resetPassword);
router.route("/userdashboard").get(isLoggedIn, getLoggedInUserDetails);
router.route("/password/update").post(isLoggedIn, changePassword);
router.route("/userdashboard/update").post(isLoggedIn, updateUserProfile);

// admin only routes
router
  .route("/admin/users")
  .get(isLoggedIn, customRole("admin"), adminGetAllUsers);

router
  .route("/admin/user/:id")
  .get(isLoggedIn, customRole("admin"), adminGetSignleUser)
  .put(isLoggedIn, customRole("admin"), adminUpdateUser)
  .delete(isLoggedIn, customRole("admin"), adminDeleteUser);

// manager only routes
router
  .route("/manager/users")
  .get(isLoggedIn, customRole("manager"), managerGetAllUsers);
module.exports = router;
