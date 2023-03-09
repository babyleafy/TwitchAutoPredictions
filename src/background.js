// Check if any Twitch Pages are opened and manually inject action.js if needed
setTimeout(function(){
    console.log('Checking content script status');

    // Gets all twitch tabs
    chrome.tabs.query({
        url: '*://*.twitch.tv/*',
    }, function(tabs) {
        console.log(tabs);
        // If no Twitch tabs exist, stop pre-check.
        if (!Array.isArray(tabs) || !tabs.length) {
            console.log('No matching tabs found.');
            return null;
        }
        tabs.forEach(function(tab) {
            // Initializes handshake with potential action.js script inside the tab
            chrome.tabs.sendMessage(tab.id, {text: 'check'}, function(msg) {
                if(chrome.runtime.lastError) { msg = {}; }
                else { msg = msg || {}; }

                // If handshake fails (action.js doesn't exist in the tab) - inject the main script and its reverse dependency
                if (msg.status !== 'confirmed') {
                    chrome.scripting.executeScript({target: {tabId: tab.id},
                        files: ['action.js', 'arrive.js']});
                }});
        });
    })}, 1000);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab);
        if (request.increment === 1) {
            chrome.storage.sync.get({
                pointSum: 0,
            }, function(items) {
                let pointSumAdded = Number(items.pointSum) + 1;
                chrome.storage.sync.set({
                    pointSum: pointSumAdded.toString()
                }, function(){
                    console.log("PointSumAdded: " + pointSumAdded);
                });
            });
        } else if (request.increment === 2) {
            chrome.storage.sync.get({
                predSum: 0,
            }, function(items) {
                let predSumAdded = Number(items.predSum) + 1;
                chrome.storage.sync.set({
                    predSum: predSumAdded.toString()
                }, function(){
                    console.log("predSumAdded: " + predSumAdded);
                });
            });
        }
    }
);

// Handle URL change for Twitch Tabs to prevent bonus points detection from breaking
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    if(details.frameId === 0) { // indicates the navigation happens in the tab content window, not in a subframe
        if(!(details.url.toUpperCase().indexOf('twitch.tv'.toUpperCase()) !== -1)) {
            // Not a Twitch.tv tab, ignoring
            return
        }

        chrome.tabs.sendMessage(details.tabId, {
            urlChanged: 1
        }, function (msg) {
            if (chrome.runtime.lastError) { msg = {}; } else { msg = msg || {}; }
        });
        console.log("onHistoryStateUpdated");
    }
});

//Create popup for extension button
chrome.action.setPopup({popup: 'popup.html'});

