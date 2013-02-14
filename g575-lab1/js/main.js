//global variables
var map; //map object
var csvData; //array of objects

var markersLayer; //markers layer group object

var timestamp = 2005; //initial timestamp
var scaleFactor = 25; //scale factor for marker area

var timer; //timer object for animation
var timerInterval = 500; //initial animation speed in milliseconds


//begin script when window loads 
window.onload = initialize(); //->

//the first function called once the html is loaded
function initialize(){
	//<-window.onload
	setMap(); //->
};

//set basemap parameters
function setMap() {
	//<-initialize()
	
	//create the map and set its initial view
	map = L.map('map').setView([38, -94], 4);
	
	//add the tile layer to the map
	var layer = L.tileLayer(
		'http://{s}.acetate.geoiq.com/tiles/acetate/{z}/{x}/{y}.png',
		{
			attribution: 'Acetate tileset from GeoIQ'
		}).addTo(map);
		
	//call the function to process the csv with the data
	processCSV(); //->
};

function processCSV() {
	//<-setMap()

	//process the citiesData csv file
	var processCSV = new ProcessCSV(); //-> to ProcessCSV.js
	var csv = 'data/csvData.csv'; // set location of csv file

	processCSV.addListener("complete", function(){
		csvData = processCSV.getCSV(); //-> to ProcessCSV.js; returns array object
		createMarkers(); //->
	});
	
	processCSV.process(csv); //-> to ProcessCSV.js	
};

function createMarkers() {
	//<-processCSV()
	
	//radius of markers
	var radius = 10;

	//marker style object
	var markerStyle = {
		radius: radius,
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
		onEachFeature(layer);//->
	})
	
	animateMap();//->
}

function onEachFeature(layer) {
	//<-createMarkers()
	
	//calculate the area based on the data for that timestamp
	var area = layer.feature.properties[timestamp] * scaleFactor;
	
	//calculate the radius
	var radius = Math.sqrt(area/Math.PI);
	
	//set the symbol radius
	layer.setRadius(radius);
}

function animateMap() {
	//<-setMap();
	
	timer = setInterval(function(){
		step();//->
	},timerInterval);
}

function step(){
	//<-animateMap()
	
	//cycle through years
	if (timestamp < 2011){ //update with last timestamp header
		timestamp++;
	} else {
		timestamp = 2005; //update with first timestampe header
	};
	
	//upon changing the timestamp, call onEachFeature to update the display
	markersLayer.eachLayer(function(layer) {
		onEachFeature(layer);//->
	});
}


