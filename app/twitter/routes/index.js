const express = require('express');
var router = express.Router();

// Router
router.use(function (req, res, next) {
    console.log("Index page: /" + req.method);
    next();
});

// GET home page
router.get('/', function (req, res) {
    console.log("Page load here");
    res.render('index', {});
    // io = res.io;
});

module.exports = router;