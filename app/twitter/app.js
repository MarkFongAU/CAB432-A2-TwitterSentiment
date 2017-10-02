var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var index = require('./routes/index');
var info = require('./routes/info');
var result = require('./routes/result');
var viewsPath = __dirname + '/views/';
var app = express();

// EJS View engine setup, which will look into the folder "views"
app.set('view engine', 'ejs');

// Client side body and cookie parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Libraries link (used for web page aesthetics)
app.use('/vendor', express.static(path.join(__dirname, 'vendor'))); // redirect to Vendor's libraries folder
app.use('/css', express.static(path.join(__dirname, 'css'))); // redirect to my custom css folder
app.use('/js', express.static(path.join(__dirname, 'js'))); // redirect to my custom js folder

// Web page routing
app.use('/result',result); // Direct to routes/result.js
app.use('/info', info); // Direct to routes/info.js
app.use('/',index); // Direct to routes/index.js

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error Handler
app.use(function(err, req, res, next) {
    // Set Locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.sendFile(viewsPath + "404.html");
});

module.exports = app;
