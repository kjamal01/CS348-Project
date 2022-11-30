//import express server
const express = require("express");
//start router
const router = express.Router();

const authController = require("../controllers/auth");

//route
router.get("/", authController.signedIn, (req, res) => {
    res.render("index", {
        user: req.user
    });
});

//route
router.get("/register", (req, res) => {
    res.render("register")
});

//route
router.get("/signin", (req, res) => {
    res.render("signin")
});

//route
router.get("/userProfile", authController.listDidRead, (req, res) => {
    if (req.user) {
        res.render("userProfile", {
            user: req.user,
        });
    } else {
        res.redirect("/signin");
    }
});

//listBooks if signed in
router.get("/listBooks", authController.listBooks, (req, res) => {
    if (req.user) {
        res.render("listBooks");
    } else {
        res.redirect("/signin");
    }
});

//Search Books
//Req object contains search string in "text" url, and accessed by req.params.text
router.get("/search/:text", authController.listBooksSearch, (req, res) => {
    console.log("//search/:text: ", req.params);
    if (req.user) {
        res.render("listBooks");
    } else {
        res.redirect("/signin");
    }
});

//Add a favourite book
router.get("/favBooks/:title", authController.favBooks, (req, res) => {
    console.log("/favBooks/:title: ", req.params);
    if (req.user) {
        res.render("listBooks");
    } else {
        res.redirect("/signin");
    }
});

//Clear favourite book
router.get("/deleteFavBook", authController.deleteFavBook, (req, res) => {
    if (req.user) {
        res.redirect("/userProfile");
    } else {
        res.redirect("/signin");
    }
});

//Delete user
router.get("/deleteAccount", authController.signedIn, (req, res) => {
    if (req.user){
        authController.deleteAccount(req.user.id)
        // Signs user out using signout endpoint
        res.redirect("/auth/signout");
    } else {
        res.redirect("/signin");
    }
});

//addDidRead
router.get("/addDidRead/:text", authController.addDidRead, (req, res) => {
    console.log("/addDidRead/:text: ", req.params);
    if (req.user) {
        res.render("listBooks");
    } else {
        res.redirect("/signin");
    }
});

//auth routes

//route post, when submitting a form
//like auth/register
router.post("/auth/listBooks", authController.listBooks);
router.post("/auth/listDidRead", authController.listDidRead);
router.post("/auth/register", authController.register);
router.post("/auth/signin", authController.signin);
router.get("/auth/signout", authController.signout);


module.exports = router;
