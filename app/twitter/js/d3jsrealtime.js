// D3 Live Charts
var limit = 60 * 1,
    duration = 750,
    now = new Date(Date.now() - duration);

var width = 500,
    height = 200;

var groupsTopic = {
    Total: {
        value: 0,
        color: 'blue',
        data: d3.range(limit).map(function() {
            return 0
        })
    },
    Positive: {
        value: 0,
        color: 'green',
        data: d3.range(limit).map(function() {
            return 0
        })
    },
    Neutral: {
        value: 0,
        color: 'yellow',
        data: d3.range(limit).map(function() {
            return 0
        })
    },
    Negative: {
        value: 0,
        color: 'red',
        data: d3.range(limit).map(function() {
            return 0
        })
    }
};

var x = d3.time.scale()
    .domain([now - (limit - 2), now - duration])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, 100])
    .range([height, 0]);

var line = d3.svg.line()
    .interpolate('basis')
    .x(function(d, i) {
        return x(now - (limit - 1 - i) * duration)
    })
    .y(function(d) {
        return y(d)
    });



// Sentiment Chart
var svgSentiment = d3.select('.graphSentiment').append('svg')
    .attr('class', 'chart')
    .attr('width', width)
    .attr('height', height + 50);

var axisSentiment = svgSentiment.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(x.axis = d3.svg.axis().scale(x).orient('bottom'));

var pathsSentiment = svgSentiment.append('g');







// Topic Chart
var svgTopic = d3.select('.graphTopic').append('svg')
    .attr('class', 'chart')
    .attr('width', width)
    .attr('height', height + 50);

var axisTopic = svgTopic.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(x.axis = d3.svg.axis().scale(x).orient('bottom'))
    .text("Time");

svgTopic.append('g')
    .attr('class', 'y axis')
    .call(y.axis = d3.svg.axis().scale(y).orient('left'))
    // .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .attr("fill", "#000")
    .text("Number of tweets");

var pathsTopic = svgTopic.append('g');

for (var name in groupsTopic) {
    var group = groupsTopic[name];
    // group.path = pathsSentiment.append('path')
    //     .data([group.data])
    //     .attr('class', name + ' group')
    //     .style('stroke', group.color);

    group.path = pathsTopic.append('path')
        .data([group.data])
        .attr('class', name + ' group')
        .style('stroke', group.color);
}

function tick() {
    now = new Date();

    // Add new values
    for (var name in groupsTopic) {
        var group = groupsTopic[name];
        //group.data.push(group.value) // Real values arrive at irregular intervals
        group.data.push((Math.random() * 100) + 1);
        group.path.attr('d', line)
    }

    // Shift domain
    x.domain([now - (limit - 2) * duration, now - duration]);
    y.domain([0, 200]);

    // Slide x-axis left
    // axisSentiment.transition()
    //     .duration(duration)
    //     .ease('linear')
    //     .call(x.axis);
    //
    // // Slide paths left
    // pathsSentiment.attr('transform', null)
    //     .transition()
    //     .duration(duration)
    //     .ease('linear')
    //     .attr('transform', 'translate(' + x(now - (limit - 1) * duration) + ')')
    //     .each('end', tick);

    // Slide x-axis left
    axisTopic.transition()
        .duration(duration)
        .ease('linear')
        .call(x.axis);


    // Slide paths left
    pathsTopic.attr('transform', null)
        .transition()
        .duration(duration)
        .ease('linear')
        .attr('transform', 'translate(' + x(now - (limit - 1) * duration) + ')')
        .each('end', tick);

    // Remove oldest data point from each group
    for (var name in groupsTopic) {
        var group = groupsTopic[name];
        group.data.shift()
    }
}

tick();