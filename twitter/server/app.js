var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var viewsPath = __dirname + '/views/';
var index = require('./routes/index');
var app = express();
var server = require('http').Server(app);

// Client side body and cookie parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Web page routing
app.use('/',index); // Direct to routes/index.js

module.exports = {app: app, server: server};