const express = require('express');
const async = require('async');
const request = require('request');
const viewsPath = __dirname + '/views/';
var router = express.Router();

var entity;
var entityID;
var entityType;
var entityLat;
var entityLon;
var radius;
var category;
var cuisine;
var establishment;

// Router
router.use(function (req, res, next) {
    console.log("Result page: /" + req.method);
    next();
});

// GET result page
router.post('/', function (clientReq, clientRes) {
    entity = clientReq.body.hiddenSelectedCity;
    entityID = clientReq.body.hiddenSelectedCityID;
    entityType = "city";
    entityLat = clientReq.body.hiddenSelectedCityLat;
    entityLon = clientReq.body.hiddenSelectedCityLon;
    radius = "1000";
    category = clientReq.body.hiddenSelectedCategory;
    cuisine = clientReq.body.hiddenSelectedCuisine;
    establishment = clientReq.body.hiddenSelectedEstablishments;
    console.log("Selected query: ",entity, entityID, entityType, entityLat, entityLon, radius, category, cuisine, establishment);

    var zomato = {
        apikey: "41545c45de7c80b47f11e144fb5f64cf"
    };

    var openWeather = {
        apikey: "8b21b42c1a896d7dc3aa6f8634683000"
    };

    function createZomatoCitySearch(apiType, entityID, entityType, offset, radius, category, cuisine, establishment) {
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
            'entity_id=' + entityID +
            '&entity_type=' + entityType +
            '&start=' + offset +
            '&radius=' + radius +
            '&cuisines=' + cuisine +
            '&establishment_type=' + establishment +
            '&category=' + category;
        defaultOptions.url += str;
        return defaultOptions;
    }

    function createZomatoCityWeather(apiType, entityLat, entityLon) {
        var defaultOptions = {
            url: 'https://api.openweathermap.org/data/2.5/',
            method: 'GET',
            headers: {
            },
            json: true
        };

        var str = apiType + '?' +
            '&lat=' + entityLat +
            '&lon=' + entityLon +
            '&appid=' + openWeather.apikey;
        defaultOptions.url += str;
        return defaultOptions;
    }

    var weatherSearch = createZomatoCityWeather("weather", entityLat, entityLon);
    var optionsSearch1 = createZomatoCitySearch("search", entityID, entityType, "0", radius, category, cuisine, establishment);
    var optionsSearch2 = createZomatoCitySearch("search", entityID, entityType, "20", radius, category, cuisine, establishment);
    var optionsSearch3 = createZomatoCitySearch("search", entityID, entityType, "40", radius, category, cuisine, establishment);
    var optionsSearch4 = createZomatoCitySearch("search", entityID, entityType, "60", radius, category, cuisine, establishment);
    var optionsSearch5 = createZomatoCitySearch("search", entityID, entityType, "80", radius, category, cuisine, establishment);
    var repetitiveSearchCountStart = 1;
    var repetitiveSearchCountEnd = 6;

    const options= [
        weatherSearch,
        optionsSearch1,
        optionsSearch2,
        optionsSearch3,
        optionsSearch4,
        optionsSearch5
    ];

    function multipleGet(options, callback) {
        request(options,
            function(err, res, body) {
                callback(err, body);
            }
        );
    }

    async.map(options, multipleGet, function (err, res){
        if (err) return console.log(err);

        var getRestaurantID = [];
        var getRestaurantName = [];
        var getRestaurantUrl = [];
        var getRestaurantLocationAddress = [];
        var getRestaurantLocationLocality = [];
        var getRestaurantLocationCity = [];
        var getRestaurantLocationCityID = [];
        var getRestaurantLocationLatitude = [];
        var getRestaurantLocationLongitude = [];
        var getRestaurantLocationZipCode = [];
        var getRestaurantLocationCountryID = [];
        var getRestaurantLocationLocalityVerbose = [];
        var getRestaurantCuisine = [];
        var getRestaurantCost = [];
        var getRestaurantCurrency = [];
        var getRestaurantThumbnail = [];
        var getRestaurantUserRatingAggregate = [];
        var getRestaurantUserRatingText = [];
        var getRestaurantUserRatingColor = [];
        var getRestaurantUserRatingVotes = [];
        var getRestaurantPhotoUrl = [];
        var getRestaurantImage = [];
        var getRestaurantDelivery = [];
        var getRestaurantBooking = [];
        var getRestaurantEstablishmentID = [];
        var getRestaurantEstablishmentName = [];

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
            location: res[0].name + ', ' + res[0].sys.country
        };
        console.log(weather);

        // Get Location
        var location = {
            cityName: entity,
            cityLat: entityLat,
            cityLng: entityLon
        };
        console.log(location);

        // Get Entity
        var entityObject = {
            entity: entity,
            entityID: entityID,
            entityLat: entityLat,
            entityLon: entityLon,
            category: category,
            cuisine: cuisine,
            establishment: establishment,
        };
        console.log(entity);

        // Get restaurants
        for (var i = repetitiveSearchCountStart; i < repetitiveSearchCountEnd; i++){
            for (var j = 0; j < res[i].restaurants.length; j++){
                getRestaurantID.push(res[i].restaurants[j].restaurant.id);
                getRestaurantName.push(res[i].restaurants[j].restaurant.name);
                getRestaurantUrl.push(res[i].restaurants[j].restaurant.url);
                getRestaurantLocationAddress.push(res[i].restaurants[j].restaurant.location.address);
                getRestaurantLocationLocality.push(res[i].restaurants[j].restaurant.location.locality);
                getRestaurantLocationCity.push(res[i].restaurants[j].restaurant.location.city);
                getRestaurantLocationCityID.push(res[i].restaurants[j].restaurant.location.city_id);
                getRestaurantLocationLatitude.push(res[i].restaurants[j].restaurant.location.latitude);
                getRestaurantLocationLongitude.push(res[i].restaurants[j].restaurant.location.longitude);
                getRestaurantLocationZipCode.push(res[i].restaurants[j].restaurant.location.zipcode);
                getRestaurantLocationCountryID.push(res[i].restaurants[j].restaurant.location.country_id);
                getRestaurantLocationLocalityVerbose.push(res[i].restaurants[j].restaurant.location.locality_verbose);
                getRestaurantCuisine.push(res[i].restaurants[j].restaurant.cuisines);
                getRestaurantCost.push(res[i].restaurants[j].restaurant.average_cost_for_two);
                getRestaurantCurrency.push(res[i].restaurants[j].restaurant.currency);
                getRestaurantThumbnail.push(res[i].restaurants[j].restaurant.thumb);
                getRestaurantUserRatingAggregate.push(res[i].restaurants[j].restaurant.user_rating.aggregate_rating);
                getRestaurantUserRatingText.push(res[i].restaurants[j].restaurant.user_rating.rating_text);
                getRestaurantUserRatingColor.push(res[i].restaurants[j].restaurant.user_rating.rating_color);
                getRestaurantUserRatingVotes.push(res[i].restaurants[j].restaurant.user_rating.votes);
                getRestaurantPhotoUrl.push(res[i].restaurants[j].restaurant.photos_url);
                getRestaurantImage.push(res[i].restaurants[j].restaurant.featured_image);
                getRestaurantDelivery.push(res[i].restaurants[j].restaurant.has_online_delivery);
                getRestaurantBooking.push(res[i].restaurants[j].restaurant.has_table_booking);
                if(res[i].restaurants[j].restaurant.establishment_types){
                    getRestaurantEstablishmentID.push(res[i].restaurants[j].restaurant.establishment_types.id);
                    getRestaurantEstablishmentName.push(res[i].restaurants[j].restaurant.establishment_types.name);
                } else {
                    getRestaurantEstablishmentID.push("0");
                    getRestaurantEstablishmentName.push("");
                }
            }
        }

        clientRes.render('result', {
            // Entity Info
            entity: entityObject,

            // Weather Info
            weather: weather,

            // Location Info
            location: location,

            // Restaurant Arrays
            restaurantID: getRestaurantID,
            restaurantName: getRestaurantName,
            restaurantUrl: getRestaurantUrl,
            restaurantLocationAddress: getRestaurantLocationAddress,
            restaurantLocationLocality: getRestaurantLocationLocality,
            restaurantLocationCity: getRestaurantLocationCity,
            restaurantLocationCityID: getRestaurantLocationCityID,
            restaurantLocationLatitude: getRestaurantLocationLatitude,
            restaurantLocationLongitude: getRestaurantLocationLongitude,
            restaurantLocationZipCode: getRestaurantLocationZipCode,
            restaurantLocationCountryID: getRestaurantLocationCountryID,
            restaurantLocationLocalityVerbose: getRestaurantLocationLocalityVerbose,
            restaurantCuisine: getRestaurantCuisine,
            restaurantCost: getRestaurantCost,
            restaurantCurrency: getRestaurantCurrency,
            restaurantThumbnail: getRestaurantThumbnail,
            restaurantUserRatingAggregate: getRestaurantUserRatingAggregate,
            restaurantUserRatingText: getRestaurantUserRatingText,
            restaurantUserRatingColor: getRestaurantUserRatingColor,
            restaurantUserRatingVotes: getRestaurantUserRatingVotes,
            restaurantPhotoUrl: getRestaurantPhotoUrl,
            restaurantImage: getRestaurantImage,
            restaurantDelivery: getRestaurantDelivery,
            restaurantBooking: getRestaurantBooking,
            restaurantEstablishmentID: getRestaurantEstablishmentID,
            restaurantEstablishmentName: getRestaurantEstablishmentName,
        });
    });
});

// GET restaurant LatLon for the map
router.get('/getMap', function (clientReq, clientRes) {
    entity = clientReq.query.entity;
    entityID = clientReq.query.entityID;
    entityType = "city";
    entityLat = clientReq.query.entityLat;
    entityLon = clientReq.query.entityLon;
    radius = "1000";
    category = clientReq.query.category;
    cuisine = clientReq.query.cuisine;
    establishment = clientReq.query.establishment;
    console.log("Get map details: ", entity, entityID, entityType, entityLat, entityLon, radius, category, cuisine, establishment);

    var zomato = {
        apikey: "41545c45de7c80b47f11e144fb5f64cf"
    };

    function createZomatoCitySearch(apiType, entityID, entityType, offset, radius, category, cuisine, establishment) {
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
            'entity_id=' + entityID +
            '&entity_type=' + entityType +
            '&start=' + offset +
            '&radius=' + radius +
            '&cuisines=' + cuisine +
            '&establishment_type=' + establishment +
            '&category=' + category;
        defaultOptions.url += str;
        return defaultOptions;
    }

    var optionsSearch1 = createZomatoCitySearch("search", entityID, entityType, "0", radius, category, cuisine, establishment);
    var optionsSearch2 = createZomatoCitySearch("search", entityID, entityType, "20", radius, category, cuisine, establishment);
    var optionsSearch3 = createZomatoCitySearch("search", entityID, entityType, "40", radius, category, cuisine, establishment);
    var optionsSearch4 = createZomatoCitySearch("search", entityID, entityType, "60", radius, category, cuisine, establishment);
    var optionsSearch5 = createZomatoCitySearch("search", entityID, entityType, "80", radius, category, cuisine, establishment);
    var repetitiveSearchCountStart = 0;
    var repetitiveSearchCountEnd = 5;

    const options= [
        optionsSearch1,
        optionsSearch2,
        optionsSearch3,
        optionsSearch4,
        optionsSearch5
    ];

    function multipleGet(options, callback) {
        request(options,
            function(err, res, body) {
                callback(err, body);
            }
        );
    }

    async.map(options, multipleGet, function (err, res){
        if (err) return console.log(err);

        var getRestaurantID = [];
        var getRestaurantName = [];
        var getRestaurantUrl = [];
        var getRestaurantLocationAddress = [];
        var getRestaurantLocationLocality = [];
        var getRestaurantLocationCity = [];
        var getRestaurantLocationCityID = [];
        var getRestaurantLocationLatitude = [];
        var getRestaurantLocationLongitude = [];
        var getRestaurantLocationZipCode = [];
        var getRestaurantLocationCountryID = [];
        var getRestaurantLocationLocalityVerbose = [];
        var getRestaurantCuisine = [];
        var getRestaurantCost = [];
        var getRestaurantCurrency = [];
        var getRestaurantThumbnail = [];
        var getRestaurantUserRatingAggregate = [];
        var getRestaurantUserRatingText = [];
        var getRestaurantUserRatingColor = [];
        var getRestaurantUserRatingVotes = [];
        var getRestaurantPhotoUrl = [];
        var getRestaurantImage = [];
        var getRestaurantDelivery = [];
        var getRestaurantBooking = [];
        var getRestaurantEstablishmentID = [];
        var getRestaurantEstablishmentName = [];

        // Get restaurants
        for (var i = repetitiveSearchCountStart; i < repetitiveSearchCountEnd; i++){
            for (var j = 0; j < res[i].restaurants.length; j++){
                getRestaurantID.push(res[i].restaurants[j].restaurant.id);
                getRestaurantName.push(res[i].restaurants[j].restaurant.name);
                getRestaurantUrl.push(res[i].restaurants[j].restaurant.url);
                getRestaurantLocationAddress.push(res[i].restaurants[j].restaurant.location.address);
                getRestaurantLocationLocality.push(res[i].restaurants[j].restaurant.location.locality);
                getRestaurantLocationCity.push(res[i].restaurants[j].restaurant.location.city);
                getRestaurantLocationCityID.push(res[i].restaurants[j].restaurant.location.city_id);
                getRestaurantLocationLatitude.push(res[i].restaurants[j].restaurant.location.latitude);
                getRestaurantLocationLongitude.push(res[i].restaurants[j].restaurant.location.longitude);
                getRestaurantLocationZipCode.push(res[i].restaurants[j].restaurant.location.zipcode);
                getRestaurantLocationCountryID.push(res[i].restaurants[j].restaurant.location.country_id);
                getRestaurantLocationLocalityVerbose.push(res[i].restaurants[j].restaurant.location.locality_verbose);
                getRestaurantCuisine.push(res[i].restaurants[j].restaurant.cuisines);
                getRestaurantCost.push(res[i].restaurants[j].restaurant.average_cost_for_two);
                getRestaurantCurrency.push(res[i].restaurants[j].restaurant.currency);
                getRestaurantThumbnail.push(res[i].restaurants[j].restaurant.thumb);
                getRestaurantUserRatingAggregate.push(res[i].restaurants[j].restaurant.user_rating.aggregate_rating);
                getRestaurantUserRatingText.push(res[i].restaurants[j].restaurant.user_rating.rating_text);
                getRestaurantUserRatingColor.push(res[i].restaurants[j].restaurant.user_rating.rating_color);
                getRestaurantUserRatingVotes.push(res[i].restaurants[j].restaurant.user_rating.votes);
                getRestaurantPhotoUrl.push(res[i].restaurants[j].restaurant.photos_url);
                getRestaurantImage.push(res[i].restaurants[j].restaurant.featured_image);
                getRestaurantDelivery.push(res[i].restaurants[j].restaurant.has_online_delivery);
                getRestaurantBooking.push(res[i].restaurants[j].restaurant.has_table_booking);
                if(res[i].restaurants[j].restaurant.establishment_types){
                    getRestaurantEstablishmentID.push(res[i].restaurants[j].restaurant.establishment_types.id);
                    getRestaurantEstablishmentName.push(res[i].restaurants[j].restaurant.establishment_types.name);
                } else {
                    getRestaurantEstablishmentID.push("0");
                    getRestaurantEstablishmentName.push("");
                }
            }
        }

        // Get Location
        var location = {
            cityName: entity,
            cityLat: entityLat,
            cityLng: entityLon,
        };
        console.log(location);

        // Get Restaurant
        var restaurantArray = {
            // Location Info
            location: location,

            // Restaurant Arrays
            restaurantID: getRestaurantID,
            restaurantName: getRestaurantName,
            restaurantUrl: getRestaurantUrl,
            restaurantLocationAddress: getRestaurantLocationAddress,
            restaurantLocationLocality: getRestaurantLocationLocality,
            restaurantLocationCity: getRestaurantLocationCity,
            restaurantLocationCityID: getRestaurantLocationCityID,
            restaurantLocationLatitude: getRestaurantLocationLatitude,
            restaurantLocationLongitude: getRestaurantLocationLongitude,
            restaurantLocationZipCode: getRestaurantLocationZipCode,
            restaurantLocationCountryID: getRestaurantLocationCountryID,
            restaurantLocationLocalityVerbose: getRestaurantLocationLocalityVerbose,
            restaurantCuisine: getRestaurantCuisine,
            restaurantCost: getRestaurantCost,
            restaurantCurrency: getRestaurantCurrency,
            restaurantThumbnail: getRestaurantThumbnail,
            restaurantUserRatingAggregate: getRestaurantUserRatingAggregate,
            restaurantUserRatingText: getRestaurantUserRatingText,
            restaurantUserRatingColor: getRestaurantUserRatingColor,
            restaurantUserRatingVotes: getRestaurantUserRatingVotes,
            restaurantPhotoUrl: getRestaurantPhotoUrl,
            restaurantImage: getRestaurantImage,
            restaurantDelivery: getRestaurantDelivery,
            restaurantBooking: getRestaurantBooking,
            restaurantEstablishmentID: getRestaurantEstablishmentID,
            restaurantEstablishmentName: getRestaurantEstablishmentName,
        };

        clientRes.send(restaurantArray);
    });
});

router.get('/back', function (clientReq, clientRes) {
    console.log("Selected query: ", entity, entityID, entityType, entityLat, entityLon, radius, category, cuisine, establishment);
    var zomato = {
        apikey: "41545c45de7c80b47f11e144fb5f64cf"
    };

    var openWeather = {
        apikey: "8b21b42c1a896d7dc3aa6f8634683000"
    };

    function createZomatoCitySearch(apiType, entityID, entityType, offset, radius, category, cuisine, establishment) {
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
            'entity_id=' + entityID +
            '&entity_type=' + entityType +
            '&start=' + offset +
            '&radius=' + radius +
            '&cuisines=' + cuisine +
            '&establishment_type=' + establishment +
            '&category=' + category;
        defaultOptions.url += str;
        return defaultOptions;
    }

    function createZomatoCityWeather(apiType, entityLat, entityLon) {
        var defaultOptions = {
            url: 'https://api.openweathermap.org/data/2.5/',
            method: 'GET',
            headers: {
            },
            json: true
        };

        var str = apiType + '?' +
            '&lat=' + entityLat +
            '&lon=' + entityLon +
            '&appid=' + openWeather.apikey;
        defaultOptions.url += str;
        return defaultOptions;
    }

    var weatherSearch = createZomatoCityWeather("weather", entityLat, entityLon);
    var optionsSearch1 = createZomatoCitySearch("search", entityID, entityType, "0", radius, category, cuisine, establishment);
    var optionsSearch2 = createZomatoCitySearch("search", entityID, entityType, "20", radius, category, cuisine, establishment);
    var optionsSearch3 = createZomatoCitySearch("search", entityID, entityType, "40", radius, category, cuisine, establishment);
    var optionsSearch4 = createZomatoCitySearch("search", entityID, entityType, "60", radius, category, cuisine, establishment);
    var optionsSearch5 = createZomatoCitySearch("search", entityID, entityType, "80", radius, category, cuisine, establishment);
    var repetitiveSearchCountStart = 1;
    var repetitiveSearchCountEnd = 6;

    const options= [
        weatherSearch,
        optionsSearch1,
        optionsSearch2,
        optionsSearch3,
        optionsSearch4,
        optionsSearch5
    ];

    function multipleGet(options, callback) {
        request(options,
            function(err, res, body) {
                callback(err, body);
            }
        );
    }

    async.map(options, multipleGet, function (err, res){
        if (err) return console.log(err);

        var getRestaurantID = [];
        var getRestaurantName = [];
        var getRestaurantUrl = [];
        var getRestaurantLocationAddress = [];
        var getRestaurantLocationLocality = [];
        var getRestaurantLocationCity = [];
        var getRestaurantLocationCityID = [];
        var getRestaurantLocationLatitude = [];
        var getRestaurantLocationLongitude = [];
        var getRestaurantLocationZipCode = [];
        var getRestaurantLocationCountryID = [];
        var getRestaurantLocationLocalityVerbose = [];
        var getRestaurantCuisine = [];
        var getRestaurantCost = [];
        var getRestaurantCurrency = [];
        var getRestaurantThumbnail = [];
        var getRestaurantUserRatingAggregate = [];
        var getRestaurantUserRatingText = [];
        var getRestaurantUserRatingColor = [];
        var getRestaurantUserRatingVotes = [];
        var getRestaurantPhotoUrl = [];
        var getRestaurantImage = [];
        var getRestaurantDelivery = [];
        var getRestaurantBooking = [];
        var getRestaurantEstablishmentID = [];
        var getRestaurantEstablishmentName = [];

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
            location: res[0].name + ', ' + res[0].sys.country
        };
        console.log(weather);

        // Get Location
        var location = {
            cityName: entity,
            cityLat: entityLat,
            cityLng: entityLon
        };
        console.log(location);

        // Get Entity
        var entityObject = {
            entity: entity,
            entityID: entityID,
            entityLat: entityLat,
            entityLon: entityLon,
            category: category,
            cuisine: cuisine,
            establishment: establishment,
        };
        console.log(entity);

        // Get restaurants
        for (var i = repetitiveSearchCountStart; i < repetitiveSearchCountEnd; i++){
            for (var j = 0; j < res[i].restaurants.length; j++){
                getRestaurantID.push(res[i].restaurants[j].restaurant.id);
                getRestaurantName.push(res[i].restaurants[j].restaurant.name);
                getRestaurantUrl.push(res[i].restaurants[j].restaurant.url);
                getRestaurantLocationAddress.push(res[i].restaurants[j].restaurant.location.address);
                getRestaurantLocationLocality.push(res[i].restaurants[j].restaurant.location.locality);
                getRestaurantLocationCity.push(res[i].restaurants[j].restaurant.location.city);
                getRestaurantLocationCityID.push(res[i].restaurants[j].restaurant.location.city_id);
                getRestaurantLocationLatitude.push(res[i].restaurants[j].restaurant.location.latitude);
                getRestaurantLocationLongitude.push(res[i].restaurants[j].restaurant.location.longitude);
                getRestaurantLocationZipCode.push(res[i].restaurants[j].restaurant.location.zipcode);
                getRestaurantLocationCountryID.push(res[i].restaurants[j].restaurant.location.country_id);
                getRestaurantLocationLocalityVerbose.push(res[i].restaurants[j].restaurant.location.locality_verbose);
                getRestaurantCuisine.push(res[i].restaurants[j].restaurant.cuisines);
                getRestaurantCost.push(res[i].restaurants[j].restaurant.average_cost_for_two);
                getRestaurantCurrency.push(res[i].restaurants[j].restaurant.currency);
                getRestaurantThumbnail.push(res[i].restaurants[j].restaurant.thumb);
                getRestaurantUserRatingAggregate.push(res[i].restaurants[j].restaurant.user_rating.aggregate_rating);
                getRestaurantUserRatingText.push(res[i].restaurants[j].restaurant.user_rating.rating_text);
                getRestaurantUserRatingColor.push(res[i].restaurants[j].restaurant.user_rating.rating_color);
                getRestaurantUserRatingVotes.push(res[i].restaurants[j].restaurant.user_rating.votes);
                getRestaurantPhotoUrl.push(res[i].restaurants[j].restaurant.photos_url);
                getRestaurantImage.push(res[i].restaurants[j].restaurant.featured_image);
                getRestaurantDelivery.push(res[i].restaurants[j].restaurant.has_online_delivery);
                getRestaurantBooking.push(res[i].restaurants[j].restaurant.has_table_booking);
                if(res[i].restaurants[j].restaurant.establishment_types){
                    getRestaurantEstablishmentID.push(res[i].restaurants[j].restaurant.establishment_types.id);
                    getRestaurantEstablishmentName.push(res[i].restaurants[j].restaurant.establishment_types.name);
                } else {
                    getRestaurantEstablishmentID.push("0");
                    getRestaurantEstablishmentName.push("");
                }
            }
        }

        clientRes.render('result', {
            // Entity Info
            entity: entityObject,

            // Weather Info
            weather: weather,

            // Location Info
            location: location,

            // Restaurant Arrays
            restaurantID: getRestaurantID,
            restaurantName: getRestaurantName,
            restaurantUrl: getRestaurantUrl,
            restaurantLocationAddress: getRestaurantLocationAddress,
            restaurantLocationLocality: getRestaurantLocationLocality,
            restaurantLocationCity: getRestaurantLocationCity,
            restaurantLocationCityID: getRestaurantLocationCityID,
            restaurantLocationLatitude: getRestaurantLocationLatitude,
            restaurantLocationLongitude: getRestaurantLocationLongitude,
            restaurantLocationZipCode: getRestaurantLocationZipCode,
            restaurantLocationCountryID: getRestaurantLocationCountryID,
            restaurantLocationLocalityVerbose: getRestaurantLocationLocalityVerbose,
            restaurantCuisine: getRestaurantCuisine,
            restaurantCost: getRestaurantCost,
            restaurantCurrency: getRestaurantCurrency,
            restaurantThumbnail: getRestaurantThumbnail,
            restaurantUserRatingAggregate: getRestaurantUserRatingAggregate,
            restaurantUserRatingText: getRestaurantUserRatingText,
            restaurantUserRatingColor: getRestaurantUserRatingColor,
            restaurantUserRatingVotes: getRestaurantUserRatingVotes,
            restaurantPhotoUrl: getRestaurantPhotoUrl,
            restaurantImage: getRestaurantImage,
            restaurantDelivery: getRestaurantDelivery,
            restaurantBooking: getRestaurantBooking,
            restaurantEstablishmentID: getRestaurantEstablishmentID,
            restaurantEstablishmentName: getRestaurantEstablishmentName,
        });
    });
});

module.exports = router;
