/***************************************************************************************
Original script created by Allen Carrol, ESRI storymaps. http://storymaps.esri.com/home/
Free open download; no copyright or license information available.
Modified by Carl Sack, 2013. MIT License.

This prototype script processes a CSV. Call it in your main javascript file by using:
	var processCSV = new ProcessCSV(); //creates an instance of the prototype
	var csv = 'csvurl.csv'; //point to the csv file
	processCSV.addListener("complete", function(){
		var csvData = processCSV.getCSV(); //retreives the data from the csv file and adds it to a holding variable
		styleData(csvData); //pass the data to a function that puts it on the map
	}); //Final product is an array of objects for each row of csv data
	processCSV.process(csv); //send the CSV to the prototype for processing.
***************************************************************************************/

ProcessCSV.prototype = new EventTarget();
ProcessCSV.prototype.constructor = ProcessCSV();

function ProcessCSV() {

	var csvArray = [];
	var years = [];
	EventTarget.call(this);	

	// **********
	// methods...
	// **********

	this.process = function(csv) {
		//Load the CSV data
		var that = this;
		var req = new XMLHttpRequest();
		//feature check! (workaround for old versions of IE)
		if (window.XMLHttpRequest){
			req = new XMLHttpRequest();
		} else if (window.ActiveXObject){
			req = new ActiveXObject("Microsoft.XMLHTTP");
		}
		var arr = [];
		req.onreadystatechange = function(){
			if (req.readyState === 4){
				var text = req.responseText;
				arr.push(parseCSV(text)); //->
				that.fire("complete");
			}	
		}
		
		this.getCSV = function() {
			return csvArray;
		}
		this.getYears = function() {
			return years;
		}
		
		req.open('GET', csv, true);
		req.send(null);
	}

	// *****************
	// private functions
	// *****************
	
	//function to create an array of arrays for CSV data
	parseCSV = function(text) {
		//<-req.onreadystatechange<-this.process
		
		var lines = CSVToArray(text)
		
		var fields = lines[0];
		
		var values;	
		var arr = [];
		for (var i = 1; i < lines.length-1; i++) {
			var obj = {};	
			
			values = lines[i];
			
			//create an object attribute for each csv column
			for (var a = 0; a < fields.length; a++) {
				var field = fields[a];
				obj[field] = values[a];
			};
			
			csvArray.push(obj);
		};
	};
	
	
	// This will parse a delimited string into an array of
	// arrays. The default delimiter is the comma, but this
	// can be overriden in the second argument.
	// courtesy of Ben Nadel www.bennadel.com

	function CSVToArray( strData, strDelimiter ){
		// Check to see if the delimiter is defined. If not,
		// then default to comma.
		strDelimiter = (strDelimiter || ",");
		 
		// Create a regular expression to parse the CSV values.
		var objPattern = new RegExp(
		(
		// Delimiters.
		"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
		 
		// Quoted fields.
		"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
		 
		// Standard fields.
		"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
		);
		 
		 
		// Create an array to hold our data. Give the array
		// a default empty first row.
		var arrData = [[]];
		 
		// Create an array to hold our individual pattern
		// matching groups.
		var arrMatches = null;
		 
		 
		// Keep looping over the regular expression matches
		// until we can no longer find a match.
		while (arrMatches = objPattern.exec( strData )){
		 
			// Get the delimiter that was found.
			var strMatchedDelimiter = arrMatches[ 1 ];
		 
			// Check to see if the given delimiter has a length
			// (is not the start of string) and if it matches
			// field delimiter. If id does not, then we know
			// that this delimiter is a row delimiter.
			if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)){
		 
				// Since we have reached a new row of data,
				// add an empty row to our data array.
				arrData.push( [] );
		 
			}
		 
		 
			// Now that we have our delimiter out of the way,
			// let's check to see which kind of value we
			// captured (quoted or unquoted).
			if (arrMatches[ 2 ]){
		 
			// We found a quoted value. When we capture
			// this value, unescape any double quotes.
				var strMatchedValue = arrMatches[ 2 ].replace(
				new RegExp( "\"\"", "g" ),"\"");
		 
			} else {
		 
			// We found a non-quoted value.
			var strMatchedValue = arrMatches[ 3 ];
		 
			}
		 
		 
			// Now that we have our value string, let's add
			// it to the data array.
			arrData[ arrData.length - 1 ].push( strMatchedValue );
		}
		 
		// Return the parsed data.
		return( arrData );
	}
 	
}