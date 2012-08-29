/*
  Jquery plot using d3 visualization lib and crossfilter

  data format

  data= {
    [{
        id:number,
        label: text
        items:[
            {
            item1,

                ..../    
            }
        ]
    
    },
    {
    ....
    }
    ]
  }

  item = {
    start:date,
    end:data,
    description:text,
    status:number
    url:text
   }

*/




;(function ($) {
    'use strict';

    $.fn.GanttTimeLine = function (options) {

        var setting = {
            source:null,
          //  filter:true
        };

        $.extend(setting,options);


       

        //core function for creating charts
        var core = {
            create: function (element) {
                //retrieve data
                if (typeof (setting.source) === 'object') {
                    //data is object
                    element.data = setting.source;
                    core.init(element)
                }
                else {
                    //get data from ajax
                    $.ajax({
                        url: setting.source,
                        type: "Get",
                        success: function (data) {
                            element.data = data;
                            core.init(element);
                        },
                        fail: function (err) {
                        }
                    });

                }
            },


            init: function (element) {
                // //additional settings here
                // if(element.data !== 'array'){
                //     throw 'data has to be an array';
                // }

                //prepare data using underscore lib
                element.lanes = [];

                _.each(element.data, function  (obj,index,list) {
                   var item = {};
                   item.name = obj.label;
                   item.id = index;
                   element.lanes.push(item);
                })
                     
                element.plotHeight = 200;
                element.scrollerHeight = 100;
                element.plotMargin = { top: 20, right: 20, bottom: 15, left: 60 };
                element.width=$(element).width();
                element.height=800;


                // no filter for now
                // if (setting.filter) {
                //     element.filterdata = crossfilter(element.data);
                //     element.all = element.filterdata.groupAll();
                // }


                //add a container
                var content = $('<div id="chart">');
                
                $(element).html(content);

                //determine the time axis assuming the data are two-dimension
                var mindate = d3.min(element.data,function(d){ return d3.min(d.items,function(d){return d.start;});});

                var maxdate = d3.max(element.data,function(d){return d3.max(d.items,function(d){return d.end;});});
                

                //time axis scale mapping
                element.x = d3.time.scale().domain([d3.time.sunday(mindate), maxdate])
                                       .range([element.plotMargin.left, element.width-element.plotMargin.right-element.plotMargin.left]);

                element.xscroller = d3.time.scale().domain([d3.time.sunday(mindate), maxdate])
                                       .range([element.plotMargin.left, element.width-element.plotMargin.right-element.plotMargin.left]);


                //main plot y axis scale mapping
                element.yplot = d3.scale.linear().domain([0,_.size(element.lanes)])
                                             .range([0, element.plotHeight]);

                //scroller y axis scale mapping
                element.yscroller = d3.scale.linear().domain([0, _.size(element.lanes)])
                                             .range([0, element.scrollerHeight]);


                //add svg element to hold the plot
                element.chart = d3.select("#chart")
                    .append('svg:svg')
                    .attr('class', 'chart')
                    .attr('width', '100%')
                    .attr('height', element.height);


                //add main plot group
                element.plot = element.chart.append('svg:g')
                                            .attr('transform', 'translate(' + element.plotMargin.left + ',' + element.plotMargin.top + ')')
                                            .attr('width', '100%')
                                            .attr('height', element.plotHeight)
                                            .attr('class', 'plot');
                //add scroller group
                var scrolleroffset = element.plotMargin.top + element.plotHeight + 10;
                element.scroller = element.chart.append('svg:g')
                                            .attr('transform', 'translate(' + element.plotMargin.left + ',' + scrolleroffset + ')')
                                            .attr('width', '100%')
                                            .attr('height', element.scrollerHeight)
                                            .attr('class', 'scroller');

                //add time axis
                element.xDateAxis = d3.svg.axis()
                                      .scale(element.x)
                                      .orient('bottom')
                                      .ticks(d3.time.weeks,1)
                                      .tickFormat(d3.time.format('%a %d'))
                                      .tickSize(6,0,0)
               
                /*var xmonthAxis = d3.svg.axis()
                                    .scale(x)
                                    .orient('bottom')
                                    .ticks(d3.time.months,10)
                                    .ticksformat(d3.time.format('%b %Y'))
                                    .tickSize(6,0,0);
                */        

                element.chart.append('svg:g')
                             .attr('transform', 'translate('+element.plotMargin.left+ ',' + (element.plotHeight + 10)+')')
                             .attr('class', 'xaxis')
                             .call(element.xDateAxis);

               

                // //add shading for the selected region 
                // element.scroller.append('clip-path')
                //                 .attr("id","clipregion")
                //                 .append('rect')
                //                     .attr('width',element.width)
                //                     .attr('height',element.scrollerHeight);

                // element.scroller.selectAll('.element')
                //                 .data(['background','foreground'])
                //                 .enter()
                //                 .append('path')
                //                 .attr('class',function(d){return d+" scroller";})
                //                 .data(GetPaths(element))
                //                 .attr('d',function(d){return d;});

                // element.scroller.selectAll('.foreground.scroller')
                //                 .attr('clip-path','url(#clipregion)');

                //add selection area in scroller
                element.brush = d3.svg.brush()
                                    .x(element.xscroller)
                                    .extent([mindate,maxdate]);

                var gBrush = element.scroller.append('svg:g')
                                .attr('class', 'brush')
                                .call(element.brush);

                gBrush.selectAll('rect')
                     .attr('height', element.scrollerHeight);

                //make the resize handle nicer       
               
                gBrush.selectAll('.resize')
                      .append('path')
                      .attr('d', resizePath);
                //brush change event 

                element.brush.on('brush.scroller', function(){
                  var g = d3.select(this.parentNode);
                  var extent = element.brush.extent();
                  g.select('#clipregion')
                    .attr('x', element.x(extent[0]))
                    .attr('width',element.x(extent[1])-element.x(extent[0]));

                   core.render(element);
                });

              

                //render lane text
                element.plot.append('svg:g')
                            .attr('width','20%')
                            .selectAll('.lanetext')
                            .data(element.lanes)
                            .enter().append('text')
                            .text(function(d){return d.name;})
                            .attr('x',20)
                            .attr('y', function(d){return element.yplot(d.id+.5);})
                            .attr('dy','0.5ex')
                            .attr('text-anchor','end')
                            .attr('class','lanetext');
                            
                element.plot.append('defs').append('svg:clipPath')
                                  .attr("id","graphregion")
                                  .append('svg:rect')
                                    .attr('x',element.plotMargin.left)
                                    .attr('y',0)
                                    .attr('width','100%')
                                    .attr('height',element.plotHeight);

                element.plot.graph = element.plot.append('svg:g')
                                                 .attr('width','80%')                                       
                                                 .attr('clip-path','url(#graphregion)');



                //render the preview in scroller
                core.scrollerrender(element);

                //render the selected region
                core.render(element);
            },

            scrollerrender:function(element){
                //render scroller preview
                element.scroller.append('svg:g')
                                .selectAll('scrollerItems')
                                .data(GetPaths(element))
                                .enter().append('svg:path')
                                .attr('class','scrollerItem')
                                .attr('d',function(d){
                                    return d;
                                });

            },
            

            render: function (element) {
               
                //render the items 
                 var minExtent,maxExtent;
                 if(!element.brush.empty()){
                    minExtent = d3.time.day(element.brush.extent()[0]);
                    maxExtent = d3.time.day(element.brush.extent()[1]);
                 }
                 

                //change the selected range                
                 element.x.domain([minExtent,maxExtent]);

                 for (var i = 0; i < element.data.length; i++) {
                     var lane = element.data[i];
                 
                     d3.selectAll('.event'+lane.id).remove();
                     //get visible item in the range
                     var visItems = lane.items.filter(function(d){
                        return d.start <maxExtent && d.end>minExtent;
                     });

                     //update rects
                     var rects = element.plot.graph.selectAll('event' + lane.id)
                                         .data(visItems);

                     rects.enter().append('svg:rect')
                         .attr('x',function(d){return element.x(d.start);})
                         .attr('y',function(){return element.yplot(lane.id);})
                         .attr('rx',5)
                         .attr('ry',5)
                         .attr('width',function(d){return element.x(d.end)-element.x(d.start);})
                         .attr('height',20)
                         .attr('class','alert ' +'event'+lane.id)
                         .attr('title',function(d){return d.description;});
                     rects.exit().remove();
                          //   function(d){
                          // d.status==='warning'?'bar warning':'bar alert';});
                    
                 };


                //change time axis 
                var span = moment(maxExtent).diff(moment(minExtent),'days');
                var lines;
                if (span < 10) {
                    lines = element.x.ticks(d3.time.days);
                    element.xDateAxis.ticks(d3.time.days);
                }else if(span <90){
                    lines = element.x.ticks(d3.time.weeks,1);
                    element.xDateAxis.ticks(d3.time.weeks,1);
                }else if(span <300){
                    lines = element.x.ticks(d3.time.months,1);
                    element.xDateAxis.ticks(d3.time.months,1);
                }else{
                    lines = element.x.ticks(d3.time.years,1);
                    element.xDateAxis.ticks(d3.time.years,1);
                }
                ;

                
                  //add vertival grid
                element.chart.selectAll('.vertivalgridLine').remove();
                var xrule = element.chart.selectAll('vertivalGrid')
                                          .data(lines);
                 xrule.enter().append('svg:g')
                         .attr('class','vertivalgrid')
                         .append('svg:line')
                         .attr('class','vertivalgridLine')
                         .attr('x1',function(d){return element.x(d)+element.plotMargin.left;})
                         .attr('x2',function(d){return element.x(d)+element.plotMargin.left;})
                         .attr('y1',0)
                         .attr('y2',element.plotHeight+10);

                 xrule.exit().remove();
            

                d3.selectAll('.xaxis').call(element.xDateAxis);
                 
            },
        };

        //maintaining Chainability
        return this.each(function(){
            core.create(this);

        });

         //utility functions
        function GetPaths(element){
            var results =[];
            var offset = element.yscroller(1)*.5+0.5;
            _.each(element.data, function (obj,index,list){
                var path = '';
                for (var i = 0; i < obj.items.length ; i++) {
                    var item = obj.items[i];
                    path += ['M', element.x(item.start), element.yscroller(index)+offset,'H', element.x(item.end) +" "].join(' ');
                };
                results.push(path);
            });

            return results;
        }

        function resizePath(d) {
            var e = +(d == "e"),
                x = e ? 1 : -1,
                y = 100 / 3;
            return "M" + (.5 * x) + "," + y
                + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                + "V" + (2 * y - 6)
                + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                + "Z"
                + "M" + (2.5 * x) + "," + (y + 8)
                + "V" + (2 * y - 8)
                + "M" + (4.5 * x) + "," + (y + 8)
                + "V" + (2 * y - 8);
        }

    }

})(jQuery);

