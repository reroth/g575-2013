//global variables
var keyArray = ["varA","varB","varC","varD","varE"]; //array of property keys	
var expressed = keyArray[0]; //initial attribute expressed

//begin script when window loads 
window.onload = initialize();

//the first function called once the html is loaded
function initialize(){
	setMap();
};

//set choropleth map parameters
function setMap(){
	
	//map frame dimensions
	var width = 960;
	var height = 460;
	
	//create a new svg element with the above dimensions
	var map = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height);
	
	//create Europe albers equal area conic projection, centered on France
	var projection = d3.geo.albers()
		.center([-8, 46.2])
		.rotate([-10, 0])
		.parallels([43, 62])
		.scale(2500)
		.translate([width / 2, height / 2]);
		
	//create svg path generator using the projection
	var path = d3.geo.path()
		.projection(projection);
		
	//create graticule generator
	var graticule = d3.geo.graticule()
		.step([10, 10]); //place graticule lines every 10 degrees of longitude and latitude
	
	//create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule
	
	//create graticule lines	
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines) //bind graticule lines to each element to be created
	  	.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines
		
	//retrieve data in csv data file for coloring choropleth
	d3.csv("data/unitsData.csv", function(csvData){
		var recolorMap = colorScale(csvData);
		drawPcp(csvData);
		
		//retrieve and process europe json file
		d3.json("data/europe.json", function(error,europe){
		
			//variables for csv to json data transfer
			var jsonProvs = europe.objects.FranceProvinces.geometries; //for brevity
		
			//loop through csv data to assign each csv province's values to json province properties
			for (var i=0; i<csvData.length; i++) {		
				var csvProvince = csvData[i]; //the current province
				var csvAdm1 = csvProvince.adm1_code; //adm1 code from csv features
				
				//loop through json provinces to assign csv data to the right province
				for (var a=0; a<jsonProvs.length; a++){
					//where adm1 codes match, attach csv data to json object
					if (jsonProvs[a].properties.adm1_code == csvAdm1){
						
						//one more for loop to assign all five key/value pairs to json object
						for (var b=0; b<keyArray.length; b++){
							var key = keyArray[b]; //assign key from keys array
							var val = parseFloat(csvProvince[key]); //convert corresponding csv attribute value to float
							jsonProvs[a].properties[key] = val; //assign key and value pair to json object
						};
					jsonProvs[a].properties.name = csvProvince.name; //replace TopoJSON name property
					break; //stop looking through the json provinces
					};
				};
			};
			//add Europe countries geometry to map			
			var countries = map.append("path") //create SVG path element
				.datum(topojson.object(europe, europe.objects.EuropeCountries)) //bind countries data to path element
				.attr("class", "countries") //assign class for styling countries
				.attr("d", path); //project data as geometry in svg
					
			//add provinces to map as enumeration units colored by data
			var provinces = map.selectAll(".provinces")
				.data(topojson.object(europe, europe.objects.FranceProvinces).geometries) //bind provinces data to path element
				.enter() //create elements
				.append("path") //append elements to svg
				.attr("class", "provinces") //assign class for additional styling
				.attr("id", function(d) { return d.properties.adm1_code }) //set the admin code as element id for later reference
				.attr("d", path) //project data as geometry in svg
				.style("fill", function(d) { //color enumeration units
					return choropleth(d, recolorMap);
				})
				.on("mouseover", highlight)
				.on("mouseout", dehighlight)
				.on("mousemove", moveLabel)
				.append("desc") //append the current color as a desc element
					.text(function(d) { 
						return choropleth(d, recolorMap); 
			   		});
		});
	});
};
	
function colorScale(csvData){

	//create quantile classes with color scale
	var color = d3.scale.quantile() //designate quantile scale generator
		.range([
			"#D4B9DA",
			"#C994C7",
			"#DF65B0",
			"#DD1C77",
			"#980043"
		]);
		
		//set min and max data values as domain
	color.domain([
		d3.min(csvData, function(d) { return Number(d[expressed]); }),
		d3.max(csvData, function(d) { return Number(d[expressed]); })
	]);

	//return the color scale generator
	return color;	

};
	
function choropleth(d, recolorMap){
	//<-setMap d3.json provinces.style
	
	//Get data value
	var value = d.properties[expressed];
	//If value exists, assign it a color; otherwise assign gray
	if (value) {
		return recolorMap(value);
	} else {
		return "#ccc";
	};
};

function drawPcp(csvData){
	//pcp dimensions
	var width = 960;
	var height = 200;
		
	//create attribute names array for pcp axes
	var keys = [], attributes = [];
	//fill keys array with all property names
	for (var key in csvData[0]){
		keys.push(key);
	};
	//fill attributes array with only the attribute names
	for (var i=3; i<keys.length; i++){
		attributes.push(keys[i]);
	};
	
	//create horizontal pcp coordinate generator
	var coordinates = d3.scale.ordinal() //create an ordinal scale for plotting axes
		.domain(attributes) //horizontally space each attribute's axis evenly
		.rangePoints([0, width]); //set the horizontal scale width as the SVG width
		
    var axis = d3.svg.axis() //create axis generator
		.orient("left"); //orient generated axes vertically
	
	//create vertical pcp scale
	scales = {}; //object to hold scale generators
	attributes.forEach(function(att){ //for each attribute
    	scales[att] = d3.scale.linear() //create a linear scale generator for the attribute
        	.domain(d3.extent(csvData, function(data){ //compute the min and max values of the scale
				return +data[att]; //create array of data values to compute extent from
			})) 
        	.range([height, 0]); //set the height of each axis as the SVG height
	});
	
	var line = d3.svg.line(); //create line generator
	
	//create a new svg element with the above dimensions
	var pcplot = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "pcplot") //for styling
		.append("g") //append container element
		.attr("transform", d3.transform( //change the container size/shape
			"scale(0.8, 0.6),"+ //shrink
			"translate(96, 50)")); //move
			
	var pcpBackground = pcplot.append("rect") //background for the pcp
		.attr("x", "-30")
		.attr("y", "-35")
		.attr("width", "1020")
		.attr("height", "270")
		.attr("rx", "15")
		.attr("ry", "15")
		.attr("class", "pcpBackground");
	
	//add lines
	var pcpLines = pcplot.append("g") //append a container element
		.attr("class", "pcpLines") //class for styling lines
		.selectAll("path") //prepare for new path elements
		.data(csvData) //bind data
		.enter() //create new path for each line
		.append("path") //append each line path to the container element
		.attr("id", function(d){
			return d.adm1_code; //id each line by admin code
		})
		.attr("d", function(d){
			return line(attributes.map(function(att){ //map coordinates for each line to arrays object for line generator
				return [coordinates(att), scales[att](d[att])]; //x and y coordinates for line at each axis
			}));
		})
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
	
	//add axes	
	var axes = pcplot.selectAll(".attribute") //prepare for new elements
		.data(attributes) //bind data (attribute array)
		.enter() //create new elements
		.append("g") //append elements as containers
		.attr("class", "axes") //class for styling
		.attr("transform", function(d){
			return "translate("+coordinates(d)+")"; //position each axis container
		})
		.each(function(d){ //invoke the function for each axis container element
			d3.select(this) //select the current axis container element
				.call(axis //call the axis generator to create each axis path
					.scale(scales[d]) //generate the vertical scale for the axis
					.ticks(0) //no ticks
					.tickSize(0) //no ticks, I mean it!
				)
				.attr("id", d) //assign the attribute name as the axis id for restyling
				.style("stroke-width", "5px") //style each axis		
				.on("click", function(){ //click listener
					sequence(this, csvData);
				});	
		});
		
	pcplot.select("#"+expressed) //select the expressed attribute's axis for special styling
		.style("stroke-width", "10px");
};


function highlight(data){
	//<-setMap d3.json provinces.on("mouseover"...
	//<-drawPcp pcpLines.on("mouseover"...
	
	var props = datatest(data);	//standardize json or csv data
	
	d3.select("#"+props.adm1_code) //select the current province in the DOM
		.style("fill", "#000"); //set the enumeration unit fill to black
	
	//highlight corresponding pcp line
	d3.selectAll(".pcpLines") //select the pcp lines
		.select("#"+props.adm1_code) //select the right pcp line
		.style("stroke","#ffd700"); //restyle the line
		
	var labelAttribute = "<h1>"+props[expressed]+"</h1><br><b>"+expressed+"</b>"; //html string for attribute in dynamic label
	var labelName = props.name; //html string for name to go in child div
	
	//create info label div
	var infolabel = d3.select("body").append("div")
		.attr("class", "infolabel") //for styling label
		.attr("id", props.adm1_code+"label") //for future access to label div
		.html(labelAttribute) //add text
		.append("div") //add child div for feature name
		.attr("class", "labelname") //for styling name
		.html(labelName); //add feature name to label
};

function datatest(data){
	if (data.properties){ //if json data
		return data.properties;
	} else { //if csv data
		return data;
	};
};


function dehighlight(data){
	var props = datatest(data);	//standardize json or csv data
	
	var prov = d3.select("#"+props.adm1_code); //designate selector variable for brevity
	var fillcolor = prov.select("desc").text(); //access original color from desc
	prov.style("fill", fillcolor); //reset enumeration unit to orginal color
	
	//dehighlight corresponding pcp line
	d3.selectAll(".pcpLines") //select the pcp lines
		.select("#"+props.adm1_code) //select the right pcp line
		.style("stroke","#1e90ff"); //restyle the line
	
	d3.select("#"+props.adm1_code+"label").remove(); //remove info label
};

function moveLabel() {
		var x = d3.event.clientX+10; //horizontal label coordinate based mouse position stored in d3.event
		var y = d3.event.clientY-75; //vertical label coordinate
		
		d3.select(".infolabel") //select the label div for moving
			.style("margin-left", x+"px") //reposition label horizontal
			.style("margin-top", y+"px"); //reposition label vertical
};

function sequence(axis, csvData){
		//<-drawPcp axes.each.on("click"...
		
		//restyle the axis
		d3.selectAll(".axes") //select every axis
			.style("stroke-width", "5px"); //make them all thin
		axis.style.strokeWidth = "10px"; //thicken the axis that was clicked as user feedback
		
		expressed = axis.id; //change the class-level attribute variable
		
		//recolor the map
		d3.selectAll(".provinces") //select every province
			.style("fill", function(d) { //color enumeration units
				return choropleth(d, colorScale(csvData)); //->
			})
			.select("desc") //replace the color text in each province's desc element
			.text(function(d) {
				return choropleth(d, colorScale(csvData)); //->
			});
	};