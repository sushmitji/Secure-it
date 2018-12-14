chrome.browserAction.onClicked.addListener(
	function() {
		// trigger content script to sweep for password inputs
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			var obj = {action: "sweep"};
			chrome.tabs.sendMessage(tabs[0].id, obj, function(response) {});
		});
	}
);

chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		
		// relay message on to content script
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
			chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
				//sendResponse({'request': request, 'response': response});
			});
		});
	}
);
