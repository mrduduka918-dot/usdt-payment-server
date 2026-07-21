const express = require("express");

const router = express.Router();

router.get("/signup", (req, res) => {

    res.sendFile(require("path").join(__dirname, "../public/signup.html"));

});

router.get("/login", (req, res) => {

    res.sendFile(require("path").join(__dirname, "../public/login.html"));

});

module.exports = router;
