const User = require("../models/user.js");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { errorHandler } = require("../utils/error.js");

// Test Route
const test = (req, res) => {
  res.json({
    message: "Hello, this is from Auth router",
  });
};

// Sign-In Controller
const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User Not Found!"));

    const isBlocked = validUser.isBlocked;
    if(isBlocked) return next(errorHandler(401, "User is blocked!"));
    // Check if the password is correct
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Wrong credentials!"));

    // Generate JWT token
    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const { password: pass, ...rest } = validUser._doc;

    // Set the token in a cookie and respond with user data
    res
      .cookie("access_token", token, { 
        sameSite: 'None',
        secure: true,
        httpOnly: true,
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// Get Current User Controller
const getCurrentUser = async (req, res, next) => {
  try {
    // Find the user by ID
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return next(errorHandler(404, "User not found!"));
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};


// SignOut Controller
const signOut = async (req, res, next) => {
  try {
    // Clear the access token cookie and respond with a success message
    res
      .clearCookie("access_token", {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
        path: '/',
      })
      .status(202)
      .send("User has been logged out!");
  } catch (error) {
    next(error);
  }
};

module.exports = { test, signIn, getCurrentUser, signOut };
