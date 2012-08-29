(function(){

	'use strict';

	var chartData = function(){
		return generateItems();
	};

	var randomNumber = function (min, max) {
            return Math.floor(Math.random(0, 1) * (max - min)) + min;
    };

    var generateItems = function(){
    	var data=[];
    	for (var i = 0; i < 5; i++) {
    		  var obj = {};
    		   obj.id = i;
    		   obj.label = "Event label " + i;
    		   obj.items=[];

               var  dt = new Date();
               var dtS = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - randomNumber(1, 5), randomNumber(8, 16), 0, 0);

    		   for(var j =0; j< 20;j++){
    		   		
                    var dateOffset = randomNumber(5, 10);
                    var dt = new Date(dtS.getFullYear(), dtS.getMonth(), dtS.getDate() + dateOffset, randomNumber(dateOffset === 0 ? dtS.getHours() + 2 : 8, 18), 0, 0);

                    var item ={
                        start : dtS,
                        end :dt,
                        description :"item " + j,
                        status : randomNumber(0,1)>0.5 ? 'warning' :'alter'
                    }

    		 		obj.items.push(item);
                    dtS = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + randomNumber(1, 5), randomNumber(8, 16), 0, 0);    		   		
    		   }
    		   data.push(obj);
    		}
    		return data;
    }
   /**
    * Allow library to be used within both the browser and node.js
    */
    var root = typeof exports !== "undefined" && exports !== null ? exports : window;
    root.chartData = chartData;
}).call(this);