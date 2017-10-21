(function ($) {
    "use strict"; // Start of use strict

    // Smooth scrolling using jQuery easing
    $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html, body').animate({
                    scrollTop: (target.offset().top - 54)
                }, 1000, "easeInOutExpo");
                return false;
            }
        }
    });

    // Closes responsive menu when a scroll trigger link is clicked
    $('.js-scroll-trigger').click(function () {
        $('.navbar-collapse').collapse('hide');
    });

    // Activate scrollspy to add active class to navbar items on scroll
    $('body').scrollspy({
        target: '#mainNav',
        offset: 54
    });

    //Hover Menu in Header
    $('ul.nav li.dropdown').hover(function () {
        $(this).find('.mega-dropdown-menu').stop(true, true).delay(200).fadeIn(200);
    }, function () {
        $(this).find('.mega-dropdown-menu').stop(true, true).delay(200).fadeOut(200);
    });

})(jQuery); // End of use strict

// Socket Io client
var socket = io();
var $ = jQuery.noConflict();

// Connect to the socket
socket.emit("connected");

// Tweet tile count
var tweetTileCount = 0;

// Chart JS Live Charts
// Total Tweet Activity Counts
var totalTweetActivity = {
    totalTweetCount: 0,
    negativeTweetCount: 0,
    neutralTweetCount: 0,
    positiveTweetCount: 0
};

// Tweet Activity Counts (Line Chart)
var lineTweetActivity = {
    totalTweetCount: 0,
    negativeTweetCount: 0,
    neutralTweetCount: 0,
    positiveTweetCount: 0
};

// Tweet sentiment colours
var colorTotalTweet = "#00b2e8";
var colorNegativeTweet = "#ff1100";
var colorNeutralTweet = "#fffd00";
var colorPositiveTweet = "#00c869";

var bartTweetTopics = []; // Tweet topics (Bar Chart)

// Chart JS Config (Line Chart)
var lineChartData = {
    labels: [],
    datasets: [{
        label: 'Total Tweets',
        fill: false,
        backgroundColor: colorTotalTweet,
        borderColor: colorTotalTweet,
        borderWidth: 1,
        data: []
    }, {
        label: 'Negative Tweets',
        fill: false,
        backgroundColor: colorNegativeTweet,
        borderColor: colorNegativeTweet,
        borderWidth: 1,
        data: []
    }, {
        label: 'Neutral Tweets',
        fill: false,
        backgroundColor: colorNeutralTweet,
        borderColor: colorNeutralTweet,
        borderWidth: 1,
        data: []
    }, {
        label: 'Positive Tweets',
        fill: false,
        backgroundColor: colorPositiveTweet,
        borderColor: colorPositiveTweet,
        borderWidth: 1,
        data: []
    }]
};

// Chart JS Config (Bar Chart)
var barChartData = {
    labels: [],
    datasets: [{
        label: 'Negative Tweets',
        fill: false,
        backgroundColor: colorNegativeTweet,
        borderColor: colorNegativeTweet,
        borderWidth: 1,
        data: []
    }, {
        label: 'Neutral Tweets',
        fill: false,
        backgroundColor: colorNeutralTweet,
        borderColor: colorNeutralTweet,
        borderWidth: 1,
        data: []
    }, {
        label: 'Positive Tweets',
        fill: false,
        backgroundColor: colorPositiveTweet,
        borderColor: colorPositiveTweet,
        borderWidth: 1,
        data: []
    }]
};

// Get Element (Line Chart)
var ctx = document.getElementById("chartSentiment").getContext("2d");
var lineChart = new Chart(ctx, {
    type: 'line',
    data: lineChartData,
    options: {
        responsive: true,
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Real-Time Twitter Sentiment'
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Number of tweets'
                }
            }]
        }
    }
});

// Get Element (Bar Chart)
var ctx = document.getElementById("chartTopic").getContext("2d");
var barChart = new Chart(ctx, {
    type: 'bar',
    data: barChartData,
    options: {
        responsive: true,
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Real-Time Twitter Topics'
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Topic'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Number of tweets'
                }
            }]
        }
    }
});

// Javascript Event
$(function () {
    // Clear chart (Line Chart)
    $('#clearChartSentiment').click(function () {
        lineChartData.labels.splice(0, lineChartData.labels.length);
        lineChartData.datasets[0].data.splice(0, lineChartData.datasets[0].data.length);
        lineChartData.datasets[1].data.splice(0, lineChartData.datasets[1].data.length);
        lineChartData.datasets[2].data.splice(0, lineChartData.datasets[2].data.length);
        lineChartData.datasets[3].data.splice(0, lineChartData.datasets[3].data.length);
        lineChart.update();
    });

    // Clear chart (Bar Chart)
    $('#clearChartTopic').click(function () {
        bartTweetTopics.splice(0, bartTweetTopics.length);
        barChartData.labels.splice(0, barChartData.labels.length);
        barChartData.datasets[0].data.splice(0, barChartData.datasets[0].data.length);
        barChartData.datasets[1].data.splice(0, barChartData.datasets[1].data.length);
        barChartData.datasets[2].data.splice(0, barChartData.datasets[2].data.length);
        barChart.update();
    });

    // Clear tweet stream
    $('#clearTweetCount').click(function () {
        totalTweetActivity.totalTweetCount = 0;
        totalTweetActivity.negativeTweetCount = 0;
        totalTweetActivity.neutralTweetCount = 0;
        totalTweetActivity.positiveTweetCount = 0;
        var updateOverallSentiment = "<div class=\"card-header\" id=\"overallSentiment\">\n" +
            "<b>Overall Sentiment: </b>\n" +
            "</div>";

        // Update the overall tweets counts
        $('#totalTweetCount b').text(totalTweetActivity.totalTweetCount);
        $('#negativeTweetCount b').text(totalTweetActivity.negativeTweetCount);
        $('#neutralTweetCount b').text(totalTweetActivity.neutralTweetCount);
        $('#positiveTweetCount b').text(totalTweetActivity.positiveTweetCount);

        // Update the overall sentiment status
        $('#overallSentiment').replaceWith(updateOverallSentiment);
    });

    // Add/Remove query keywords
    $('#tweetInputText').tagsInput();
});

// Load new tweets
$(document).ready(function () {
    // Get the result of tweet
    socket.on("resultTweet", function (data) {
        var tweetObject = data;
        // console.log(tweetObject);

        // Push topic (Bar Chart)
        if (!bartTweetTopics.length) { // If no topics, add topic to chart
            var newTopic = {
                topicName: tweetObject.topic, // Possible to have more than 1 topic per tweet
                topicTotalTweetCount: 1, // Increment topic count
                topicNegativeTweetCount: 0,
                topicNeutralTweetCount: 0,
                topicPositiveTweetCount: 0
            };
            bartTweetTopics.push(newTopic);

            // Add topic as new label (Bar Chart)
            barChartData.labels.push(tweetObject.topic);
        } else {
            var topicExisted = false;
            for (var i = 0; i < bartTweetTopics.length; i++) {
                // If topic already existed
                if (bartTweetTopics[i].topicName === tweetObject.topic) {
                    topicExisted = true;
                    break;
                }
            }
            if (topicExisted === false) { // If topic is unique
                var uniqueTopic = {
                    topicName: tweetObject.topic,
                    topicTotalTweetCount: 1, // Increment topic count
                    topicNegativeTweetCount: 0,
                    topicNeutralTweetCount: 0,
                    topicPositiveTweetCount: 0
                };
                bartTweetTopics.push(uniqueTopic);

                // Add topic as new label (Bar Chart)
                barChartData.labels.push(tweetObject.topic);
            }
        }

        // Increment sentiment by topic
        for (var i = 0; i < bartTweetTopics.length; i++) {
            if (bartTweetTopics[i].topicName === tweetObject.topic) {
                // Increment tweet activity count
                if(tweetObject.hasTopics){ // Only increment total and line when the tweet has a ll the topics
                    totalTweetActivity.totalTweetCount++;
                    lineTweetActivity.totalTweetCount++;
                }
                bartTweetTopics[i].topicTotalTweetCount++;

                if (tweetObject.emotion === "negative") {
                    if(tweetObject.hasTopics){ // Only increment total and line when the tweet has a ll the topics
                        totalTweetActivity.negativeTweetCount++;
                        lineTweetActivity.negativeTweetCount++;
                    }
                    bartTweetTopics[i].topicNegativeTweetCount++;

                } else if (tweetObject.emotion === "neutral") {
                    if(tweetObject.hasTopics){ // Only increment total and line when the tweet has a ll the topics
                        totalTweetActivity.neutralTweetCount++;
                        lineTweetActivity.neutralTweetCount++;
                    }

                    bartTweetTopics[i].topicNeutralTweetCount++;

                } else if (tweetObject.emotion === "positive") {
                    if(tweetObject.hasTopics){ // Only increment total and line when the tweet has a ll the topics
                        totalTweetActivity.positiveTweetCount++;
                        lineTweetActivity.positiveTweetCount++;
                    }
                    bartTweetTopics[i].topicPositiveTweetCount++;
                }

                // Add topic count to data set of Bar Chart (Bar Chart)
                barChartData.datasets[0].data[i] = bartTweetTopics[i].topicNegativeTweetCount;
                barChartData.datasets[1].data[i] = bartTweetTopics[i].topicNeutralTweetCount;
                barChartData.datasets[2].data[i] = bartTweetTopics[i].topicPositiveTweetCount;
                break;
            }
        }

        // Update chart (Bar Chart)
        barChart.update();

        // Only increment, update when the tweet has all the topics, since only the bar chart
        // increment every time a tweet with a single topic comes in.
        if(tweetObject.hasTopics){ // Only increment total and line when the tweet has a ll the topics
            // Update the Overall Sentiment Status
            var overallSentiment = totalTweetActivity.positiveTweetCount - totalTweetActivity.negativeTweetCount;
            var updateOverallSentiment = "";

            if (overallSentiment < 0) {
                updateOverallSentiment = "<div class=\"card-header\" id=\"overallSentiment\">\n" +
                    "<b>Overall Sentiment: </b><b style=\"color: #ff1100\">Negative</b>\n" +
                    "</div>";
            } else if (overallSentiment === 0) {
                updateOverallSentiment = "<div class=\"card-header\" id=\"overallSentiment\">\n" +
                    "<b>Overall Sentiment: </b><b style=\"color: #fffd00\">Neutral</b>\n" +
                    "</div>";
            } else if (overallSentiment > 0) {
                updateOverallSentiment = "<div class=\"card-header\" id=\"overallSentiment\">\n" +
                    "<b>Overall Sentiment: </b><b style=\"color: #00c869\">Positive</b>\n" +
                    "</div>";
            }

            var printTopicsString = "";
            for (var i = 0; i < tweetObject.topics.length; i++){
                if (i === (tweetObject.topics.length - 1)) { // Last topic in the tweet
                    printTopicsString += tweetObject.topics[i];
                } else {
                    printTopicsString += tweetObject.topics[i] + ", ";
                }
            }
            // var tweetObject = {
            //     id: tweet.id_str,
            //     userName: tweet.user.name,
            //     screenName: tweet.user.screen_name,
            //     profileUrl: profileUrl,
            //     profileImageUrl: tweet.user.profile_image_url,
            //     createdTime: createdTime,
            //     bannerUrl: bannerUrl,
            //     urlLocation: urlLocation,
            //     text: fullText,
            //     rating: rating,
            //     color: color,
            //     emotion: emotion,
            //     friendCount: tweet.user.friends_count,
            //     topic: topic
            //     hasTopics: true,
            //     topics: topics
            // };

            // Print out the tweet
            var FormattedTweetsVisual = '<div class="col-lg-6 col-md-12 col-sm-12">' +
                '<div class="card">' +
                '<div class="card-body">' +
                '<div class="container">' +
                '<div class="row">' +
                '<div class="col-lg-4 col-md-4 col-sm-4">' +
                '<a href="' + tweetObject.profileUrl + '" target="_blank">' +
                '<img src="' + tweetObject.profileImageUrl + '" class="rounded float-left" alt="No Image" style="height: 100px; width: 100%">' +
                '</a>' +
                '</div>' +
                '<div class="col-lg-8 col-md-8 col-sm-8">' +
                '<h3><a href="' + tweetObject.profileUrl + '" target="_blank">' +
                tweetObject.userName + '</a></h3>' +
                '<span class="text-muted">' + '@' + tweetObject.screenName + '</span>' +
                '<br/>' +
                '<span class="fa fa-calendar text-muted">' + ' ' + tweetObject.createdTime + '</span>' +
                '<br/>' +
                '<span class="fa fa-map-marker text-muted">' + ' ' + tweetObject.urlLocation + '</span>' +
                '</div>' +
                '</div>' +
                '<div class="row text-muted">' +
                '<p>' + tweetObject.text + '</p>' +
                '</div>' +
                '<div class="row text-primary">' +
                '<div class="col-lg-6 col-md-6 col-sm-6">' +
                '<span class="fa fa-star" style="color:' + tweetObject.color + '"><b class="text-dark"> Rating  : ' + tweetObject.rating + '</b></span>' +
                '</div>' +
                '<div class="col-lg-6 col-md-6 col-sm-6">' +
                '<span class="fa fa-comments "><b class="text-dark"> Topic : ' + printTopicsString + ' </b></span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

            // Display the tweet streams, maximum of 20 per page
            if (tweetTileCount >= 20) {
                $('#tweetTiles div').first().remove();
            }
            $('#tweetTiles').append(FormattedTweetsVisual);
            tweetTileCount++;

            // Update the overall tweets counts
            $('#totalTweetCount b').text(totalTweetActivity.totalTweetCount);
            $('#negativeTweetCount b').text(totalTweetActivity.negativeTweetCount);
            $('#neutralTweetCount b').text(totalTweetActivity.neutralTweetCount);
            $('#positiveTweetCount b').text(totalTweetActivity.positiveTweetCount);

            // Update the overall sentiment status
            $('#overallSentiment').replaceWith(updateOverallSentiment);
        }
    });
});

// Query for particular tag of tweet
function searchTagTweet(value) {
    //Invoke the socket to search the particular tweet
    if (value !== '') {
        socket.emit("searchTagTweet", value);
    }
}

// Remove particular of tag of tweet
function removeTagTweet(value) {
    socket.emit("removeTagTweet", value);
}

// Every seconds run this
function tick() {
    // Every 1 seconds
    setInterval(function () {
        // Get current time
        var now = new Date();
        if (now.getSeconds() % 5 === 0) {
            console.log(now.getSeconds());
            console.log("Every 5 seconds");

            var currentTime;

            // Shift data label, 12 * 5 = 60 seconds = 1 minute (Line Chart)
            if (lineChartData.labels.length > 12) {
                lineChartData.labels.shift();
                for (var index = 0; index < lineChartData.datasets.length; ++index) {
                    lineChartData.datasets[index].data.shift();
                }
            }

            // Display Time format (Line Chart)
            if (now.getSeconds() === 0) { // Every minute
                if (now.getMinutes() < 10) {
                    currentTime = now.getHours() + ":0" + now.getMinutes();
                } else {
                    currentTime = now.getHours() + ":" + now.getMinutes();
                }
            } else {
                if (now.getSeconds() < 10) {
                    currentTime = ":0" + now.getSeconds();
                } else {
                    currentTime = ":" + now.getSeconds();
                }
            }

            // Add tweet count to data set of Line Chart (Line Chart)
            lineChartData.labels.push(currentTime);
            lineChartData.datasets[0].data.push(lineTweetActivity.totalTweetCount);
            lineChartData.datasets[1].data.push(lineTweetActivity.negativeTweetCount);
            lineChartData.datasets[2].data.push(lineTweetActivity.neutralTweetCount);
            lineChartData.datasets[3].data.push(lineTweetActivity.positiveTweetCount);

            // Update chart (Line Chart)
            lineChart.update();

            // Refresh tweet count
            lineTweetActivity.totalTweetCount = 0;
            lineTweetActivity.negativeTweetCount = 0;
            lineTweetActivity.neutralTweetCount = 0;
            lineTweetActivity.positiveTweetCount = 0;
        }
    }, 1000);
}

tick();
