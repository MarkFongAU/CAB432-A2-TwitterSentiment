const twitterAPIKey = require('./config/twitterapiconfig');
const Twitter = require('node-tweet-stream');
const sentiment = require('sentiment');
const dateFormat = require('dateformat');
var AWS = require('aws-sdk');

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
    // io.sockets.on('connection', function (socket) {
    //     socket.on('captain', function(data) {
    //         console.log(data);
    //         socket.emit('Hello');
    //     });
    // });

    // Initial Connection of socket between server and client
    io.on('connection', function (socket) {
        // Determine the connection has been established
        console.log("User " + socket.id + " is connected");
        numUsers++;

        // If at least one user is online, create bucket
        if (numUsers > 0) {
            s3.createBucket(createBucketParams, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    console.log("Successfully created my Bucket", data);
                }
            });
        }

        // For the succeeding web page connected, pull the tweet stored from AWS S3
        if (numUsers > 1) {
            // Pull tweet from S3
            retrieveTweet(socket);
        }

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
            socket.searchMultipleTags = [];
            multiTag = [];
            clientTweet.untrackAll();
        });

        // Fetch tweets from AWS S3
        socket.on("fetchTweet", function (data) {
            socket.searchMultipleTags = [];
            multiTag = [];
            clientTweet.untrackAll();
        });

        // Disconnect/Close Connection of socket between server and client when browser close/refresh web page
        socket.on('disconnect', function () {
            console.log("User " + socket.id + " disconnected");
            numUsers--;

            // If no users are online, remove bucket
            if (numUsers <= 0) {
                // Need to remove all the item within the bucket first
                // CONTINUE HERE
                // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObjects-property

                // Need to ask regarding the persistence of the S3 bucket,
                // does each web page need to have its own storage, or
                // does every web page instance use the same storage,
                // which will lead to duplication of tweets

                s3.deleteBucket(deleteBucketParams, function (err, data) {
                    if (err) {
                        console.log(err, err.stack); // an error occurred
                    } else {
                        console.log("Successfully removed my Bucket", data); // successful response
                    }
                });
            }
        });

        // Find and filter the tweet stream
        clientTweet.on('tweet', function (tweet) {
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (tweet.text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                    // Store tweet to S3
                    storeTweet(tweet);

                    // Parse tweet
                    ResultOfTweet(tweet, socket);
                    // console.log("It works");
                }
            }
        });
    });

    // Store tweet in AWS S3 bucket
    function storeTweet(tweet) {
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
    function retrieveTweet(socket) { // GET ALL ITEMS???
        // get tweet from S3
        var listObjectParams = {
            Bucket: myBucket,
            MaxKeys: 1000
        };
        s3.listObjects(listObjectParams, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log("Successfully list the objetcs: ", data); // successful response
                for (var i = 0; i < data.Contents.length; i++) {
                    var getObjectParams = {
                        Bucket: myBucket,
                        Key: data.Contents[i].Key
                    };

                    s3.getObject(getObjectParams, function (err, data) {
                        if (err) {
                            console.log(err, err.stack); // an error occurred
                        } else {
                            console.log("Successfully fetched the data: ", data); // successful response
                            var tweet = JSON.parse(data.Body.toString());
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
            }
        });
    }

    // Get results of tweet
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

            // var FormattedTweets1 = '<li class = "' + mood + '" id ="' + emotion + '">' +
            //     '<a href="' + profileUrl + '" target="_blank">' +
            //     '<img src="' + url + '" style="width: 300px; height:100px"></a>' +
            //     '<div class="post-info">' +
            //     '<div class="post-basic-info">' +
            //     '<img src ="' + tweet.user.profile_image_url + '" style="width:50px; height:50px; float:left; border-radius: 50%">' +
            //     '<h3><a href="' + profileUrl + '" target="_blank">' +
            //     tweet.user.name + '</a></h3>' +
            //     '<span><br/><a href="#">' + createdTime + '<br/><label>' +
            //     '</label>' + urlLocation + '</a></span>' +
            //     '<p>' + tweet.text + '</p>' +
            //     '</div>' +
            //     '<div class="post-info-rate-share" style="background-color:' + color + '">' +
            //     '<p5>' + rating + '</p5>' +
            //     '<div class="rateit"><span></span></div>' +
            //     '<div class="post-share">' +
            //     '<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + tweet.user.friends_count + '</span>' +
            //     '</div>' +
            //     '<div class="clear"></div>' +
            //     '</div>' +
            //     '</div>' +
            //     '</li>';

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
};