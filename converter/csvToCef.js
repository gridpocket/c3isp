var fs = require('fs'),
	readline = require('readline');

const fileNameConnectionDetected = "Router_Vendor_Router_CED_1.0_100_ConnectionDetected_5_.txt";
const fileNameDomainGeneration = "DNS_Vendor_DNS_CED_1.0_100_DNSquery_5_.txt";

/*Process file name of the input to get initial content of the converted file
	Input template => Router_Vendor_Router_CED_1.0_100_ConnectionDetected_5_.txt
	Output template => CEF:0|Router_Vendor|Router_CED|1.0|100|ConnectionDetected|5|
*/
function produceInitialContentOfCefFile(fileName, cb){
	var initialContentOfCefFile = fileName.split('_');
		initialContentOfCefFile = 'CEF:0|'+initialContentOfCefFile[0]+'_'+initialContentOfCefFile[1]+'|'+initialContentOfCefFile[2]+'_'+initialContentOfCefFile[3]+'|'+initialContentOfCefFile[4]+'|'+initialContentOfCefFile[5]+'|'+initialContentOfCefFile[6]+'|'+initialContentOfCefFile[7]+'|';
	cb(initialContentOfCefFile);
}

/*Conversion of Connection detection inputs (fileNameConnectionDetected)
	Input template => 2017-09-15 09:56:00.000 0.000 UDP 192.168.1.2:24920 -> 2.4.55.66:22126 1 46 1
	Output template => CEF:0|Router_Vendor|Router_CED|1.0|100|ConnectionDetected|5|src=192.168.1.2 spt=24920dst=2.4.55.66 dpt=22126 proto=UDP end=1505433600000
*/
function processConnectionDetected(fileName){
	produceInitialContentOfCefFile(fileName, function(part1){
		var lineReader = readline.createInterface({
			input: fs.createReadStream(fileName)
		});

		fs.unlink(fileName + '.cef', function(err){
			if(err) console.log('This file doesnt exist...');

			lineReader.on('line', function (line) {
				line = line.split(' ');
				var newLine = part1 + 'src=' + line[4].split(':')[0] + ' spt=' + line[4].split(':')[1];
				newLine += 'dst=' + line[6].split(':')[0] + ' dpt=' + line[6].split(':')[1];
				newLine += ' proto=' + line[3] + ' end=' + new Date(line[0]).getTime() + '\n';

				fs.appendFile(fileName + '.cef', newLine, function(err){
					if (err) throw err;
				});
			});
		});
	});
}

/*Conversion of Domain generation Algorithm inputs (fileNameDomainGeneration)
	Input template => 15-Sep-2017 16:11:43.431 client 192.168.1.2#37239 (www.google.com): query: www.google.com IN A -EDC (192.168.1.9)
	Output template => CEF:0|DNS_Vendor|DNS_CED|1.0|100|DNSquery|5|src=192.168.1.2 spt=37239 msg=IN A -EDC (192.168.1.9) end=1505484703431
*/
function processDomainGeneration(fileName){
	produceInitialContentOfCefFile(fileName, function(part1){
		var lineReader = readline.createInterface({
			input: fs.createReadStream(fileName)
		});

		fs.unlink(fileName + '.cef', function(err){
			if(err) console.log('This file doesnt exist...');
				
			lineReader.on('line', function(line){
				line = line.split(' ');
				var newLine = part1 + 'src=' + line[3].split('#')[0] + ' spt=' + line[3].split('#')[1] + ' msg=' + line[6];
				for(i=7;i<line.length;i++){
					newLine += ' ' + line[i];
				}
				newLine += ' end=' + new Date(line[0] +', '+ line[1]).getTime() + '\n';
				
				fs.appendFile(fileName + '.cef', newLine, function(err){
					if (err) throw err;
				});	
			});
		});
	});
}

processDomainGeneration(fileNameDomainGeneration);
processConnectionDetected(fileNameConnectionDetected);



