var twitterApi = "http://search.twitter.com/search.json?rpp=30&count=20&include_entities=true&";

/**
 * On page load
 */
$(document).ready(function() {
	window.googleMaps = new GoogleMaps();
	window.tweets = new Tweets(window.googleMaps);
	tweets.loadLocation();
	tweets.initialize();
});


/**
 * Finds the tweets and displays them on the map
 */
function Tweets(gMap){
	
	this.googleMaps = gMap;
	this.jsonData;
	this.locationTimer = new Date().getMilliseconds();
	this.lat; this.lon;
	
	/**
	 * Loads the location
	 */
	this.loadLocation = function(){
		var self = this;
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(
				function(position){
					self.lat = position.coords.latitude;
					self.lon = position.coords.longitude;
					var latlng = new google.maps.LatLng(self.lat, self.lon);
				    self.googleMaps.geocoder.geocode({'latLng': latlng}, function(results, status) {
				        if (status == google.maps.GeocoderStatus.OK) {
				          if (results[0]) {
								$('#content').append('<label style="display:block;">Current location: '+ results[0].formatted_address + '</label>');
							    $('#content').append('<label style="display:block;">Location fetched though GPS in '+ ( new Date().getMilliseconds() - self.locationTimer) + 'ms </label>');
				          }else{
								self.loadIPLocation();
				          }
				        }else{
							self.loadIPLocation();
				        }
				    });					
				    $('#loading').hide();
				    $('#content').show();
				    self.googleMaps.setCenter(self.lat, self.lon);
				    self.googleMaps.initialize();
				},
				function(){
					self.loadIPLocation();
				}
			);
	    }
		else{
			this.loadIPLocation();
		}
	};
	
	/**
	 * Call this when unable to get GPS location
	 */
	this.loadIPLocation = function(){
		if(google.loader.ClientLocation){
		    this.lat = google.loader.ClientLocation.latitude;
		    this.lon = google.loader.ClientLocation.longitude;
		    $('#content').append('Current location city: '+ google.loader.ClientLocation.address.city + '<br/>');
		    $('#loading').hide();
		    $('#content').show();
		    $('#content').append('Location fetched though IP in '+ ( new Date().getMilliseconds() - this.locationTimer) + 'ms');
		    this.googleMaps.setCenter(this.lat, this.lon);
		    this.googleMaps.initialize();
		}
		else{
			$('.error').show();
			$('.error').html("Location not found.");
		}			
	};
		
	/**
	 * On find button click, load json data from twitter
	 */
	this.initialize = function(){
		var self = this;
		$('#find').click(function(){
			$.ajax({
			    url: twitterApi + 'geocode=' + self.lat + ',' + self.lon + ',30km&q='+$('#q').val(),
			    dataType: 'jsonp',
			    success: function(data, textStatus, jqXHR) { 
			    	self.jsonData = data.results;
			    	self.fillTweets();
			    	if(self.jsonData.length == 0){
			    		$('.error').show();
						$('.error').html("No results found.");
			    	}else{
			    		$('.error').hide();
			    	}
			    },
			    error: function() { 
			    	alert('Failed to retrieve data from twitter!'); 
			    },
			    callback: '?'
			});
		});
	};
	
	this.fillTweets = function(){
		$('#tweets').html('');
		this.googleMaps.clearOverlays();
		this.dataIndex = 0;
		for(var i = 0; i < this.jsonData.length; i++){
			if(this.jsonData[i].location != null && this.jsonData[i].location != ''){
				$('#tweets').append('<div id="s'+this.jsonData[i].from_user_id+'" class="tweet"><b>' + this.jsonData[i].from_user_name + '</b> '+ this.jsonData[i].text + '</div>');
				var self = this;
				this.placeMarker(self.jsonData[i]);
			}
		}
	};
	
	this.refreshTweets = function(){
		$('.tweet').each(function(){
			$('.tweet').removeClass("active");
		});
	};
	
	this.placeMarker = function(data){
		this.googleMaps.geocoder.geocode({ 'address': data.location.trim() }, this.processGeocode);
	};
	
	this.processGeocode = function(results){
		var self = window.tweets;
		if(results != null && results.length > 0) {
			var res = results[0];
			var marker = new google.maps.Marker({
	              map: self.googleMaps.map, 
	              position: new google.maps.LatLng(res.geometry.location.Ya + (Math.random()/1000), res.geometry.location.Za) ,
	              title: self.jsonData[self.dataIndex].from_user_name,
	              id: self.jsonData[self.dataIndex].from_user_id
	        });
			google.maps.event.addListener(marker, 'click', function(event) {
				self.refreshTweets();
				$('#tweets').animate({
			         scrollTop: $('#s'+marker.id).offset().top - 400
			     }, 2000);
				$('#s'+marker.id).addClass('active');
			});
			self.googleMaps.markersArray.push(marker);
		}else{
			console.error(self.data.location);
			console.error(results);
		}
		self.dataIndex++;
	};
	
}


/**
 * Initializes the google maps
 * @returns
 */
function GoogleMaps() {
	
	this.center;
	this.zoom = 8;
	this.map;
	this.geocoder;
	this.markersArray = new Array();
	this.geocoder = new google.maps.Geocoder();
	
	this.initialize = function() {
		var mapOptions = {
			center : this.center,
			zoom : 8,
			mapTypeId : google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	};
	
	this.setCenter = function(lat, long){
		this.center = new google.maps.LatLng(lat, long);
	};
	
	this.clearOverlays = function() {
	  for (var i = 0; i < this.markersArray.length; i++ ) {
		  this.markersArray[i].setMap(null);
	  }
	};
	
}