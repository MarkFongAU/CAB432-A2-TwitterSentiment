const twitterAPIKey = require('./config/twitterapiconfig');
const Twitter = require('node-tweet-stream');
const sentiment = require('sentiment');
const dateFormat = require('dateformat');
var AWS = require('aws-sdk');
var s3empty = require("s3-bucket-empty");

// AWS S3 Configurations, Create Bucket and Remove Bucket parameters
AWS.config = new AWS.Config();
AWS.config.loadFromPath('./config/awsconfig.json');
var s3 = new AWS.S3();
var myBucket = 'cab432markfrank'; // Bucket names must be unique across all S3 users
var myRegion = 'us-west-2';
var createBucketParams = {
    Bucket: myBucket,
    CreateBucketConfiguration: {
        LocationConstraint: myRegion
    }
};
var deleteBucketParams = {
    Bucket: myBucket
};

// S3 empty bucket library
const s3Conf = {
    "S3_SECRET": "XxzwOoM2eChrc1toX1p1DKmdL61x5ux+bYuGg0OR",
    "S3_ACCESS_KEY": "AKIAJZW7AU2HQDIOAMVQ",
    "S3_REGION": "us-west-2"
};

// Number of users/ web pages online
var numUsers = 0;

// Tweet Stream Post-sentiment Analysis
var rating;
var color;

// Socket Io connection
module.exports = function (io) {
    // Initial Connection of socket between server and client
    io.on('connection', function (socket) {
        // Setup Credential for Twitter Streams for socket individually
        socket.clientTweet = new Twitter({
            consumer_key: twitterAPIKey.consumer_key,
            consumer_secret: twitterAPIKey.consumer_secret,
            token: twitterAPIKey.access_token_key,
            token_secret: twitterAPIKey.access_token_secret
        });

        // Store multiple Twitter tag/keywords entered by user for socket individually
        socket.searchMultipleTags = [];

        // Determine the connection has been established
        socket.on("connected", function () {
            console.log("User " + socket.id + " is connected");
            numUsers++;
            console.log("User currently online: " + numUsers);
        });

        // Disconnect/Close Connection of socket between server and client when browser close/refresh web page
        socket.on("disconnect", function () {
            // Remove all tags of tweet
            socket.searchMultipleTags.splice(0, socket.searchMultipleTags.length);
            socket.clientTweet.untrackAll();
            console.log("Removing existing tweets for " + socket.id);

            // Indicate user has disconnected
            console.log("User " + socket.id + " disconnected");
            numUsers--;
            if (numUsers < 0) {
                numUsers = 0;
            }
            console.log("User currently online: " + numUsers);

            // If no users are online, remove bucket
            if (numUsers <= 0) {
                // Empty bucket
                s3empty.empty(s3Conf, myBucket).then(function () {
                    console.log("s3empty done by " + socket.id);
                });
            }
        });

        // Create S3 bucket
        socket.on("createBucket", function () {
            // Delay for 5 seconds before checking if bucket has been created
            setTimeout(function () {
                // Create S3 bucket if not existed
                if (!bucketCreated) {
                    s3.createBucket(createBucketParams, function (err, data) {
                        if (err) {
                            console.log(err, err.stack);
                            bucketCreated = true;
                        } else {
                            console.log(socket.id + " successfully created my Bucket" + data);
                            bucketCreated = true;
                        }
                    });
                } else {
                    console.log("Bucket has been created by other socket");
                }
            }, 5000);
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
                socket.clientTweet.track(data);

                // Track the particular tag that has been added
                console.log(socket.id + " added Tags: ", data);

                // Debug the number of tag existed in socket multiple tags
                console.log("Current Number of Tags for " + socket.id + " : ", socket.searchMultipleTags.length);
            }
        });

        // Remove particular tags
        socket.on("removeTagTweet", function (data) {
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (data === socket.searchMultipleTags[i]) {
                    socket.searchMultipleTags.splice(i, i + 1);
                    socket.clientTweet.untrack(data);

                    // Track the particular tag that has been removed
                    console.log(socket.id + " removed Tags: ", data);

                    // Debug the number of tag existed in socket multiple tags
                    console.log("Current Number of Tags for " + socket.id + " : ", socket.searchMultipleTags.length);
                    break;
                }
            }
        });

        // Find and filter the tweet stream
        socket.clientTweet.on('tweet', function (tweet) {
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (tweet.text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                    tweet["topic"] = socket.searchMultipleTags[i];
                    // Store tweet to S3
                    storeTweet(tweet, socket);
                    break;
                }
            }
        });
    });

    // Store tweet in AWS S3 bucket
    function storeTweet(tweet, socket) {
        var stringifyTweet = JSON.stringify(tweet);
        var uniqueKey = socket.id + "-" + tweet.id_str;
        // Push tweet to S3
        var params = {
            Body: stringifyTweet,
            Bucket: myBucket,
            Key: uniqueKey
        };

        s3.putObject(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            }
            else {
                console.log("Successfully stored the data with " + uniqueKey + " : ", data); // successful response

                // Fetch tweet from S3
                retrieveTweet(uniqueKey, socket);
            }
            /*
            data = {
             ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
             VersionId: "Bvq0EDKxOcXLJXNo_Lkz37eM3R4pfzyQ"
            }
            */
        });
    }

    // Retrieve tweet from AWS S3 bucket
    function retrieveTweet(uniqueKey, socket) { // GET ALL ITEMS???
        // get tweet from S3
        var getObjectParams = {
            Bucket: myBucket,
            Key: uniqueKey
        };

        s3.getObject(getObjectParams, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log("Successfully fetched the data with " + uniqueKey + " : ", data.ETag); // successful response
                var tweet = JSON.parse(data.Body.toString());

                // Parse tweet
                ResultOfTweet(tweet, socket);
            }
            /*
            data = {
             AcceptRanges: "bytes",
             ContentLength: 3191,
             ContentType: "image/jpeg",
             ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
             LastModified: <Date Representation>,
             Metadata: {
             },
             TagCount: 2,
             VersionId: "null"
            }
            */
        });
    }

    // Get results of tweet
    function ResultOfTweet(tweet, socket) {
        // Parse tweet
        var profileUrl = "https://twitter.com/" + tweet.user.screen_name;
        var createdTime = tweet.created_at;
        var bannerUrl = tweet.user.profile_banner_url;
        var urlLocation = tweet.user.location;
        var topic = tweet.topic;

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

        var fullText = tweet.text;

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

            // Pass tweet object to the front
            socket.emit("resultTweet", tweetObject);
        });
    }
};