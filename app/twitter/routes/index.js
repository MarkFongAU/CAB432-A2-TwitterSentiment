const express = require('express');
var twitterAPIKey = require('../config');
var Twitter = require('node-tweet-stream');
var sentiment = require('sentiment');
const async = require('async');
const request = require('request');
const viewsPath = __dirname + '/views/';

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

        // Search the tweets
        socket.on("searchTweet", function (data) {
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

        var FormattedTweets = '<li class = "' + mood + '" id ="' + emotion + '">' +
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

        console.log(tweet.text);
        socket.emit("resultTweet", FormattedTweets);
    }
}


// // GET city parameters dynamically
// router.get('/searchCity', function (clientReq, clientRes) {
//     console.log("Input:" + clientReq.query.city);
//
//     var zomato = {
//         apikey: "41545c45de7c80b47f11e144fb5f64cf"
//     };
//
//     function createZomatoCityOptions(clientReq, apiType) {
//         var defaultOptions = {
//             url: 'https://developers.zomato.com/api/v2.1/',
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'user-key': zomato.apikey // Zomato API Key
//             },
//             json: true
//         };
//
//         var str = apiType + '?' +
//             'q=' + clientReq.query.city;
//         defaultOptions.url += str;
//         return defaultOptions;
//     }
//
//     var cityOptions = createZomatoCityOptions(clientReq, "cities");
//
//     const options= [
//         cityOptions
//     ];
//
//     function multipleGet(options, callback) {
//         request(options,
//             function(err, res, body) {
//                 callback(err, body);
//             }
//         );
//     }
//
//     async.map(options, multipleGet, function (err, res) {
//         if (err) return console.log(err);
//
//         var jObject;
//
//         var cities = [];
//         for (var locationIndex in res[0].location_suggestions){
//             jObject = {
//                 id: res[0].location_suggestions[locationIndex].id,
//                 name: res[0].location_suggestions[locationIndex].name
//             };
//             cities.push(jObject);
//         }
//         clientRes.send(cities);
//     });
// });
//
// // GET parameters to be displayed in the form
// router.get('/getCity', function (clientReq, clientRes) {
//     var zomato = {
//         apikey: "41545c45de7c80b47f11e144fb5f64cf"
//     };
//
//     function createZomatoCityLatLon(clientReq, apiType, count) {
//         var defaultOptions = {
//             url: 'https://developers.zomato.com/api/v2.1/',
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'user-key': zomato.apikey // Zomato API Key
//             },
//             json: true
//         };
//
//         var str = apiType + '?' +
//             'query=' + clientReq.query.city +
//             '&count=' + count;
//         defaultOptions.url += str;
//         return defaultOptions;
//     }
//
//     function createZomatoCityCategories(clientReq, apiType) {
//         var defaultOptions = {
//             url: 'https://developers.zomato.com/api/v2.1/',
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'user-key': zomato.apikey // Zomato API Key
//             },
//             json: true
//         };
//
//         var str = apiType;
//         defaultOptions.url += str;
//         return defaultOptions;
//     }
//     function createZomatoCityCuisines(clientReq, apiType) {
//         var defaultOptions = {
//             url: 'https://developers.zomato.com/api/v2.1/',
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'user-key': zomato.apikey // Zomato API Key
//             },
//             json: true
//         };
//
//         var str = apiType + '?' +
//             'city_id=' + clientReq.query.cityID;
//         defaultOptions.url += str;
//         return defaultOptions;
//     }
//     function createZomatoCityEstablishments(clientReq, apiType) {
//         var defaultOptions = {
//             url: 'https://developers.zomato.com/api/v2.1/',
//             method: 'GET',
//             headers: {
//                 'Accept': 'application/json',
//                 'user-key': zomato.apikey // Zomato API Key
//             },
//             json: true
//         };
//
//         var str = apiType + '?' +
//             'city_id=' + clientReq.query.cityID;
//         defaultOptions.url += str;
//         return defaultOptions;
//     }
//
//     var cityLatLon = createZomatoCityLatLon(clientReq, "locations", "1");
//     var optionsCategories = createZomatoCityCategories(clientReq, "categories");
//     var optionsCuisines = createZomatoCityCuisines(clientReq, "cuisines");
//     var optionsEstablishments = createZomatoCityEstablishments(clientReq, "establishments");
//
//     const options= [
//         cityLatLon,
//         optionsCategories,
//         optionsCuisines,
//         optionsEstablishments
//     ];
//
//     function multipleGet(options, callback) {
//         request(options,
//             function(err, res, body) {
//                 callback(err, body);
//             }
//         );
//     }
//
//     async.map(options, multipleGet, function (err, res){
//         if (err) return console.log(err);
//
//         var responseArray = {};
//         var jObject;
//
//         var latLon = [];
//         for (var locationIndex in res[0].location_suggestions){
//             jObject = {
//                 cityName: res[0].location_suggestions[locationIndex].city_name,
//                 cityID: res[0].location_suggestions[locationIndex].city_id,
//                 lat: res[0].location_suggestions[locationIndex].latitude,
//                 lon: res[0].location_suggestions[locationIndex].longitude
//             };
//             latLon.push(jObject);
//         }
//         // console.log(latLon);
//
//         var categories = [];
//         for (var categoryIndex in res[1].categories){
//             jObject = {
//                 id: res[1].categories[categoryIndex].categories.id,
//                 name: res[1].categories[categoryIndex].categories.name
//             };
//             categories.push(jObject);
//         }
//         // console.log(categories);
//
//         var cuisines = [];
//         for (var cuisineIndex in res[2].cuisines){
//             jObject = {
//                 id: res[2].cuisines[cuisineIndex].cuisine.cuisine_id,
//                 name: res[2].cuisines[cuisineIndex].cuisine.cuisine_name
//             };
//             cuisines.push(jObject);
//         }
//         // console.log(cuisines);
//
//         var establishments = [];
//         for (var establishmentIndex in res[3].establishments){
//             jObject = {
//                 id: res[3].establishments[establishmentIndex].establishment.id,
//                 name: res[3].establishments[establishmentIndex].establishment.name
//             };
//             establishments.push(jObject);
//         }
//         // console.log(establishments);
//
//         responseArray = {
//             latLon: latLon,
//             categories: categories,
//             cuisines: cuisines,
//             establishments: establishments
//         };
//         // console.log(responseArray);
//
//         clientRes.send(responseArray);
//     });
// });

module.exports = router;
