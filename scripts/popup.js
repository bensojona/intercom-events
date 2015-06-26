document.addEventListener("DOMContentLoaded", function() {
		var intercomId     = document.getElementById("intercom-id"),
			intercomAppKey = document.getElementById("intercom-app-key"),
			intercomApiKey = document.getElementById("intercom-api-key"),
			intercomEvents = document.getElementById("intercom-events"),
			appKeyError    = "Must enter an Intercom App Key",
			apiKeyError    = "Must enter an Intercom API Key",
			eventsKeyError = "Must enter a comma seperated Intercom events list";

	chrome.storage.local.get("app_key", function (result) {
		if (result && result.app_key) {
			intercomAppKey.value = result.app_key;
		} else {
			setMessage(appKeyError, true);
		}
	});

	chrome.storage.local.get("api_key", function (result) {
		if (result && result.api_key) {
			intercomApiKey.value = result.api_key;
		} else {
			setMessage(apiKeyError, true);
		}
	});

	chrome.tabs.getSelected(null, function(tab) {
		var urlSplit = tab.url.split("/");

		intercomId.value = urlSplit[urlSplit.length-1];
	});

	chrome.storage.local.get("events_key", function (result) {
		if (result && result.events_key) {
			intercomEvents.value = result.events_key;
			setButtons(result.events_key.split(","), intercomId, intercomAppKey, intercomApiKey);
		} else {
			setMessage(eventsKeyError, true);
		}
	});

	intercomAppKey.addEventListener("focusout", function() {
		var appKeyValue = intercomAppKey.value;

		if (appKeyValue && appKeyValue !== "") {
			saveIntercomAppKey(appKeyValue);
		} else {
			setMessage(appKeyError, true);
			return;
		}
	}, false);

	intercomApiKey.addEventListener("focusout", function() {
		var apiKeyValue = intercomApiKey.value;

		if (apiKeyValue && apiKeyValue !== "") {
			saveIntercomApiKey(apiKeyValue);
		} else {
			setMessage(apiKeyError, true);
			return;
		}
	}, false);

	intercomEvents.addEventListener("focusout", function() {
		var eventsValue = intercomEvents.value;

		if (eventsValue && eventsValue !== "") {
			saveIntercomEvents(eventsValue);
			setButtons(eventsValue.split(","), intercomId, intercomAppKey, intercomApiKey);
		} else {
			setMessage(eventsKeyError, true);
			return;
		}
	}, false);
}, false);

function setButtons(events, intercomId, intercomAppKey, intercomApiKey) {
	var event, btn,
		eventButtons = document.getElementById("event-buttons");

	// Remove current buttons
	while (eventButtons.firstChild) {
		eventButtons.removeChild(eventButtons.firstChild);
	}

	for (i = 0; i < events.length; i++) {
		event = events[i];

		// Don't create event buttons without a name or that already exist
		if (!event || !event.length || document.getElementById(event)) {
			continue;
		}

		btnContainer = document.createElement("div");
		btnContainer.className = "spacing";

		btn = document.createElement("button");
		btn.id = event.replace(/ /g, "_").toUpperCase();
		btn.innerHTML = "Send \"" + toTitleCase(event.replace(/_/g, " ")) + "\" Event";
		btnContainer.appendChild(btn);
		eventButtons.appendChild(btnContainer);

		btnClickHandler(
			btn, event, intercomId.value, intercomAppKey.value, intercomApiKey.value
		);
	}
}

function toTitleCase(str)
{
	return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function btnClickHandler(btn, event, intercomId, intercomAppKey, intercomApiKey) {
	btn.addEventListener("click", function() {
		sendEvent(event, intercomId, intercomAppKey, intercomApiKey);
	}, false);
}

function saveIntercomAppKey(appKey) {
	chrome.storage.local.set({"app_key": appKey}, function (result) {
		chrome.storage.sync.set({"app_key": appKey}, function() {
			setMessage("Saved App Key: " + appKey, false);
		});
	});
}

function saveIntercomApiKey(apiKey) {
	chrome.storage.local.set({"api_key": apiKey}, function (result) {
		chrome.storage.sync.set({"api_key": apiKey}, function() {
			setMessage("Saved API Key: " + apiKey, false);
		});
	});
}

function saveIntercomEvents(events) {
	events = events.replace(",,", ",");

	chrome.storage.local.set({"events_key": events}, function (result) {
		chrome.storage.sync.set({"events_key": events}, function() {
			setMessage("Saved Events: " + events, false);
		});
	});
}

function sendEvent(event, intercomId, intercomAppKey, intercomApiKey) {
	chrome.tabs.getSelected(null, function(tab) {
		var eventName, createdAt, userId,
			endpoint = "https://" + intercomAppKey + ":" + intercomApiKey + "@api.intercom.io/events";

		if ((!intercomId || !intercomId.length)) {
			setMessage("Must enter an Intercom Id", true);
			return;
		} else if ((!intercomAppKey || !intercomAppKey.length)) {
			setMessage("Must enter an Intercom App key", true);
			return;
		} else if ((!intercomApiKey || !intercomApiKey.length)) {
			setMessage("Must enter an Intercom API key", true);
			return;
		}

		sendRequest(endpoint, event, intercomId);
	});
}

function sendRequest(endpoint, event, intercomId) {
	var eventName, createdAt, userId, metadata,
		d       = document,
		f       = d.createElement("form"),
		dateInt = Math.round(new Date().getTime() / 1000);

	try {
		eventName = d.createElement("input");
		eventName.name = "event_name";
		eventName.value = event;
		f.appendChild(eventName);

		createdAt = d.createElement("input");
		createdAt.name = "created_at";
		createdAt.value = dateInt;
		f.appendChild(createdAt);

		userId = d.createElement("input");
		userId.name = "id";
		userId.value = intercomId;
		f.appendChild(userId);

		f.action = endpoint;
		f.method = "post";
		f.submit();
	}
	catch(err) {
		setMessage(err, true);
	}
}

function setMessage(content, error) {
	var message = document.getElementById("message");

	message.innerHTML = content;

	if (error) {
		message.style.color = "red";
	} else {
		message.style.color = "green";
	}
}
