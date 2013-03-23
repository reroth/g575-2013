//global variables
var map; //map object
var csvData; //array of objects

var markersLayer; //markers layer group object

var timestamp = 2005; //initial timestamp
var scaleFactor = 25; //scale factor for marker area

var timer; //timer object for animation
var timerInterval = 500; //initial animation speed in milliseconds

//begin script when window loads 
window.onload = initialize();

//the first function called once the html is loaded
function initialize(){
	setMap();
};

//set basemap parameters
function setMap() {
	
	//create the map and set its initial view
	map = L.map('map').setView([38, -94], 4);
	
	//add the tile layer to the map
	var layer = L.tileLayer(
		'http://{s}.acetate.geoiq.com/tiles/acetate/{z}/{x}/{y}.png',
		{
			attribution: 'Acetate tileset from GeoIQ'
		}).addTo(map);
		
	//call the function to process the csv with the data
	processCSV();
	sequenceInteractions();
};

function processCSV() {
	
	//process the citiesData csv file
	var processCSV = new ProcessCSV();
	var csv = 'data/csvData.csv'; // set location of csv file

	processCSV.addListener("complete", function(){
		csvData = processCSV.getCSV();
		createMarkers();
	});
	
	processCSV.process(csv);
};

function createMarkers() {
		
	//marker style object
	var markerStyle = {
		fillColor: "#39F",
	};

	//create array to hold markers
	var markersArray = [];
		
	//create a circle marker for each feature object in the csvData array
	for (var i=0; i<csvData.length; i++) {
		var feature = {};
		feature.properties = csvData[i];
		var lat = Number(feature.properties.latitude);
		var lng = Number(feature.properties.longitude);
		var marker = L.circleMarker([lat,lng], markerStyle);
		marker.feature = feature;
		markersArray.push(marker);
	};
	
	//create a markers layer with all of the circle markers
	markersLayer = L.featureGroup(markersArray);
	
	//add the markers layer to the map
	markersLayer.addTo(map);
	
	//call the function to size each marker and add its popup
	markersLayer.eachLayer(function(layer) {
		onEachFeature(layer);
	})
}

function onEachFeature(layer) {
	
	//calculate the area based on the data for that timestamp
	var area = layer.feature.properties[timestamp] * scaleFactor;
	
	//calculate the radius
	var radius = Math.sqrt(area/Math.PI);
	
	//set the symbol radius
	layer.setRadius(radius);
	
	//create and style the HTML in the information popup
	var popupHTML = 	"<b>" + layer.feature.properties[timestamp] + 
						" units</b><br>" +
						"<i> " + layer.feature.properties.name + 
						"</i> in <i>" + timestamp + "</i>";
		
	//bind the popup to the feature
	layer.bindPopup(popupHTML, {
		offset: new L.Point(0,-radius)
	});
	
	//information popup on hover
	layer.on({
		mouseover: function(){
			layer.openPopup();
			this.setStyle({radius: radius, color: 'yellow'});
		},
		mouseout: function(){
			layer.closePopup();
			this.setStyle({color: 'blue'});
		}
	});	
}

//Sequencing Controls

function sequenceInteractions(){
		
	$(".pause").hide();
	
	//play behavior
	$(".play").click(function(){
		$(".pause").show();
		$(".play").hide();
		animateMap();
	});
	
	//pause behavior
	$(".pause").click(function(){
		$(".pause").hide();
		$(".play").show();
		stopMap();
	});
	
	//step behavior
	$(".step").click(function(){
		step();
	});
	
	//step-full behavior
	$(".step-full").click(function(){
		jump(2011); //update with last timestamp
	});
	
	//back behavior
	$(".back").click(function(){
		back();
	});
	
	//back-full behavior
	$(".back-full").click(function(){
		jump(2005); //update with first timestamp
	});
		
	//temporalSlider behavior	
	$("#temporalSlider").slider({
		min: 2005,
		max: 2011,
		step: 1,
		animate: "fast",
		slide: function(e, ui){
			stopMap();
			timestamp = ui.value;
			markersLayer.eachLayer(function(layer) {
				onEachFeature(layer);
			})
		}
	});
	
}

function animateMap() {
	timer = setInterval(function(){
		step();
	},timerInterval);
}

function stopMap() {
	clearInterval(timer);
}

function step(){
	
	//cycle through years
	if (timestamp < 2011){ //update with last timestamp header
		timestamp++;
	} else {
		timestamp = 2005; //update with first timestampe header
	};
	
	//upon changing the timestamp, call onEachFeature to update the display
	markersLayer.eachLayer(function(layer) {
		onEachFeature(layer);
	});
	
	//update the slider position based on the timestamp change
	updateSlider();
}

function back(){
	
	//cycle through years
	if (timestamp > 2005){ //update with last timestamp header
		timestamp--;
	} else {
		timestamp = 2011; //update with first timestampe header
	};
	
	//upon changing the timestamp, call onEachFeature to update the display
	markersLayer.eachLayer(function(layer) {
		onEachFeature(layer);
	});
	
	//update the slider position based on the timestamp change
	updateSlider();
}

function jump(t){
	
	//set the timestamp to the value passed in the parameter
	timestamp = t;
	
	//upon changing the timestamp, call onEachFeature to update the display
	markersLayer.eachLayer(function(layer) {
		onEachFeature(layer);
	});
	
	//update the slider position based on the timestamp change
	updateSlider();
}

function updateSlider(){
	
	//move the slider to the appropriate value
	$("#temporalSlider").slider("value",timestamp);
}




