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

    // Pass selected option into hidden value to allow
    // the option's id to be pass into the POST.
    $('#formControlSelectCategory').on('change', function () {
        var selected = $(':selected', this).prop('id');
        $('#hiddenSelectedCategory').val(selected);
    });
    $('#formControlSelectCuisine').on('change', function () {
        var selected = $(':selected', this).prop('id');
        $('#hiddenSelectedCuisine').val(selected);
    });
    $('#formControlSelectEstablishments').on('change', function () {
        var selected = $(':selected', this).prop('id');
        $('#hiddenSelectedEstablishments').val(selected);
    });

    // Update City List when user searches for a city;
    // Select city to create form
    // Ajax request, route to routes/index -> Zomato API
    // -> return to routes/index -> return to js/index
    $('#searchCity').on('input', function (event) {
        var input = $('#searchCity').val();

        var city = "";
        var cityId = 0;

        if ($('#cityNames option').filter(function () {
                if(this.value === input){
                    city = this.value;
                    cityId = this.id;
                    return this.value === input;
                }
            }).length) {

            // Get Zomato city parameters
            $.ajax({
                url: '/getCity',
                type: 'GET',
                cache: true,
                data: { city: city, cityID: cityId },
                success: function (data) {
                    var allID = "0";
                    var allName = "All Options";

                    // Selected City
                    $('#hiddenSelectedCity').val(data.latLon[0].cityName);
                    $('#hiddenSelectedCityID').val(data.latLon[0].cityID);
                    $('#hiddenSelectedCityLat').val(data.latLon[0].lat);
                    $('#hiddenSelectedCityLon').val(data.latLon[0].lon);

                    // Select Category
                    $('#formControlSelectCategory').empty();
                    $('#formControlSelectCategory').append("<option id='" + allID + "' value='" + allName + "' selected>" + allName + "</option>");
                    for (var i = 0; i < data.categories.length; i++) {
                        // Drop down List
                        $('#formControlSelectCategory').append("<option id='" + data.categories[i].id + "' value='" + data.categories[i].name + "'>" + data.categories[i].name + "</option>");
                    }

                    // Select Cuisine
                    $('#formControlSelectCuisine').empty();
                    $('#formControlSelectCuisine').append("<option id='" + allID + "' value='" + allName + "' selected>" + allName + "</option>");
                    for (var i = 0; i < data.cuisines.length; i++) {
                        // Drop down List
                        $('#formControlSelectCuisine').append("<option id='" + data.cuisines[i].id + "' value='" + data.cuisines[i].name + "'>" + data.cuisines[i].name + "</option>");
                    }

                    // Select Establishments
                    $('#formControlSelectEstablishments').empty();
                    $('#formControlSelectEstablishments').append("<option id='" + allID + "' value='" + allName + "' selected>" + allName + "</option>");
                    for (var i = 0; i < data.establishments.length; i++) {
                        // Drop down List
                        $('#formControlSelectEstablishments').append("<option id='" + data.establishments[i].id + "' value='" + data.establishments[i].name + "'>" + data.establishments[i].name + "</option>");
                    }

                    // Initialise the All options into the hidden inputs
                    $('#hiddenSelectedCategory').val(allID);
                    $('#hiddenSelectedCuisine').val(allID);
                    $('#hiddenSelectedEstablishments').val(allID);

                    // Unlock the form
                    $('#formControlSelectCategory').prop('disabled', false);
                    $('#formControlSelectCuisine').prop('disabled', false);
                    $('#formControlSelectEstablishments').prop('disabled', false);
                    $('#formSubmit').prop('disabled', false);
                }
                , error: function (jqXHR, textStatus, err) {
                    console.log('Text Status ' + textStatus + ', Err ' + err)
                }
            });
        } else {
            // Lock the form
            $('#formControlSelectCategory').prop('disabled', true);
            $('#formControlSelectCuisine').prop('disabled', true);
            $('#formControlSelectEstablishments').prop('disabled', true);
            $('#formSubmit').prop('disabled', true);

            // Continue Update City List
            $.ajax({
                url: '/searchCity',
                type: 'GET',
                cache: true,
                data: {city: input},
                success: function (data) {
                    $('#cityNames').empty();
                    for (var i = 0; i < data.length; i++) {
                        // Drop down List
                        $('#cityNames').append("<option id='" + data[i].id + "' value='" + data[i].name + "'>");
                    }
                }
                , error: function (jqXHR, textStatus, err) {
                    console.log('Text Status ' + textStatus + ', Err ' + err)
                }
            });
        }
    });
})(jQuery); // End of use strict
