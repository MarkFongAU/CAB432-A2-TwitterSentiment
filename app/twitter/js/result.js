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
var map, currentInfoWindow, currentLocation;

function initMap() {
    // Get restaurant details for the map
    var entity = $('#hiddenSelectedCity').val();
    var entityID = $('#hiddenSelectedCityID').val();
    var entityLat = $('#hiddenSelectedCityLat').val();
    var entityLon = $('#hiddenSelectedCityLon').val();
    var category = $('#hiddenSelectedCategory').val();
    var cuisine = $('#hiddenSelectedCuisine').val();
    var establishment = $('#hiddenSelectedEstablishments').val();

    $.ajax({
        url: '/result/getMap',
        type: 'GET',
        cache: true,
        data: {
            entity: entity,
            entityID: entityID,
            entityLat: entityLat,
            entityLon: entityLon,
            category: category,
            cuisine: cuisine,
            establishment: establishment,
        },
        success: function (restaurantArray) {
            var lat = parseFloat(restaurantArray.location.cityLat);
            var lng = parseFloat(restaurantArray.location.cityLng);

            map = new google.maps.Map(document.getElementById('map'), {
                mapTypeControl: true,
                center: {lat: lat, lng: lng},
                zoom: 13
            });
            currentInfoWindow = new google.maps.InfoWindow;

            // Try HTML5 geolocation.
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

                }, function () {
                    handleLocationError(true, currentInfoWindow, map.getCenter());
                });
            } else {
                // Browser doesn't support Geolocation
                handleLocationError(false, currentInfoWindow, map.getCenter());
            }
            // Restaurant Markers
            setMarkers(map, restaurantArray);

            // Place Autocomplete and Directions
            new AutocompleteDirectionsHandler(map);
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
function setMarkers(map, restaurantArray) {
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

    if (restaurantArray.restaurantID) {
        for (var i = 0; i < restaurantArray.restaurantID.length; i++) {

            var contentString = '<a href="/info/' + restaurantArray.restaurantID[i] + '"><img src="' + restaurantArray.restaurantThumbnail[i] + '" alt="No restaurant Image" style="height: 100px; width: 200px" onerror="this.onerror=null;this.src=\'https://placehold.it/250x100?text=No Image\';"></a>' +
                '<br/>' + '<b><a href="/info/' + restaurantArray.restaurantID[i] + '">' + restaurantArray.restaurantName[i] + '</a></b>' +
                '<br/>' + '<b class="text-muted">' + restaurantArray.restaurantCuisine[i] + '</b>' +
                '<br/>' + restaurantArray.restaurantLocationLocality[i];

            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            var lat = parseFloat(restaurantArray.restaurantLocationLatitude[i]);
            var lng = parseFloat(restaurantArray.restaurantLocationLongitude[i]);
            var title = restaurantArray.restaurantName[i];
            var zindex = parseFloat(i);

            var marker = new google.maps.Marker({
                position: {lat: lat, lng: lng},
                map: map,
                icon: image,
                shape: shape,
                title: title,
                zIndex: zindex
            });

            google.maps.event.addListener(marker, 'click', (function (marker, infowindow) {
                return function () {
                    infowindow.open(map, marker);
                    google.maps.event.addListener(map, 'click', function () {
                        infowindow.close();
                    });
                };
            })(marker, infowindow));
        }
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
    var originInput = document.getElementById('origin-input');
    var destinationInput = document.getElementById('destination-input');
    var modeSelector = document.getElementById('mode-selector');
    this.directionsService = new google.maps.DirectionsService;
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsDisplay.setMap(map);

    var originAutocomplete = new google.maps.places.Autocomplete(
        originInput, {placeIdOnly: true});
    var destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput, {placeIdOnly: true});

    this.setupClickListener('changemode-walking', 'WALKING');
    this.setupClickListener('changemode-transit', 'TRANSIT');
    this.setupClickListener('changemode-driving', 'DRIVING');

    this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
    this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
}

// Sets a listener on a radio button to change the filter type on Places
// Autocomplete.
AutocompleteDirectionsHandler.prototype.setupClickListener = function (id, mode) {
    var radioButton = document.getElementById(id);
    var me = this;
    radioButton.addEventListener('click', function () {
        me.travelMode = mode;
        me.route();
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
    if (!this.originPlaceId || !this.destinationPlaceId) {
        return;
    }
    var me = this;

    this.directionsService.route({
        origin: {'placeId': this.originPlaceId},
        destination: {'placeId': this.destinationPlaceId},
        travelMode: this.travelMode
    }, function (response, status) {
        if (status === 'OK') {
            me.directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
};

google.maps.event.addDomListener(window, 'load', initMap());


