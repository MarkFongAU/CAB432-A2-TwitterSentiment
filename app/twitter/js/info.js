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


// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
var map, currentInfoWindow, restaurantInfoWindow, currentLocation, restaurantLocation, directionsDisplay;

function initMap() {
    // Get restaurant details for the map
    var input = $('#hiddenRestaurantID').val();
    $.ajax({
        url: '/info/getMap',
        type: 'GET',
        cache: true,
        data: {restaurantID: input},
        success: function (restaurant) {
            var lat = parseFloat(restaurant.locationLatitude);
            var lng = parseFloat(restaurant.locationLongitude);

            map = new google.maps.Map(document.getElementById('map'), {
                mapTypeControl: true,
                center: {lat: lat, lng: lng},
                zoom: 13
            });
            currentInfoWindow = new google.maps.InfoWindow;

            // Restaurant Markers
            setMarkers(map, restaurant);

            // Try HTML5 geolocation. ASYNC
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    currentLocation = new google.maps.Marker({
                        position: pos,
                        map: map,
                        title: 'You'
                    });

                    // Place Autocomplete and Directions
                    new AutocompleteDirectionsHandler(map);

                }, function () {
                    handleLocationError(true, currentInfoWindow, map.getCenter());
                });
            } else {
                // Browser doesn't support Geolocation
                handleLocationError(false, currentInfoWindow, map.getCenter());
            }
        }
        , error: function (jqXHR, textStatus, err) {
            console.log('Text Status ' + textStatus + ', Err ' + err)
        }
    });
}

/**
 * Geolocation Marker
 */
function handleLocationError(browserHasGeolocation, currentInfoWindow, pos) {
    currentInfoWindow.setPosition(pos);
    currentInfoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    currentInfoWindow.open(map);
}

/**
 * Restaurant Markers
 */
function setMarkers(map, restaurant) {
    // Adds markers to the map.

    // Marker sizes are expressed as a Size of X,Y where the origin of the image
    // (0,0) is located in the top left of the image.

    // Origins, anchor positions and coordinates of the marker increase in the X
    // direction to the right and in the Y direction down.
    var image = {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        // This marker is 32 pixels wide by 32 pixels high.
        size: new google.maps.Size(32, 32),
        // The origin for this image is (0, 0).
        origin: new google.maps.Point(0, 0),
        // The anchor for this image is the base of the flagpole at (0, 32).
        anchor: new google.maps.Point(16, 32)
    };
    // Shapes define the clickable region of the icon. The type defines an HTML
    // <area> element 'poly' which traces out a polygon as a series of X,Y points.
    // The final coordinate closes the poly by connecting to the first coordinate.
    var shape = {
        coords: [1, 1, 1, 28, 31, 28, 31, 1], //Top left, Bottom left, Bottom right, Top right
        type: 'poly'
    };

    if(restaurant) {
        var contentString = '<b>' + restaurant.name + '</b>' + '<br/>' + restaurant.locationLocality;

        restaurantInfoWindow = new google.maps.InfoWindow({
            content: contentString
        });

        var lat = parseFloat(restaurant.locationLatitude);
        var lng = parseFloat(restaurant.locationLongitude);
        var title = restaurant.name;
        var zindex = parseFloat("1");

        var marker = new google.maps.Marker({
            position: {lat: lat, lng: lng},
            map: map,
            icon: image,
            shape: shape,
            title: title,
            zIndex: zindex
        });
        restaurantLocation = marker;

        restaurantInfoWindow.open(map, marker);

        google.maps.event.addListener(marker, 'click', (function (marker, restaurantInfoWindow) {
            return function () {
                restaurantInfoWindow.open(map, marker);
                google.maps.event.addListener(map, 'click', function () {
                    restaurantInfoWindow.close();
                });
            };
        })(marker, restaurantInfoWindow));
    }
}

/**
 * Place Autocomplete and Directions
 * @constructor
 */
function AutocompleteDirectionsHandler(map) {
    this.map = map;
    this.originPlaceId = null;
    this.destinationPlaceId = null;
    this.travelMode = 'WALKING';

    var offRestaurantDirection = document.getElementById('offRestaurantDirection');
    var modeSelector = document.getElementById('mode-selector');
    this.directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);

    this.start = new google.maps.LatLng(currentLocation.position.lat(), currentLocation.position.lng());
    this.end = new google.maps.LatLng(restaurantLocation.position.lat(), restaurantLocation.position.lng());

    this.setupButtonClickListener('offRestaurantDirection');
    this.setupRadioClickListener('changemode-walking', 'WALKING');
    this.setupRadioClickListener('changemode-transit', 'TRANSIT');
    this.setupRadioClickListener('changemode-driving', 'DRIVING');

    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(offRestaurantDirection);
}

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
AutocompleteDirectionsHandler.prototype.setupRadioClickListener = function (id, mode) {
    var radioButton = document.getElementById(id);
    var me = this;
    radioButton.addEventListener('click', function () {
        me.travelMode = mode;
        me.route();
    });
};

AutocompleteDirectionsHandler.prototype.setupButtonClickListener = function (id) {
    var button = document.getElementById(id);
    var me = this;

    button.addEventListener('click', function () {
        directionsDisplay.setDirections({routes: []});
    });
};

AutocompleteDirectionsHandler.prototype.setupPlaceChangedListener = function (autocomplete, mode) {
    var me = this;
    autocomplete.bindTo('bounds', this.map);
    autocomplete.addListener('place_changed', function () {
        var place = autocomplete.getPlace();
        if (!place.place_id) {
            window.alert("Please select an option from the dropdown list.");
            return;
        }
        if (mode === 'ORIG') {
            me.originPlaceId = place.place_id;
        } else {
            me.destinationPlaceId = place.place_id;
        }
        me.route();
    });
};

AutocompleteDirectionsHandler.prototype.route = function () {
    var me = this;

    this.directionsService.route({
        //origin: {'placeId': this.originPlaceId},
        origin: this.start,
        //destination: {'placeId': this.destinationPlaceId},
        destination: this.end,
        travelMode: this.travelMode
    }, function (response, status) {
        if (status === 'OK') {
            directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status + ' and you are currently not in the Country.');
        }
    });
};

google.maps.event.addDomListener(window, 'load', initMap());