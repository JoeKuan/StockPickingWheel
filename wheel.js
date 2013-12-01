var chart = null;
$(function () {
    $(document).ready(function() {

        // Range of color 
        var redThreshold = { below: -3, color: '#C91616' },
        orangeThreshold = { below: 0, color: '#DB8700' },
        greenThreshold = { below: 3, color: '#1E8F09' },
        blueThreshold = { below: 9999, color: '#0C13E8' };
        zeroColor = '#8A8A8A', zeroLightColor = '#B5B5B5';

        // Get max and min of percent range
        var maxPercent = 0, minPercent = 0;
        var orangeMaxPct, greenMaxPct;
        $.each(data, function(index, stock) {
            if (stock.percent !== undefined) {
                maxPercent = Math.max(maxPercent, stock.percent);
                minPercent = Math.min(minPercent, stock.percent);
            }
        });

        // Based on the percentage range, set the brightness in that
        // color range
        // First one has the lowerest value (can be in negative)
        $.each(data, function(index, stock) {
            var ratio = 0;
            if (stock.percent === undefined) {
                // Dummy slices
                stock.color = 'white';
                stock.name = '';
            } else if (stock.percent < redThreshold.below) {
                ratio = (1 - (stock.percent / minPercent)) * 0.2;
                stock.color = {
                    radialGradient: { cx: 0.5, cy: 0.5, r: 0.4 },
                    stops: [
                        [0.65, redThreshold.color ],
                        [1.0, Highcharts.Color(redThreshold.color).brighten(ratio).get() ]
                    ]
                }; 
                // Highcharts.Color(redThreshold.color).brighten(ratio).get();
            } else if (stock.percent < orangeThreshold.below) {
                ratio = (1 - (stock.percent / redThreshold.below)) * 0.2;
                stock.color = {
                    radialGradient: { cx: 0.5, cy: 0.5, r: 0.4 },
                    stops: [
                        [0.65, orangeThreshold.color ],
                        [1.0, Highcharts.Color(orangeThreshold.color).brighten(ratio).get() ]
                    ]
                }; 
                // Highcharts.Color(orangeThreshold.color).brighten(ratio).get();
            } else if (stock.percent == 0) {
                // No change - shouldn't have any color gradient
                stock.color = {
                    radialGradient: { cx: 0.5, cy: 0.5, r: 0.4 },
                    stops: [
                        [0.65, zeroColor ],
                        [1.0,  zeroLightColor ]
                    ]
                };
            } else if (stock.percent < 3.0)  {
                ratio = (1 - (stock.percent / greenThreshold.below)) * 0.2;
                stock.color = {
                    radialGradient: { cx: 0.5, cy: 0.5, r: 0.4 },
                    stops: [
                        [0.65, greenThreshold.color ],
                        [1.0, Highcharts.Color(greenThreshold.color).brighten(ratio).get() ]
                    ]
                }; //Highcharts.Color(greenThreshold.color).brighten(ratio).get();
            } else {
                ratio = (1 - (stock.percent / maxPercent)) * 0.2;
                stock.color = {
                    radialGradient: { cx: 0.5, cy: 0.5, r: 0.4 },
                    stops: [
                        [0.65, blueThreshold.color ],
                        [1, Highcharts.Color(blueThreshold.color).brighten(ratio).get() ]
                    ]
                };
                // Highcharts.Color(blueThreshold.color).brighten(ratio).get();
            }
        });
        // Create the chart
        var selectSlice = null, selectText = null, selectValText = null;

        chart = new Highcharts.Chart({
            chart: {
                renderTo: 'container',
                type: 'pie',
                marginRight: 30,
                events: {
                    load: function() {
                        $.each(this.series[0].data, function(index, point) {

                            console.log(point);

                            var degree = (point.angle * 180) / Math.PI;
                            var rotation = 0;
                            (degree < 0) && (degree += 360);

                            // If the slice is in the left half, then rotate 180
                            // so the text won't look upside down
                            if (degree >= 90 && degree <= 270) {
                                rotation = degree - 180;
                                point.dataLabel.x = 0;
                                point.dataLabel.y = 0;
                                // Not sure this is a good way to align opposite directional text
                                point.dataLabel.translateX = (point.labelPos[2] + point.labelPos[4]) / 2;
                                point.dataLabel.translateY = (point.labelPos[3] + point.labelPos[5]) / 2;
                            } else {
                                point.dataLabel.x = 0;
                                point.dataLabel.y = 0;
                                rotation = degree;
                                point.dataLabel.translateX = point.labelPos[0];
                                point.dataLabel.translateY = point.labelPos[1];
                            }
                            
                            if (point.color.stops) {
                                console.log(point);
                                point.graphic.attr({
                                    stroke: point.color.stops[1][1],
                                    "stroke-width": 1,
                                    "stroke-linejoin": 'none'
                                });
                            }

                            point.dataLabel.rotation = Math.floor(rotation);
                            point.dataLabel.show();
                            point.dataLabel.updateTransform();

                            if (point.name.length) {
                                var angle = point.angle;
                                var valStr = Highcharts.numberFormat(point.percent, 2) + '%';
                                var distance = point.shapeArgs.r;
                                var width = (valStr.length * 10);

                                if (degree >= 90 && degree <= 270) {
                                    // Left half
                                    distance = point.shapeArgs.r + width - 10 ;
                                    angle = angle * 0.997;
                                } else {
                                    // Right half
                                    angle = angle * 1.003;
                                    distance = point.shapeArgs.r + 10;
                                }

                                var x2 = point.shapeArgs.x + 10 + Math.cos(angle) * distance ;
                                var y2 = point.shapeArgs.y + 10 + Math.sin(angle) * distance;
                                point.valText = point.series.chart.renderer.text(valStr, x2, y2)
                                    .attr({ 
                                        rotation: rotation
                                    })
                                    .css({
                                        fontSize: '10px',
                                        color: point.color.stops ? point.color.stops[1][1] : point.color
                                    })
                                    .add().show();
                            }
                        });

                        // Render the select slice
                        // Get the first slice dimension and enlarge it
                        var slice = this.series[0].points[0];
                        selectSlice = this.renderer.arc(slice.graphic.x, slice.graphic.y,
                                                        slice.graphic.width * 1.07, slice.graphic.width * 0.52,
                                                        (-7 / 180) * Math.PI, (3 / 180) * Math.PI)
                            .attr({
                                'zIndex': 8
                            })
	                    .add()
                            .shadow(true)
                            .hide();

                        // The text's x location is the center + x multiply with fraction of radius value
                        // In between the arc inner and outer radius values
                        // The text's y location is the center + align center with the font size
                        selectText = this.renderer.text("", 
                                                        slice.graphic.x * 1.8, slice.graphic.y - 3)
                            .attr({
                                'zIndex': 8
                            })
                            .css({
                                color: '#F8F8F8',
                                fontSize: '18px'
                            })
                            .add()
                            .hide();

                        // Value text appears next to the select slice
                        selectValText = this.renderer.text("", 
                                                           slice.graphic.x * 1.8, slice.graphic.y - 3)
                            .attr({
                                'zIndex': 8
                            })
                            .css({
                                color: '#F8F8F8',
                                'text-shadow': '2px 2px #E8E8E8',
                                fontSize: '18px'
                            })
                            .add()
                            .hide();
                    }
                }
            },
            title: { text: null },
            series: [{
                name: 'FTSE 100',
                data: data,
                innerSize: '45%'
            }],
            tooltip: {
                enabled: false
            },
            plotOptions: {
                pie: {
                    size: '87%',
                    cursor: 'pointer',
                    startAngle: 87,
                    borderWidth: 0,
                    borderColor: '#FFFFFF',
                    shadow: false,
                    dataLabels: {
                        connectorWidth: 0,
                        color: '#F8F8F8',
                        distance: -90,
                        padding: -6,
                        style: {
                            fontSize: '10px'
                        }
                    },
                    events: {
                        mouseOut: function() {
                            selectSlice.hide();
                            selectText.hide();
                            selectValText.hide();
                        }
                    },
                    point: {
                        events: {
                            mouseOut: function() {
                                if (this.name) {
                                    this.valText
                                        .css({
                                            fontWeight: 'normal',
                                            fontSize: '10px'
                                        });
                                }
                            },
                            mouseOver: function() {

                                // If hover over hidden slice, then don't show it
                                if (this.name) {
                                    // Set the value text to bold
                                    this.valText
                                        .css({
                                            fontWeight: 'bold',
                                            fontSize: '12px'
                                        });

                                    selectSlice
                                        .attr({ 
                                            fill: this.color.stops ? this.color.stops[1][1] : this.color
                                        })
                                        .show();

                                    selectText
                                        .attr({ 
                                            text: this.name
                                        });

                                    selectValText
                                        .attr({ 
                                            text: this.percent + '%'
                                        });

                                    // Adjust the text to the center of the slice
                                    var bbox = selectText.getBBox();
                                    selectText
                                        .attr({
                                            x: selectSlice.x + selectSlice.innerR + 
                                                (selectSlice.width / 4) - (bbox.width / 2)
                                        })
                                        .show();

                                    selectValText
                                        .css({
                                            color: this.color.stops ? this.color.stops[1][1] : this.color
                                        })
                                        .attr({
                                            x: selectSlice.x + selectSlice.width + 5
                                        })
                                        .show()
                                        .shadow(true);

                                }
                            }
                        }
                    }
                }
            }
        });
        //console.log(chart);
    });
    
});

