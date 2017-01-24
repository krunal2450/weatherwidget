$(function() {
	function widgetConstruct(me){
		var city, state, url, query;
		var geocoder;
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
		}
		//Get the latitude and the longitude;
		function successFunction(position) {
			var lat = position.coords.latitude;
			var lng = position.coords.longitude;
			codeLatLng(lat, lng);
		}

		function errorFunction() {
			console.log("Geocoder failed");
			me.find(".spinner").hide();
		}
	  
		function detectIE() {
			var ua = window.navigator.userAgent;

			var msie = ua.indexOf('MSIE ');
			if (msie > 0) {
				// IE 10 or older => return version number
				return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
			}

			var trident = ua.indexOf('Trident/');
			if (trident > 0) {
				// IE 11 => return version number
				var rv = ua.indexOf('rv:');
				return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
			}

			var edge = ua.indexOf('Edge/');
			if (edge > 0) {
			   // Edge (IE 12+) => return version number
			   return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
			}

			// other browser
			return false;
		}

		function loadAPIData() {
			me.find(".refresh").hide();
			me.find(".spinner").show();
			me.find(".add").hide();
			me.find(".temp, .title, .forecastCont").empty();
			query = "select * from weather.forecast where woeid in (select woeid from geo.places(1) where text='"+city.long_name.toLowerCase()+","+state.short_name.toLowerCase()+"')";
			query = encodeURIComponent(query);
			url = "http://query.yahooapis.com/v1/public/yql?q="+query+"&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithke";
			if (window.XDomainRequest && detectIE()) {
				var xdr = new XDomainRequest();
				xdr.open("GET", url, false);
				xdr.onload = function () {
					var JSON = $.parseJSON(xdr.responseText);
					if (JSON == null || typeof (JSON) == 'undefined')
					{
						JSON = $.parseJSON(data.firstChild.textContent);
					}
					publishData(JSON);
				};
				xdr.send();
			} else {
				$.ajax({
				  type: 'GET',
				  url: url,
				  processData: true,
				  data: {},
				  dataType: "json",
				  success: function (data) { publishData(data); }
				});
			}
		}
	  
		function publishData(data){
			me.find(".refresh").show();
			me.find(".spinner").hide();
			me.find(".title").html(city.long_name+", "+state.short_name);
			if(data.query.results){
				me.find(".temp").append("<div class='tempText'>"+data.query.results.channel.item.condition.temp +"&deg;"+data.query.results.channel.units.temperature+"</div>");
				me.find(".temp").append("<div class='condition'><div class='condImg' code='"+data.query.results.channel.item.condition.code+"'></div>"+data.query.results.channel.item.condition.text+"</div>");
				$(data.query.results.channel.item.forecast).each(function(i, item){
					if(i < 5)
					me.find(".forecastCont").append('<span class="forecastEle">'+item.day+'<br>'+item.low+'&deg;/'+item.high+'&deg;</span>');
				});
			}else{
				me.find(".temp").html("<span class='error'>Error while fetching data. You can try by refreshing button or fill details below.</span>");
				me.find(".add").show();
			}
		}
	  
		function codeLatLng(lat, lng) {
			var latlng = new google.maps.LatLng(lat, lng);
			geocoder.geocode({
			  'latLng': latlng
			}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (results[1]) {
						//find country name
						for (var i = 0; i < results[0].address_components.length; i++) {
							for (var b = 0; b < results[0].address_components[i].types.length; b++) {
								//there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
								if (results[0].address_components[i].types[b] == "administrative_area_level_2") {
									//this is the object you are looking for
									city = results[0].address_components[i];
									break;
								}
							}
						}
						
						for (var i = 0; i < results[0].address_components.length; i++) {
							for (var b = 0; b < results[0].address_components[i].types.length; b++) {
								//there are different types that might hold a city admin_area_lvl_1 usually does in come cases looking for sublocality type will be more appropriate
								if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
									//this is the object you are looking for
									state = results[0].address_components[i];
									break;
								}
							}
						}
						loadAPIData();
					} else {
						console.log("City name not available");

					}
				} else {
					console.log("Geocoder failed due to: ", status);
				}
			});
		}
	  
		function bindEvents(){
			me.find(".refresh").on("click", function(e){
				$(this).hide();
				if(me.find(".city").val() && me.find(".state").val()){
					city.long_name = me.find(".city").val();
					state.short_name = me.find(".state").val();
				}
				loadAPIData();
			});
		  
			me.find("form.add").on("submit", function(e){
				e.preventDefault();
				if(me.find(".city").val() && me.find(".state").val()){
					city.long_name = me.find(".city").val();
					state.short_name = me.find(".state").val();
					loadAPIData();
					me.find(".add").hide();
				}
			});
		}
		
		function initialize() {
			geocoder = new google.maps.Geocoder();

			var html = '<div class="title"></div>'
						+'<button class="refresh" title="Refresh"></button>'
						+'<div class="temp"></div>'
						+'<div class="forecastCont"></div>'
						+'<form class="add"><input class="city" type="text" placeholder="Enter city name" /><input class="state" type="text" placeholder="Enter state code" />'
						+'<input type="submit" /></form>'
						+'<div class="spinner"></div>';

			me.append(html);
			me.find(".refresh").hide();
			me.find(".spinner").show();
			bindEvents();
		}
	  
		initialize();
	}
  
	$.fn.WeatherWidget = function () // namespace - Plugin Startup
	{
		var me = $(this);
		var dataname='WeatherWidget';
		var instance = me.data(dataname);
		return me.data(dataname,  new widgetConstruct(me));
	};
});