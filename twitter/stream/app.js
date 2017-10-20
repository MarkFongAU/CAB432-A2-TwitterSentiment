const Twit = require('twit');
const request = require('request');

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

// Stream the tweets from Twitter via Twit Stream
stream.on('tweet', function (tweet) {
    // Pass the raw tweets to the load balancer address
    request({
            // url: 'http://CAB432A2-LoadBalancer-64347381.us-west-2.elb.amazonaws.com/',
            url: 'http://CAB432A2-LoadBalancer-64347381.us-west-2.elb.amazonaws.com/',
            method: 'POST',
            json: tweet
        }, function (err, res, body) {
            if (!err && res.statusCode === 200) {
                console.log(body);
            }
        }
    );
});

// Twit Stream Limit message
stream.on('limit', function (limitMessage) {
    console.log(limitMessage);
});

// Twit Stream Disconnect message
stream.on('disconnect', function (disconnectMessage) {
    console.log(disconnectMessage);
});