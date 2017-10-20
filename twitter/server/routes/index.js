const express = require('express');
const sentiment = require('sentiment');
const dateFormat = require('dateformat');
const AWS = require('aws-sdk');
var router = express.Router();

// AWS DynamoDB Configurations
AWS.config = new AWS.Config();
AWS.config.loadFromPath('./config/awsconfig.json');
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var tableName = 'cab432tweetstream'; // DynamoDB Table Name

// Tweet Stream Post-sentiment Analysis
var rating;
var color;

// Router
router.use(function (req, res, next) {
    console.log("Twitter Stream Incoming: /" + req.method);
    next();
});

// GET health check
router.get('/', function (req, res) {
    console.log("AWS Load Balancer Health Check here");
});

// Receive POST from twitter stream
router.post('/', function (req, res) {
    ParseRawTweet(req.body);

    // Parsing of raw tweet
    function ParseRawTweet(tweet) {
        // Parse tweet
        var profileUrl = "https://twitter.com/" + tweet.user.screen_name;
        var createdTime = tweet.created_at;
        var bannerUrl = tweet.user.profile_banner_url;
        var urlLocation = tweet.user.location;
        var fullText = "";

        // Set tweet banner
        if (typeof bannerUrl === 'undefined') {
            bannerUrl = "https://placehold.it/200x100?text=No Image";
        } else {
            bannerUrl += "/1500x500";
        }

        // Check if tweet has location
        if (urlLocation === 'null') {
            urlLocation = "Not Available";
        }

        // Take the longest tweet text
        if (tweet.hasOwnProperty('extended_tweet')) {
            fullText = tweet.extended_tweet.full_text;
        } else if (tweet.hasOwnProperty('retweeted_status')) {
            fullText = tweet.retweeted_status.text;
        } else {
            fullText = tweet.text;
        }

        // Sentiment Analysis on tweet
        sentiment(fullText, function (err, result) {
            // Get storing time
            var storedTime = new Date();
            var storedTimeGetTime = storedTime.getTime().toString();

            // Assign rating
            rating = result.score;

            // Determine sentiment
            var emotion = "";
            if (rating < 0) {
                emotion = "negative";
                color = "#ff1100";
            } else if (rating === 0) {
                emotion = "neutral";
                color = "#fffd00";
            } else if (rating > 0) {
                emotion = "positive";
                color = "#00c869";
            }

            // Format tweet created time
            createdTime = dateFormat(createdTime, "yyyy-mm-dd h:MM TT");

            var tweetObject = {
                id: tweet.id_str,
                userName: tweet.user.name,
                screenName: tweet.user.screen_name,
                profileUrl: profileUrl,
                profileImageUrl: tweet.user.profile_image_url,
                createdTime: createdTime,
                bannerUrl: bannerUrl,
                urlLocation: urlLocation,
                text: fullText,
                rating: rating,
                color: color,
                emotion: emotion,
                friendCount: tweet.user.friends_count
            };

            console.log(storedTimeGetTime);
            // Store tweet
            storeTweet(tweetObject, storedTimeGetTime);
        });
    }

    // Store processed tweet in DynamoDB, one tweet per call
    function storeTweet(tweetObject, storedTimeGetTime) {
        var params = {
            TableName: tableName,
            Item: {
                "tweet_id": tweetObject.id,
                "stored_time": storedTimeGetTime,
                "dummy_attribute": "dummy",
                "object": tweetObject
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.log(err); // an error occurred
            } else {
                console.log("Successfully stored the JSON with " + tweetObject.id + " at " + storedTimeGetTime + " : ", data); // successful response
            }
        });
    }
});

module.exports = router;