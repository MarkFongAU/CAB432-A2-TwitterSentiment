// const Twit = require('twit');
// const sentiment = require('sentiment');
// const dateFormat = require('dateformat');
const AWS = require('aws-sdk');
var events = require('events');
var serverEmitter = new events.EventEmitter();

// AWS DynamoDB Configurations
AWS.config = new AWS.Config();
AWS.config.loadFromPath('./config/awsconfig.json');
var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();
var tableName = 'cab432tweetstream'; // DynamoDB Table Name

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

    // Listen to server emitter which calls every 1 second
    serverEmitter.on('callDB', function () {
        // Get current time - 1 second (basically to get 1 second old tweet)
        var now = new Date();
        var nowGetTime = now.getTime().toString();
        var oneSecondBeforeGetTime = (now.getTime() - 1000).toString();

        console.log(nowGetTime);
        console.log(oneSecondBeforeGetTime);
        queryTweetStoredTime(nowGetTime, oneSecondBeforeGetTime);
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
        serverEmitter.on("tweetStream", function (tweetObject) {
            var topics = [];
            // Categories the type of tweet
            for (var i = 0; i < socket.searchMultipleTags.length; i++) {
                if (tweetObject.text.indexOf(socket.searchMultipleTags[i]) !== -1) {
                    console.log("Topic running: ", socket.searchMultipleTags[i]);
                    topics.push(socket.searchMultipleTags[i]);
                    if (i === (socket.searchMultipleTags.length - 1)){ // Last topic in the tweet
                        // Add topic to tweet object
                        var tweetObjectWithTopics = {
                            id: tweetObject.id,
                            userName: tweetObject.userName,
                            screenName: tweetObject.screenName,
                            profileUrl: tweetObject.profileUrl,
                            profileImageUrl: tweetObject.profileImageUrl,
                            createdTime: tweetObject.createdTime,
                            bannerUrl: tweetObject.bannerUrl,
                            urlLocation: tweetObject.urlLocation,
                            text: tweetObject.text,
                            rating: tweetObject.rating,
                            color: tweetObject.color,
                            emotion: tweetObject.emotion,
                            friendCount: tweetObject.friendCount,
                            topic: socket.searchMultipleTags[i],
                            hasTopics: true,
                            topics: topics
                        };

                        // Pass the tweet to the front-end
                        DisplayOfTweet(tweetObjectWithTopics, socket.id);
                    } else {
                        // Add topic to tweet object
                        var tweetObjectWithoutTopics = {
                            id: tweetObject.id,
                            userName: tweetObject.userName,
                            screenName: tweetObject.screenName,
                            profileUrl: tweetObject.profileUrl,
                            profileImageUrl: tweetObject.profileImageUrl,
                            createdTime: tweetObject.createdTime,
                            bannerUrl: tweetObject.bannerUrl,
                            urlLocation: tweetObject.urlLocation,
                            text: tweetObject.text,
                            rating: tweetObject.rating,
                            color: tweetObject.color,
                            emotion: tweetObject.emotion,
                            friendCount: tweetObject.friendCount,
                            topic: socket.searchMultipleTags[i],
                            hasTopics: false
                        };

                        // Pass the tweet to the front-end
                        DisplayOfTweet(tweetObjectWithoutTopics, socket.id);
                    }
                }
            }
        });
    });

    // Display of tweet
    function DisplayOfTweet(tweetObject, socket_id) {
        // Get id of the socket
        var socket = ns.connected[socket_id];

        // Sometimes user will disconnect when the tweet is emit to the front
        // and the socket becomes null/undefined
        if (socket) { // Check if socket still exist
            //console.log("Display socket:", socket.id);
            //console.log("Topic :", tweetObject.topic);
            if (tweetObject.hasTopics){
                console.log("Last topic of tweet: ", tweetObject.topics);
            }
            // Pass tweet object to the front
            socket.emit("resultTweet", tweetObject);
        }
    }

    // Get freshly inserted tweets (one second old)
    function queryTweetStoredTime(nowGetTime, oneSecondBeforeGetTime) {
        // var params = {
        //     TableName: tableName,
        //     FilterExpression: "stored_time BETWEEN :date1 and :date2"
        //     KeyConditionExpression: "#stored_time = :t",
        //     // ExpressionAttributeNames: {
        //     //     "#time": "stored_time"
        //     // },
        //     ExpressionAttributeValues: {
        //         ":t": oneSecondBeforeGetTime
        //     }
        // };

        console.log(nowGetTime, oneSecondBeforeGetTime);

        var params = {
            TableName: tableName,
            IndexName: "dummy_attribute-stored_time-index",
            KeyConditionExpression: "#attribute = :dummy AND #time BETWEEN :time1 AND :time2",
            ExpressionAttributeNames: {
                "#attribute": "dummy_attribute",
                "#time": "stored_time"
            },
            ExpressionAttributeValues: {
                ":dummy": "dummy",
                ":time1": oneSecondBeforeGetTime,
                ":time2": nowGetTime
            }
        };

        docClient.query(params, function (err, data) {
            if (err) {
                console.log("Unable to query. Error: ", err); // an error occurred
            } else {
                data.Items.forEach(function (data) { // successful response
                    // console.log(data.object);
                    // Emits to the server itself
                    serverEmitter.emit("tweetStream", data.object);
                });

            }
        });
    }

    // Every 1 seconds
    function tick() {
        setInterval(function () {
            serverEmitter.emit("callDB");
        }, 1000);
    }

    tick();
};