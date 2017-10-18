const TwitterStreamChannels = require('twitter-stream-channels');
const sentiment = require('sentiment');
const dateFormat = require('dateformat');
const AWS = require('aws-sdk');

// AWS S3 Configurations, Create Bucket and Remove Bucket parameters
AWS.config = new AWS.Config();
AWS.config.loadFromPath('./config/awsconfig.json');
var s3 = new AWS.S3();
var myBucketRaw = 'cab432tweetraw'; // Store Raw tweets (Bucket names must be unique across all S3 users)
var myBucketCooked = 'cab432tweetcooked'; // Store Cooked/Processed tweets (Bucket names must be unique across all S3 users)

// Twitter Stream Channel Credential (Twitter-Stream-Channels)
var credentials = {
    consumer_key: "NlOMNwv4bL201ZwN7yJShtHOa",
    consumer_secret: "rcAAXY6LbOruQlBTWskxhZ8N5SNrII1Tm6MVsEp1vas63t23Xb",
    access_token: "2315083052-zojLYhSLN4DE3Z87np9sp8eyk7X8ZoDGTmEqkPB",
    access_token_secret: "tWgaps1lklk8Ax707dqK8c7P1kcyj0CYObg1oEuHO7h71"
};
var clientTweetChannels = new TwitterStreamChannels(credentials); // (Twitter-Stream-Channels)
var channels = { // (Twitter-Stream-Channels)
    // Examples
    // languages : ['a','perl']
    // js-frameworks : ['angularjs','jquery'],
    // web : ['javascript']
};
// Create Tweet Stream Channels for all sockets to be used
var stream = clientTweetChannels.streamChannels({track: channels}); // (Twitter-Stream-Channels)

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

    // Initial Connection of socket between server and client
    io.on('connection', function (socket) {
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
            // Remove all tags in this particular socket
            socket.searchMultipleTags.splice(0, socket.searchMultipleTags.length);

            // Push updated tags into the channel (Twitter-Stream-Channels)
            console.log("Current of All Channel Tags ", channels);
            channels[socket.id] = socket.searchMultipleTags;
            delete channels[socket.id];
            console.log("Updated of All Channel Tags ", channels);

            // Update stream channel (Twitter-Stream-Channels)
            changeTweetStreamTag();

            // Indicate user has disconnected
            console.log("User " + socket.id + " disconnected");
            numUsers--;
            if (numUsers < 0) {
                numUsers = 0;
            }
            console.log("User currently online: " + numUsers);
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
                // Add tag in this particular socket
                socket.searchMultipleTags.push(data);

                // Push updated tags into the channel (Twitter-Stream-Channels)
                console.log("Current of All Channel Tags ", channels);
                channels[socket.id] = socket.searchMultipleTags;
                console.log("Updated of All Channel Tags ", channels);

                // Show list of tags in channel for particular socket id (Twitter-Stream-Channels)
                console.log(socket.id + " current channel Tags: ", channels[socket.id]);

                // Update stream channel (Twitter-Stream-Channels)
                changeTweetStreamTag();
            }
        });

        // Remove particular tags
        socket.on("removeTagTweet", function (data) {
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (data === socket.searchMultipleTags[i]) {
                    // Remove tags in this particular socket
                    socket.searchMultipleTags.splice(i, i + 1);

                    // Push updated tags into the channel (Twitter-Stream-Channels)
                    console.log("All Channel Tags ", channels);
                    channels[socket.id] = socket.searchMultipleTags;
                    console.log("Updated of All Channel Tags ", channels);

                    // Show list of tags in channel for particular socket id (Twitter-Stream-Channels)
                    console.log(socket.id + " channel Tags: ", channels[socket.id]);

                    break;
                }
            }
            // Update stream channel (Twitter-Stream-Channels)
            changeTweetStreamTag();
        });
    });

    // Change the tweet stream tag and restart tweet stream in a function (Twitter-Stream-Channels)
    function changeTweetStreamTag() {
        stream.stop();
        stream = clientTweetChannels.streamChannels({track: channels});
        stream.on('channels', function (tweet) {
            // Stream tweets with keywords in the channels object
            console.log(tweet.$channels);
            sortIncomingTweetStream(tweet.$channels, tweet); // tweet object
        });
    }

    // Sort the tweets coming out from the tweet stream for all online sockets (Twitter-Stream-Channels)
    function sortIncomingTweetStream(channels, tweet) {
        // Allocate topic and channels to tweet object
        var topic;
        for (var id in channels) {
            topic = channels[id][0];
            break;
        }
        tweet["topic"] = topic;
        tweet["channel"] = channels;

        // Parse tweets (and display to the front)
        ParseRawTweet(tweet);

        // Store tweet to S3 (storing just for the sake of generating load)
        storeRawTweet(tweet);
    }

    // Parsing of raw tweet
    function ParseRawTweet(tweet) {
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

            // Print out the tweet
            var FormattedTweetsVisual = '<div class="col-lg-6 col-md-12 col-sm-12">' +
                '<div class="card">' +
                '<div class="card-body">' +
                '<div class="container">' +
                '<div class="row">' +
                '<div class="col-lg-4 col-md-4 col-sm-4">' +
                '<a href="' + profileUrl + '" target="_blank">' +
                '<img src="' + tweet.user.profile_image_url + '" class="rounded float-left" alt="No Image" style="height: 100px; width: 100%">' +
                '</a>' +
                '</div>' +
                '<div class="col-lg-8 col-md-8 col-sm-8">' +
                '<h3><a href="' + profileUrl + '" target="_blank">' +
                tweet.user.name + '</a></h3>' +
                '<span class="text-muted">' + '@' + tweet.user.screen_name + '</span>' +
                '<br/>' +
                '<span class="fa fa-calendar text-muted">' + ' ' + createdTime + '</span>' +
                '<br/>' +
                '<span class="fa fa-map-marker text-muted">' + ' ' + urlLocation + '</span>' +
                '</div>' +
                '</div>' +
                '<div class="row text-muted">' +
                '<p>' + fullText + '</p>' +
                '</div>' +
                '<div class="row text-primary">' +
                '<div class="col-lg-6 col-md-6 col-sm-6">' +
                '<span class="fa fa-star" style="color:' + color + '"><b class="text-dark"> Rating  : ' + rating + '</b></span>' +
                '</div>' +
                '<div class="col-lg-6 col-md-6 col-sm-6">' +
                '<span class="fa fa-comments "><b class="text-dark"> Topic : ' + topic + ' </b></span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

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
                topic: topic,
                channel: tweet.channel,
                formattedTweetsVisual: FormattedTweetsVisual
            };

            // Display tweet
            DisplayOfTweet(tweetObject);
        });
    }

    // Display of tweet
    function DisplayOfTweet(tweet) {
        for (var id in tweet.channel) {
            // Get id of the socket
            var socket = ns.connected[id];

            // Pass tweet object to the front
            socket.emit("resultTweet", tweet);
        }
    }

    // Store raw tweet in AWS S3 bucket, one raw tweet per call
    function storeRawTweet(tweet) {
        var stringifyTweet = JSON.stringify(tweet);
        var uniqueKey = tweet.id_str; // Stored by id, overwrite-able

        // Push tweet to S3
        var params = {
            Body: stringifyTweet,
            Bucket: myBucketRaw,
            Key: uniqueKey
        };

        s3.putObject(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            }
            else {
                console.log("Successfully stored the data with " + uniqueKey + " : ", data); // successful response

                // Fetch tweet from S3
                retrieveRawTweet(uniqueKey);
            }
            /*
            data = {
             ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
             VersionId: "Bvq0EDKxOcXLJXNo_Lkz37eM3R4pfzyQ"
            }
            */
        });
    }

    // Retrieve raw tweet from AWS S3 bucket, one raw tweet per call
    function retrieveRawTweet(uniqueKey) {
        // Get tweet from S3
        var getObjectParams = {
            Bucket: myBucketRaw,
            Key: uniqueKey
        };

        s3.getObject(getObjectParams, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log("Successfully fetched the data with " + uniqueKey + " : ", data.ETag); // successful response
                var tweet = JSON.parse(data.Body.toString());

                // Parse stored raw tweet
                ParseStoredRawTweet(tweet);
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

    // Parsing of stored raw tweet
    function ParseStoredRawTweet(tweet) {
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

            // Print out the tweet
            var FormattedTweetsVisual = '<div class="col-lg-6 col-md-12 col-sm-12">' +
                '<div class="card">' +
                '<div class="card-body">' +
                '<div class="container">' +
                '<div class="row">' +
                '<div class="col-lg-4 col-md-4 col-sm-4">' +
                '<a href="' + profileUrl + '" target="_blank">' +
                '<img src="' + tweet.user.profile_image_url + '" class="rounded float-left" alt="No Image" style="height: 100px; width: 100%">' +
                '</a>' +
                '</div>' +
                '<div class="col-lg-8 col-md-8 col-sm-8">' +
                '<h3><a href="' + profileUrl + '" target="_blank">' +
                tweet.user.name + '</a></h3>' +
                '<span class="text-muted">' + '@' + tweet.user.screen_name + '</span>' +
                '<br/>' +
                '<span class="fa fa-calendar text-muted">' + ' ' + createdTime + '</span>' +
                '<br/>' +
                '<span class="fa fa-map-marker text-muted">' + ' ' + urlLocation + '</span>' +
                '</div>' +
                '</div>' +
                '<div class="row text-muted">' +
                '<p>' + fullText + '</p>' +
                '</div>' +
                '<div class="row text-primary">' +
                '<div class="col-lg-6 col-md-6 col-sm-6">' +
                '<span class="fa fa-star" style="color:' + color + '"><b class="text-dark"> Rating  : ' + rating + '</b></span>' +
                '</div>' +
                '<div class="col-lg-6 col-md-6 col-sm-6">' +
                '<span class="fa fa-comments "><b class="text-dark"> Topic : ' + topic + ' </b></span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

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
                topic: topic,
                channel: tweet.channel,
                formattedTweetsVisual: FormattedTweetsVisual
            };

            // Store newly cooked tweet
            storeCookedTweet(tweetObject);
        });
    }

    // Store cooked tweet in AWS S3 bucket, one cooked tweet per call
    function storeCookedTweet(tweetObject) {
        var stringifyTweet = JSON.stringify(tweetObject);
        var uniqueKey = tweetObject.id;

        // Push tweet to S3
        var params = {
            Body: stringifyTweet,
            Bucket: myBucketCooked,
            Key: uniqueKey
        };

        s3.putObject(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            }
            else {
                console.log("Successfully stored the data with " + uniqueKey + " : ", data); // successful response

                // Fetch tweet from S3
                retrieveCookedTweet(uniqueKey);
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
    function retrieveCookedTweet(uniqueKey) {
        // Get tweet from S3
        var getObjectParams = {
            Bucket: myBucketCooked,
            Key: uniqueKey
        };

        s3.getObject(getObjectParams, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                console.log("Successfully fetched the data with " + uniqueKey + " : ", data.ETag); // successful response
                var tweet = JSON.parse(data.Body.toString());
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
};