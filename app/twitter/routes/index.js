const express = require('express');
const twitterAPIKey = require('../config');
const Twitter = require('node-tweet-stream');
const sentiment = require('sentiment');
const dateFormat = require('dateformat');
const async = require('async');
const request = require('request');
const viewsPath = __dirname + '/views/';
// var server = require('../app').server;
// var io = require('socket.io')(server);

var router = express.Router();

// Twitter Tag/Keywords
var multiTag = [];
var count = 0;

// Tweet Stream Post-sentiment Analysis
var rating;
var testTweetCount = 0;
var stream;
var color;

// Setup Credential for Twitter
var clientTweet = new Twitter({
    consumer_key: twitterAPIKey.consumer_key,
    consumer_secret: twitterAPIKey.consumer_secret,
    token: twitterAPIKey.access_token_key,
    token_secret: twitterAPIKey.access_token_secret
});

// Router
router.use(function (req, res, next) {
    console.log("Index page: /" + req.method);
    next();
});

// GET home page
router.get('/', function (req, res) {
    console.log("Page load here");
    res.render('index', {});

    // Initial Connection of socket between server and client
    res.io.on('connection', function (socket) {
        // Store multiple tag entered by user
        socket.searchMultipleTags = [];

        // Determine the connection has been established
        console.log("User " + socket.id + " is connected");

        // Disconnect/Close Connection of socket between server and client when browser close/refresh web page
        socket.on('disconnect', function () {
            console.log("User " + socket.id + " disconnected");
            socket.disconnect(0);
        });

        // Search the tweets
        socket.on("searchTagTweet", function (data) {
            var exist = false;

            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (socket.searchMultipleTags[i] === data) {
                    exist = true;
                    break;
                }
            }

            // Add the phrases if it is not existed
            if (!exist) {
                socket.searchMultipleTags.push(data);
                multiTag.push(data);
                clientTweet.track(data);

                // Debug the number of tag existed in socket multiple tags
                console.log(socket.searchMultipleTags.length);
            }
        });

        // Remove particular tags
        socket.on("removeTagTweet", function (data) {
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (data === socket.searchMultipleTags[i]) {
                    socket.searchMultipleTags.splice(i, i + 1);
                    multiTag.splice(i, i + 1);
                    clientTweet.untrack(data);

                    // Track the particular tag that has been removed
                    console.log(data);
                    break;
                }
            }
        });

        // Clear all tag
        socket.on("clearAllTag", function (data) {
            socket.searchMultipleTags = [];
            multiTag = [];
            clientTweet.untrackAll();
        });

        // Find and filter the tweet
        clientTweet.on('tweet', function (tweet) {
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (tweet.text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                    ResultOfTweet(tweet, socket);
                    console.log("it works");
                }
            }
        });
    });
});

//Get results of tweet
function ResultOfTweet(tweet, socket) {
    if (tweet.lang === 'en') {
        var profileUrl = "https://twitter.com/" + tweet.user.screen_name;
        var createdTime = tweet.created_at;
        var url = tweet.user.profile_banner_url;
        var urlLocation = tweet.user.location;

        if (typeof url === 'undefined') {
            url = "https://placehold.it/200x100?text=No Image";
        } else {
            url += "/1500x500";
        }

        if (urlLocation === 'null') {
            urlLocation = "Not Available";
        }

        sentiment(tweet.text, function (err, result) {
            rating = result.score;
        });

        var mood = "";
        var emotion = "";
        if (rating <= -2) {
            mood = "angry";
            emotion = "angry";
            color = "#ff0000";
        } else if (-1 <= rating && rating <= 2) {
            mood = "normal";
            emotion = "normal";
            color = "#ffff00";
        } else if (rating > 2) {
            mood = "happy";
            emotion = "happy";
            color = "#008000";
        }

        createdTime = dateFormat(createdTime, "yyyy-mm-dd h:MM TT");

        var FormattedTweets1 = '<li class = "' + mood + '" id ="' + emotion + '">' +
            '<a href="' + profileUrl + '" target="_blank">' +
            '<img src="' + url + '" style="width: 300px; height:100px"></a>' +
            '<div class="post-info">' +
            '<div class="post-basic-info">' +
            '<img src ="' + tweet.user.profile_image_url + '" style="width:50px; height:50px; float:left; border-radius: 50%">' +
            '<h3><a href="' + profileUrl + '" target="_blank">' +
            tweet.user.name + '</a></h3>' +
            '<span><br/><a href="#">' + createdTime + '<br/><label>' +
            '</label>' + urlLocation + '</a></span>' +
            '<p>' + tweet.text + '</p>' +
            '</div>' +
            '<div class="post-info-rate-share" style="background-color:' + color + '">' +
            '<p5>' + rating + '</p5>' +
            '<div class="rateit"><span></span></div>' +
            '<div class="post-share">' +
            '<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + tweet.user.friends_count + '</span>' +
            '</div>' +
            '<div class="clear"></div>' +
            '</div>' +
            '</div>' +
            '</li>';

        var FormattedTweets = '<div class="col-lg-6 col-md-6 col-sm-6">' +
            '<div class="card">' +
            '<div class="card-body">' +
            '<div class="container">' +
            '<div class="row">' +
            '<div class="col-lg-4 col-md-4 col-sm-4">' +
            '<a href="' + profileUrl + '" target="_blank">' +
            '<img src="' + url + '" class="rounded float-left" alt="No Image" style="height: 100px; width: 100%">' +
            '</a>' +
            '</div>' +
            '<div class="col-lg-8 col-md-8 col-sm-8">' +
            '<img src ="' + tweet.user.profile_image_url + '" style="width:50px; height:50px; float:left; border-radius: 50%">' +
            '<h3><a href="' + profileUrl + '" target="_blank">' +
            tweet.user.name + '</a></h3>' +
            '<span class="fa fa-calendar-o">' + createdTime + '</span>' +
            '<br/>' +
            '<span class="fa fa-map-pin">' + urlLocation + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="row">' +
            '<p>' + tweet.text + '</p>' +
            '</div>' +
            '<div class="row" style="background-color:' + color + '">' +
            '<p5>Rating: ' + rating + '</p5>' +
            '<p5>User friend count: ' + tweet.user.friends_count + '</p5>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        // console.log(tweet.text);
        socket.emit("resultTweet", FormattedTweets);
    }
}

module.exports = router;
