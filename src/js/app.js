/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

// IP Address of a Sonos Speaker, may not be set yet
var ipAddress = Settings.option('ip');

// If not set use a default one
if (!ipAddress) {
	Settings.option('ip', '192.168.1.84');
}

// Setup main display
var main = new UI.Card({
	title: 'Pebbos',
	body: 'Trying to find speakers on IP ' + Settings.option('ip')
});

main.show();

// Main request to get list of Speakers
ajax(
	{
		url: "http://" + Settings.option('ip') + ":1400/status/topology"
	},
	function(data) {
		// Parse name, locations and coordinators from topology xml
		// Half-inched from https://github.com/owlandgiraffe/Sobble
		var names = data.match(/>([A-Za-z0-9s ]+?)<\/ZonePlayer>/gm),
			locations = data.match(/location='(.+?)'/gm),
			coordinators = data.match(/coordinator='(.+?)'/gm);

		speakersArray = [];

		if (names.length && locations.length) {
			for (var i = 0; i < names.length; i++) {
				var loc = {
					name: names[i].match(/>(.*?)</)[1],
					ip: locations[i].match(/http:\/\/(.*):/)[1],
					coordinator: coordinators[i].match(/'(.+?)'/)[0]
				};

				// Not a bridge and marked as a coordinator
				// Some players are marked as false if they're grouped 
				if (loc.name.indexOf("BRIDGE") == -1 && loc.coordinator.indexOf('true') > -1) {
					speakersArray.push({title: loc.name, subtitle: loc.ip});
				}
			}
		}

		if (speakersArray.length == 0) {
			main.body('No speakers found, try entering a valid speaker IP in the app settings');
			return false;
		}

		var menu = new UI.Menu({
			sections: [{
				title: 'Sonos Speakers',
				items: speakersArray
			}]
		});

		menu.on('select', function(e) {
			var volume = 0;

			// Get Volume of selected speaker
			makeRequestToSonosZone(
				e.item.subtitle,
				makeSOAPDataObject(
					"getvolume",
					"GetVolume",
					"/MediaRenderer/RenderingControl/Control",
					"urn:upnp-org:serviceId:RenderingControl#GetVolume",
					"<u:GetVolume xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl:1\"><InstanceID>0</InstanceID><Channel>Master</Channel></u:GetVolume>"
				),
				function (request, SOAPData) {
					volume = parseInt(request.responseText.match(/<CurrentVolume>([0-9]+?)<\/CurrentVolume>/m)[1]);
				}
			);

			var actionsMenu = new UI.Menu({
				sections: [{
					items: [{
						title: 'Play'
					}, {
						title: 'Pause'
					}, {
						title: 'Next'
					}, {
						title: 'Prev'
					}, {
						title: 'Volume Up'
					}, {
						title: 'Volume Down'
					}]
				}]
			});

			actionsMenu.on('select', function(d) {
				if (d.itemIndex == 0) {
					makeRequestToSonosZone(e.item.subtitle, makeSOAPDataObject("play", "Play"));
				} else if (d.itemIndex == 1) {
					makeRequestToSonosZone(e.item.subtitle, makeSOAPDataObject("pause", "Pause"));
				} else if (d.itemIndex == 2) {
					makeRequestToSonosZone(e.item.subtitle, makeSOAPDataObject("next", "Next"));
				} else if (d.itemIndex == 3) {
					makeRequestToSonosZone(e.item.subtitle, makeSOAPDataObject("prev", "Previous"));
				} else if (d.itemIndex == 4) {
					volume = volume + 5;
					if (volume > 100) {
						volume = 100;
					}
					makeRequestToSonosZone(e.item.subtitle, makeSOAPDataObject(
						"setvolume",
						"SetVolume",
						"/MediaRenderer/RenderingControl/Control",
						"urn:upnp-org:serviceId:RenderingControl#SetVolume",
						"<u:SetVolume xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl:1\"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>" + volume + "</DesiredVolume></u:SetVolume>"
					));
				} else if (d.itemIndex == 5) {
					volume = volume - 5;
					if (volume < 0) {
						volume = 0;
					}
					makeRequestToSonosZone(e.item.subtitle, makeSOAPDataObject(
						"setvolume",
						"SetVolume",
						"/MediaRenderer/RenderingControl/Control",
						"urn:upnp-org:serviceId:RenderingControl#SetVolume",
						"<u:SetVolume xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl:1\"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>" + volume + "</DesiredVolume></u:SetVolume>"
					));
				}
			});
			actionsMenu.show();
		});

		menu.show();
	},
	function(error) {
		console.log('Error: ' + error);
		main.body('Error finding speakers, try entering a valid speaker IP in the app settings');
	}
);

// Half-inched from https://github.com/owlandgiraffe/Sobble
function makeSOAPDataObject(eventType, cmdType, uriType, actionType, bodyData) {
	if (!bodyData || bodyData === undefined) {
		bodyData = "<u:" + cmdType + " xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\"><InstanceID>0</InstanceID><Speed>1</Speed></u:" + cmdType + ">";
	}
	var bodyText = "<?xml version=\"1.0\" encoding=\"utf-8\"?><s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body>" + bodyData + "</s:Body></s:Envelope>";

	return (
		{
			type : eventType,
			uri : uriType || "/MediaRenderer/AVTransport/Control",
			action : actionType || "urn:schemas-upnp-org:service:AVTransport:1#" + cmdType,
			body : bodyText
		}
	);
}

// Half-inched from https://github.com/owlandgiraffe/Sobble
function makeRequestToSonosZone(ip, SOAPData, callback) {
	if (SOAPData === false || SOAPData === undefined) {
		console.log("Invalid SOAP data: " + JSON.stringify(SOAPData));
		return;
	}

	var url = "http://" + ip + ":1400" + SOAPData.uri;

	try {
		var request = new XMLHttpRequest();
		request.open("POST", url, false);
		request.setRequestHeader("SOAPAction", SOAPData.action);
		request.setRequestHeader("Content-Type", "text/xml");
		request.onload = function (e) {
			if (request.readyState === 4) {
				if (request.status === 200) {
					if (callback) {
						callback(request, SOAPData);
					}
				} else {
					console.log("Request returned error code " + request.status.toString());
				}
			}
		}
		request.send(SOAPData.body);
	} catch (error) {
		console.log("Error in XMLHttpRequest: " + error);
	}
}

// Settings page to change the default Sonos Speaker IP Address
Settings.config(
	{ url: 'http://www.jamesfairhurst.co.uk/pebbos.html?' + encodeURIComponent(JSON.stringify({ip:Settings.option('ip')})), autoSave: false },
	function (e) {
		console.log('opening configurable');

		console.log(Settings.option('ip'));
	},
	function (e) {
		console.log('closed configurable');
		console.log(JSON.stringify(e));

		// Only save if data was returned and an IP address was entered
		if (JSON.stringify(e.options) != '{}' && e.options.ip) {
			Settings.option('ip', e.options.ip);
		}

		// Show the raw response if parsing failed
		// Will be false even if the User cancelled the page
		if (e.failed) {
			console.log(e.response);
		}
	}
);