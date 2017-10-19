const Twit = require('twit');
const sentiment = require('sentiment');
const dateFormat = require('dateformat');
const AWS = require('aws-sdk');
var events = require('events');
var serverEmitter = new events.EventEmitter();

// AWS DynamoDB Configurations
AWS.config = new AWS.Config();
AWS.config.loadFromPath('./config/awsconfig.json');
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var tableName = 'cab432tweetstream'; // DynamoDB Table Name

// Twit Configuration
var T = new Twit({
    consumer_key: 'NlOMNwv4bL201ZwN7yJShtHOa',
    consumer_secret: 'rcAAXY6LbOruQlBTWskxhZ8N5SNrII1Tm6MVsEp1vas63t23Xb',
    access_token: '2315083052-zojLYhSLN4DE3Z87np9sp8eyk7X8ZoDGTmEqkPB',
    access_token_secret: 'tWgaps1lklk8Ax707dqK8c7P1kcyj0CYObg1oEuHO7h71'
});

// Twit Stream
var stream = T.stream('statuses/filter', {
    track: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'
        , 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'], language: 'en'
});

// Number of users/ web pages online
var numUsers = 0;

// Tweet Stream Post-sentiment Analysis
var rating;
var color;

// Socket Io connection
module.exports = function (io) {
    // Get socket via socket id
    var namespace = null;
    var ns = io.of(namespace || "/");

    // Stream the tweets from Twitter via Twit Stream
    stream.on('tweet', function (tweet) {
        // console.log("Tweets coming in");
        // Emits to the server itself
        serverEmitter.emit("tweetStream", tweet);
    });

    // Twit Stream Limit message
    stream.on('limit', function (limitMessage) {
        console.log(limitMessage);
    });

    // Twit Stream Disconnect message
    stream.on('disconnect', function (disconnectMessage) {
        console.log(disconnectMessage);
    });

    // Initial Connection of socket between server and client
    io.on('connection', function (socket) {
        // Store multiple Twitter tag/keywords entered by user for socket individually
        socket.searchMultipleTags = [];

        // Determine the connection has been established
        socket.on("connected", function () {
            console.log("User " + socket.id + " is connected");
            numUsers++;
            console.log("Users currently online: " + numUsers);
        });

        // Disconnect/Close Connection of socket between server and client when browser close/refresh web page
        socket.on("disconnect", function () {
            // If something inside socket tags
            if (socket.searchMultipleTags.length !== 0) {
                // Remove all tags in this particular socket
                console.log("Tags for " + socket.id + " ", socket.searchMultipleTags);
                socket.searchMultipleTags.splice(0, socket.searchMultipleTags.length);
                console.log("Updated of Tags for " + socket.id + " ", socket.searchMultipleTags);
            }

            // Indicate user has disconnected
            console.log("User " + socket.id + " disconnected");
            numUsers--;
            if (numUsers < 0) {
                numUsers = 0;
            }
            console.log("Users currently online: " + numUsers);
        });

        // Search the tweets
        socket.on("searchTagTweet", function (data) {
            // Check if tag needs to be added
            var exist = false;

            // Loop through the socket tags
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (socket.searchMultipleTags[i] === data) {
                    exist = true;
                    break;
                }
            }

            // Add the phrases if it is not existed
            if (!exist) {
                // Add tag in this particular socket
                console.log("Tags for " + socket.id + " ", socket.searchMultipleTags);
                socket.searchMultipleTags.push(data);
                console.log("Updated of Tags for " + socket.id + " ", socket.searchMultipleTags);
            }
        });

        // Remove particular tags
        socket.on("removeTagTweet", function (data) {
            // Loop through the socket tags
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (data === socket.searchMultipleTags[i]) {
                    // Remove tags in this particular socket
                    console.log("Tags for " + socket.id + " ", socket.searchMultipleTags);
                    socket.searchMultipleTags.splice(i, i + 1);
                    console.log("Updated of Tags for " + socket.id + " ", socket.searchMultipleTags);

                    break;
                }
            }
        });

        // Get tweet stream
        serverEmitter.on("tweetStream", function (tweet) {
            // Categories the type of tweet
            if (tweet.hasOwnProperty('extended_tweet')) {
                if (tweet.extended_tweet.full_text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                    console.log("Topic running: ", socket.searchMultipleTags[i]);

                    // Parse the tweets
                    ParseRawTweet(tweet, tweet.extended_tweet.full_text, socket.id, socket.searchMultipleTags[i]);
                }
            } else if (tweet.hasOwnProperty('retweeted_status')) {
                for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                    if (tweet.retweeted_status.text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                        console.log("Topic running: ", socket.searchMultipleTags[i]);

                        // Parse the tweets
                        ParseRawTweet(tweet, tweet.retweeted_status.text, socket.id, socket.searchMultipleTags[i]);
                    }
                }
            } else {
                for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                    if (tweet.text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                        console.log("Topic running: ", socket.searchMultipleTags[i]);

                        // Parse the tweets
                        ParseRawTweet(tweet, tweet.text, socket.id, socket.searchMultipleTags[i]);
                    }
                }
            }
        });
    });

    // Parsing of raw tweet
    function ParseRawTweet(tweet, text, socket_id, topic) {
        // Parse tweet
        var profileUrl = "https://twitter.com/" + tweet.user.screen_name;
        var createdTime = tweet.created_at;
        var bannerUrl = tweet.user.profile_banner_url;
        var urlLocation = tweet.user.location;

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

        var fullText = text;

        // Sentiment Analysis on tweet
        sentiment(fullText, function (err, result) {
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
                friendCount: tweet.user.friends_count,
                topic: topic
            };

            // Store tweet
            storeTweet(tweetObject, socket_id);
        });
    }

    // Store processed tweet in DynamoDB, one tweet per call
    function storeTweet(tweetObject, socket_id) {
        var params = {
            TableName: tableName,
            Item: {
                "tweet_id": tweetObject.id,
                "object": tweetObject
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.log(err); // an error occurred
            } else {
                // console.log("Successfully stored the JSON with " + tweetObject.id + " : ", data); // successful response
                retrieveTweet(tweetObject.id, socket_id);
            }
        });
    }

    // Retrieve tweet from AWS Dynamo DB, one tweet per call
    function retrieveTweet(id, socket_id) {
        var params = {
            TableName: tableName,
            Key: {
                "tweet_id": id
            }
        };
        docClient.get(params, function (err, data) {
            if (err) {
                console.log(err); // an error occurred
            } else {
                // console.log("Successfully get the JSON with " + id + " : ", data); // successful response
                DisplayOfTweet(data.Item.object, socket_id);
            }
        });
    }

    // Display of tweet
    function DisplayOfTweet(tweetObject, socket_id) {
        // Get id of the socket
        var socket = ns.connected[socket_id];

        // Sometimes user will disconnect when the tweet is emit to the front
        // and the socket becomes null/undefined
        if (socket) { // Check if socket still exist
            console.log("Display socket:", socket.id);
            console.log("Topic :", tweetObject.topic);

            // Pass tweet object to the front
            socket.emit("resultTweet", tweetObject);
        }
    }
};