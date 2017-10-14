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
var myKey = 'myBucketKey';
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

var bucketCreated = false;

// Number of users/ web pages online
var numUsers = 0;

// Twitter Tag/Keywords
var multiTag = [];

// Tweet Stream Post-sentiment Analysis
var rating;
var color;

// Setup Credential for Twitter Streams
var clientTweet = new Twitter({
    consumer_key: twitterAPIKey.consumer_key,
    consumer_secret: twitterAPIKey.consumer_secret,
    token: twitterAPIKey.access_token_key,
    token_secret: twitterAPIKey.access_token_secret
});

// Socket Io connection
module.exports = function (io) {
    // Initial Connection of socket between server and client
    io.on('connection', function (socket) {
        // Determine the connection has been established
        socket.on("connected", function () {
            console.log("User " + socket.id + " is connected");
            numUsers++;
            console.log("User currently online: " + numUsers);
            console.log("Bucket status: " + bucketCreated);

            // For the succeeding web page connected, pull the tweet stored from AWS S3
            if (numUsers > 1) {
                // Pull tweet from S3 bucket
                retrieveTweet(socket);
            }
        });

        // Disconnect/Close Connection of socket between server and client when browser close/refresh web page
        socket.on("disconnect", function () {
            console.log("User " + socket.id + " disconnected");
            numUsers--;
            if (numUsers < 0) {
                numUsers = 0;
            }
            console.log("User currently online: " + numUsers);

            // If no users are online, remove bucket
            if (numUsers <= 0) {
                s3empty.empty(s3Conf, myBucket).then(function () {
                    console.log('s3empty done');

                    s3.deleteBucket(deleteBucketParams, function (err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                        } else {
                            console.log("Successfully removed Bucket" + data); // successful response
                            bucketCreated = false;
                            console.log("Bucket status: " + bucketCreated);
                        }
                    });
                });
            }
            // if (bucketCreated) {
            // Need to remove all the item within the bucket first
            // CONTINUE HERE
            // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

            // list tweet from S3, ma
            // var listObjectParams = {
            //     Bucket: myBucket
            //     // MaxKeys: 1000
            // };
            // s3.listObjectsV2(listObjectParams, function (err, data) {
            //     if (err) {
            //         console.log(err, err.stack); // an error occurred
            //     } else {
            //         console.log("Successfully list the objects: ", data); // successful response
            //         for (var i = 0; i < data.Contents.length; i++) {
            //             var deleteObjectParams = {
            //                 Bucket: myBucket,
            //                 Key: data.Contents[i].Key
            //             };
            //             s3.deleteObject(deleteObjectParams, function (err, data) {
            //                 if (err) {
            //                     console.log(err, err.stack); // an error occurred
            //                 } else {
            //                     console.log(data); // successful response
            //                 }
            //                 /*
            //                 data = {
            //                 }
            //                 */
            //             });
            //         }
            //     }
            // });
        });

        // Create S3 bucket
        socket.on("createBucket", function () {
            // Delay for 3 seconds before checking if bucket has been created
            setTimeout(function () {
                // Create S3 bucket if not existed
                if (!bucketCreated) {
                    s3.createBucket(createBucketParams, function (err, data) {
                        if (err) {
                            console.log(err, err.stack);
                        } else {
                            console.log("Successfully created my Bucket" + data);
                            bucketCreated = true;
                        }
                    });
                } else {
                    console.log("Bucket has been created");
                }
            }, 3000);
        });

        // Store multiple tag entered by user
        socket.searchMultipleTags = [];

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
                console.log("Current Number of Tags: ", socket.searchMultipleTags.length);
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
                    console.log("Removed Tags: ", data);
                    break;
                }
            }
        });

        // Clear all tag
        socket.on("clearAllTag", function (data) {
            // socket.searchMultipleTags = [];
            // multiTag = [];
            socket.searchMultipleTags.splice(0, socket.searchMultipleTags.length);
            multiTag.splice(0, multiTag.length);
            clientTweet.untrackAll();
        });

        // // Fetch tweets from AWS S3
        // socket.on("fetchTweet", function (data) {
        //     socket.searchMultipleTags = [];
        //     multiTag = [];
        //     clientTweet.untrackAll();
        // });

        // Find and filter the tweet stream
        clientTweet.on('tweet', function (tweet) {
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (tweet.text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                    tweet["topic"] = socket.searchMultipleTags[i];
                    // Store tweet to S3
                    storeTweet(tweet, socket);
                    break;

                    // // Fetch tweet from S3
                    // retrieveTweet(tweet.id_str, socket);

                    // // Parse tweet
                    // ResultOfTweet(tweet, socket);
                    // console.log("It works");
                }
            }
        });
    });

    // Store tweet in AWS S3 bucket
    function storeTweet(tweet, socket) {
        var stringifyTweet = JSON.stringify(tweet);
        // Push tweet to S3
        var params = {
            Body: stringifyTweet,
            Bucket: myBucket,
            Key: tweet.id_str
        };

        s3.putObject(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            }
            else {
                console.log("Successfully stored the data: ", data); // successful response

                // Fetch tweet from S3
                retrieveTweet(tweet.id_str, socket);
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
    function retrieveTweet(tweet_id, socket) { // GET ALL ITEMS???
        // get tweet from S3
        var getObjectParams = {
            Bucket: myBucket,
            Key: tweet_id
        };

        s3.getObject(getObjectParams, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log("Successfully fetched the data: ", data); // successful response
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
        if (tweet.lang === 'en') {
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

            // Sentiment Analysis on tweet
            sentiment(tweet.text, function (err, result) {
                rating = result.score;

                var mood = "";
                var emotion = "";
                if (rating < 0) {
                    mood = "negative";
                    emotion = "negative";
                    color = "#ff1100";
                } else if (rating === 0) {
                    mood = "neutral";
                    emotion = "neutral";
                    color = "#fffd00";
                } else if (rating > 0) {
                    mood = "positive";
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
                    text: tweet.text,
                    rating: rating,
                    color: color,
                    emotion: emotion,
                    friendCount: tweet.user.friends_count,
                    topic : topic
                };

                // console.log(tweet.text);
                socket.emit("resultTweet", tweetObject);
            });
        }
    }
};