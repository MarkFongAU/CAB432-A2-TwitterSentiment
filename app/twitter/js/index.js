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

// var usercount = '<%= title %>';

//Connect to the socket
var socket = io();
var $ = jQuery.noConflict();

// Add/Remove query keywords
$(function () {
    $('#activator').click(function () {
        $('#box').animate({'top': '0px'}, 500);
    });
    $('#boxclose').click(function () {
        $('#box').animate({'top': '-700px'}, 500);
    });
    $('#tweetInputText').tagsInput();
});


// Load new tweets
$(document).ready(function () {
    //Hide (Collapse) the toggle containers on load
    $(".toggle_container").hide();
    //Switch the "Open" and "Close" state per click then slide up/down (depending on open/close state)
    $(".trigger").click(function () {
        $(this).toggleClass("active").next().slideToggle("slow");
        return false; //Prevent the browser jump to the link anchor
    });

    // Loaded Images Function
    var $tiles = $('#tiles'),
        $handler = $('li', $tiles),
        $main = $('#main'),
        $window = $(window),
        $document = $(document),
        options = {
            autoResize: true, // This will auto-update the layout when the browser window is resized.
            container: $main, // Optional, used for some extra CSS styling
            offset: 20, // Optional, the distance between grid items
            itemWidth: 280 // Optional, the width of a grid item
        };

    /**
     * Reinitializes the wookmark handler after all images have loaded
     */
    function applyLayout() {
        $tiles.imagesLoaded(function () {
            // Destroy the old handler
            if ($handler.wookmarkInstance) {
                $handler.wookmarkInstance.clear();
            }

            // Create a new layout handler.
            $handler = $('li', $tiles);
            $handler.wookmark(options);
        });
    }

    // Get the result of tweet
    socket.on("resultTweet", function (data) {
        $('#tiles').append(data);
        applyLayout();
    });
});

// Bind the enter key to start the tweet query searching method
function enterBindKey(event) {
    if (event.keyCode == 13) {
        searchTweet();
    }
}

//Query for particular tag of tweet
function searchTweet(value) {
    // Get the search value
    var SearchValue = document.getElementById('tweetInputText').value;

    //Invoke the socket to search the particular tweet
    if (value !== '') {
        socket.emit("searchTweet", value);
    }
}

//Remove particular of tag of tweet
function removeTagTweet(value) {
    socket.emit("removeTagTweet", value);
}

function removeAll() {
    $tiles = $('#tiles');
    socket.emit("clearAllTag", "");
    $tiles.empty();
    applyLayout();
}
