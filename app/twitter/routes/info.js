const express = require('express');
const async = require('async');
const request = require('request');
const viewsPath = __dirname + '/views/';
var router = express.Router();

var restaurantID;

// Router
router.use(function (req, res, next) {
    console.log("Info page: /" + req.method);
    next();
});

// GET back to result page
router.get('/back', function (clientReq, clientRes) {
    clientRes.redirect('/result/back');
});

// GET restaurant LatLon for the map
router.get('/getMap', function (clientReq, clientRes) {
    restaurantID = clientReq.query.restaurantID;
    console.log("Get map details, restaurant ID:" + restaurantID);

    var zomato = {
        apikey: "41545c45de7c80b47f11e144fb5f64cf"
    };

    function createZomatoRestaurantSearch(apiType, restaurantID) {
        var defaultOptions = {
            url: 'https://developers.zomato.com/api/v2.1/',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'user-key': zomato.apikey // Zomato API Key
            },
            json: true
        };

        var str = apiType + '?' +
            'res_id=' + restaurantID;
        defaultOptions.url += str;
        return defaultOptions;
    }

    var restaurantSearch = createZomatoRestaurantSearch("restaurant", restaurantID);

    const firstRoundOptions= [
        restaurantSearch
    ];

    function multipleGet(options, callback) {
        request(options,
            function(err, res, body) {
                callback(err, body);
            }
        );
    }

    async.map(firstRoundOptions, multipleGet, function (err, res){
        if (err) return console.log(err);

        // Get Restaurant
        var restaurant = {
            id: res[0].id,
            name: res[0].name,
            url: res[0].url,
            locationAddress: res[0].location.address,
            locationLocality: res[0].location.locality,
            locationCity: res[0].location.city,
            locationCityID: res[0].location.city_id,
            locationLatitude: res[0].location.latitude,
            locationLongitude: res[0].location.longitude,
            locationZipCode: res[0].location.zipcode,
            locationCountryID: res[0].location.country_id,
            locationLocalityVerbose: res[0].location.locality_verbose,
            cuisine: res[0].cuisines,
            cost: res[0].average_cost_for_two,
            priceRange: res[0].price_range,
            currency: res[0].currency,
            thumbnail: res[0].thumb,
            userRatingAggregate: res[0].user_rating.aggregate_rating,
            userRatingText: res[0].user_rating.rating_text,
            userRatingColor: res[0].user_rating.rating_color,
            userRatingVotes: res[0].user_rating.votes,
            photoUrl: res[0].photos_url,
            menuUrl: res[0].menu_url,
            featuredImage: res[0].featured_image,
            delivery: res[0].has_online_delivery,
            booking: res[0].has_table_booking,
            bookingUrl: "",
            eventsUrl: res[0].events_url
        };

        if(res[0].has_online_delivery === 1){
            restaurant.delivery = "Yes";
        } else {
            restaurant.delivery = "No";
        }
        if(res[0].has_table_booking === 1){
            restaurant.booking = "Yes";
            restaurant.bookingUrl = res[0].book_url;
        } else {
            restaurant.booking = "No";
            restaurant.bookingUrl = "No Booking Available";
        }

        // console.log(restaurant);
        clientRes.send(restaurant);
    });
});

// GET info page
router.get('/:id', function (clientReq, clientRes) {
    restaurantID = clientReq.params.id;
    console.log("Get restaurant details, restaurant ID:" + restaurantID);

    var zomato = {
        apikey: "41545c45de7c80b47f11e144fb5f64cf"
    };

    var openWeather = {
        apikey: "8b21b42c1a896d7dc3aa6f8634683000"
    };

    function createZomatoRestaurantSearch(apiType, restaurantID) {
        var defaultOptions = {
            url: 'https://developers.zomato.com/api/v2.1/',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'user-key': zomato.apikey // Zomato API Key
            },
            json: true
        };

        var str = apiType + '?' +
            'res_id=' + restaurantID;
        defaultOptions.url += str;
        return defaultOptions;
    }

    function createZomatoRestaurantWeatherCurrent(apiType, restaurantLat, restaurantLon) {
        var defaultOptions = {
            url: 'https://api.openweathermap.org/data/2.5/',
            method: 'GET',
            headers: {
            },
            json: true
        };

        var str = apiType + '?' +
            '&lat=' + restaurantLat +
            '&lon=' + restaurantLon +
            '&appid=' + openWeather.apikey;
        defaultOptions.url += str;
        return defaultOptions;
    }

    var restaurantSearch = createZomatoRestaurantSearch("restaurant", restaurantID);

    const firstRoundOptions= [
        restaurantSearch
    ];

    function multipleGet(options, callback) {
        request(options,
            function(err, res, body) {
                callback(err, body);
            }
        );
    }

    async.map(firstRoundOptions, multipleGet, function (err, res){
        if (err) return console.log(err);

        // Get Restaurant
        var restaurant = {
            id: res[0].id,
            name: res[0].name,
            url: res[0].url,
            locationAddress: res[0].location.address,
            locationLocality: res[0].location.locality,
            locationCity: res[0].location.city,
            locationCityID: res[0].location.city_id,
            locationLatitude: res[0].location.latitude,
            locationLongitude: res[0].location.longitude,
            locationZipCode: res[0].location.zipcode,
            locationCountryID: res[0].location.country_id,
            locationLocalityVerbose: res[0].location.locality_verbose,
            cuisine: res[0].cuisines,
            cost: res[0].average_cost_for_two,
            priceRange: res[0].price_range,
            currency: res[0].currency,
            thumbnail: res[0].thumb,
            userRatingAggregate: res[0].user_rating.aggregate_rating,
            userRatingText: res[0].user_rating.rating_text,
            userRatingColor: res[0].user_rating.rating_color,
            userRatingVotes: res[0].user_rating.votes,
            photoUrl: res[0].photos_url,
            menuUrl: res[0].menu_url,
            featuredImage: res[0].featured_image,
            delivery: res[0].has_online_delivery,
            booking: res[0].has_table_booking,
            bookingUrl: "",
            eventsUrl: res[0].events_url
        };

        if(res[0].has_online_delivery === 1){
            restaurant.delivery = "Yes";
        } else {
            restaurant.delivery = "No";
        }
        if(res[0].has_table_booking === 1){
            restaurant.booking = "Yes";
            restaurant.bookingUrl = res[0].book_url;
        } else {
            restaurant.booking = "No";
            restaurant.bookingUrl = "No Booking Available";
        }
        console.log(restaurant);

        var restaurantWeatherCurrentSearch = createZomatoRestaurantWeatherCurrent("weather", res[0].location.latitude, res[0].location.longitude);

        const secondRoundOptions= [
            restaurantWeatherCurrentSearch
        ];

        async.map(secondRoundOptions, multipleGet, function (err, res){
            if (err) return console.log(err);

            // Get Weather
            var weatherurl = 'https://openweathermap.org/img/w/'; //http://openweathermap.org/img/w/10d.png
            var weather = {
                name: res[0].weather[0].main,
                description: res[0].weather[0].description,
                icon: weatherurl + res[0].weather[0].icon + '.png',
                temperature: (res[0].main.temp - 273.15).toFixed(2),
                pressure: res[0].main.pressure,
                humidity: res[0].main.humidity,
                temperatureMin: res[0].main.temp_min - 273.15,
                temperatureMax: res[0].main.temp_max - 273.15,
                windSpeed: res[0].wind.speed,
                windDegree: res[0].wind.deg,
                location: res[0].name + ', ' + res[0].sys.country,
                lat: res[0].coord.lat,
                lon: res[0].coord.lon,
            };
            console.log(weather);

            // Get Location
            var location = {
                locationName: weather.location,
                locationLat: restaurant.locationLatitude,
                locationLng: restaurant.locationLongitude
            };
            console.log(location);

            clientRes.render('info', {
                // Weather Info
                weather: weather,

                // Restaurant Info
                restaurant: restaurant,

                // Location Info
                location: location,
            });
        });
    });
});

module.exports = router;
