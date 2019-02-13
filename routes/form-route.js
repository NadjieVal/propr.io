const express = require("express");
const User = require("../models/user-model.js");
const Tenant = require("../models/tenant-model.js");
const Property = require("../models/property-model.js");
const router = express.Router();
const bcrypt = require("bcrypt");
const bcryptSalt = 10;
const fileUploader = require("../config/file-upload.js");

/* SIGNUP Page */

router.get("/signup", (req, res, next) => {
  res.render("forms/signup.hbs");
});

router.post(
  "/process-signup",
  fileUploader.single("profilePhoto"),
  (req, res, next) => {
    const { firstName, lastName, confirmPassword, role, phone } = req.body;

    var useremail = req.body.email;
    var userpass = req.body.originalPassword;

    if (confirmPassword !== userpass) {
      res.render("forms/signup.hbs", {
        errorMessage: "Please check the spelling of your password."
      });
      return;
    }

    if (useremail === "" || userpass === "") {
      res.render("forms/signup.hbs", {
        errorMessage: "Please fill all form fields to sign up."
      });
      return;
    }

    User.findOne({ email: useremail }, "email", (err, user) => {
      if (user !== null) {
        res.render("forms/signup.hbs", {
          errorMessage: "This email already exists in our system."
        });
        return;
      }

      const profilePhoto = req.file.secure_url;
      var salt = bcrypt.genSaltSync(bcryptSalt);
      var encryptedPassword = bcrypt.hashSync(userpass, salt);

      var newUser = User({
        firstName,
        lastName,
        email: useremail,
        encryptedPassword,
        role,
        phone,
        profilePhoto
      });

      newUser
        .save()
        .then(() => {
          console.log("User created");
          res.redirect("/properties");
        })
        .catch(err => next(err));
    });
  }
);

/* LOGIN Page */

router.get("/login", (req, res, next) => {
  res.render("index.hbs");
});

router.post("/process-login", (req, res, next) => {
  const { email, originalPassword } = req.body;
  User.findOne({
    email: { $eq: email }
  })
    .then(userDoc => {
      if (!userDoc) {
        req.flash("error", "Email is incorrect. 🤦🏾‍♂️");
        res.redirect("/login");
        return;
      }

      const { encryptedPassword } = userDoc;
      if (!bcrypt.compareSync(originalPassword, encryptedPassword)) {
        req.flash("error", "Password is incorrect. 🤦🏾‍♂️");
        res.redirect("/login");
        return;
      }
      req.logIn(userDoc, () => {
        req.flash("success", "Log in success! 😎");
        res.redirect("/properties");
      });
    })
    .catch(err => next(err));
});

module.exports = router;

/*  LOG OUT page */

router.get("/process-logout", (req, res, next) => {
  req.logOut();
  req.flash("success", "Logged out successfully! 🙋‍");
  res.redirect("/");
});

/*  ADD PROPERTY page */
router.get("/add-property", (req, res, next) => {
  res.render("forms/add-property.hbs");
});

router.get("/process-add-property", (req, res, next) => {
  res.render("forms/add-property.hbs");
});

/*  EDIT PROFILE page */
router.get("/edit-profile", (req, res, next) => {
  res.render("forms/edit-profile.hbs");
});

router.post("/process-edit-profile", (req, res, next) => {
  const { userId } = req.params;
  const { firstName, lastName, confirmPassword, role, phone } = req.body;
  var useremail = req.body.email;
  const profilePhoto = req.file.secure_url;
  var userpass = req.body.originalPassword;

  User.findByIdAndUpdate(
    userId,
    {
      $push: {
        firstName,
        lastName,
        confirmPassword,
        role,
        phone,
        profilePhoto,
        email
      }
    },
    { runValidators: true }
  )
    .then(userId => {
      if (useremail === "" || userpass === "") {
        res.render("forms/signup.hbs", {
          errorMessage: "Please fill all form fields to sign up."
        });
        return;
      }

      res.redirect(`/properties`);
    })
    .catch(err => next(err));
});
