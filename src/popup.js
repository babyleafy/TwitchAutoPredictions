function saveOptions() {
	let bonus = document.getElementById('autoBonus').checked;
	let bet = document.getElementById('autoBet').checked;
	let betOptions = document.querySelector('input[name="betOptions"]:checked')?.value;
	let pointSum = document.getElementById('accumulatedClickPoints').innerHTML;
	//TODO store all new slider values in chrome storage
	//TODO save betPoints value
	chrome.storage.sync.set({
		bonus: bonus,
		bet: bet,
		betOptions: betOptions,
		pointSum: pointSum,
	}, function() {
		// Update status to let user know options were saved.
		let saveStatus = document.getElementById('status');
		saveStatus.innerHTML = 'Options saved! Please refresh Twitch Tabs';
		setTimeout(function() {
			saveStatus.innerHTML = '';
		}, 750);
	});

	// Gets all twitch tabs
	chrome.tabs.query({
		url: '*://*.twitch.tv/*',
	}, function(tabs) {
		// If no Twitch tabs exist, stop pre-check.
		if (!Array.isArray(tabs) || !tabs.length) {
			return null;
		}
		tabs.forEach(function(tab) {
			// Initializes handshake with potential twitch-clicker.js script inside the tab
			chrome.tabs.sendMessage(tab.id,
				{bonus: bonus, bet: bet, betOptions: betOptions, pointSum: pointSum}, function(msg) {
				if(chrome.runtime.lastError) { msg = {}; }
				else { msg = msg || {}; }
			});
		});
	});

	console.log("Options saved");
	console.log("Bonus: " + bonus + " Bet: " + bet + " Bet Options: " + betOptions + "PointSum: " + pointSum);
}

// Restores Options state using the preferences saved in chrome.storage
function restoreOptions() {
	chrome.storage.sync.get({
		'bonus': false,
		'bet': false,
		'betOptions': null,
		'pointSum': '0'
	}, function(items) {
		document.getElementById('autoBonus').checked = items.bonus;
		document.getElementById('autoBet').checked = items.bet;
		document.getElementById('points').innerHTML = items.pointSum;
		if (items.betOptions === "betPeople") {
			document.getElementById('betPeople').checked = true;
		} else if (items.betOptions === "betPoints") {
			document.getElementById('betPoints').checked = true;
		}
		let bets = document.querySelector('input[name="betOptions"]:checked');
		console.log("Bonus: " + items.bonus + " Bet: " + items.bet + " 	Options: " + items.betOptions);
	});
	console.log("Options restored");

}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab);
		if (request.increment === "addPoint")
			currVal = parseInt(document.getElementById('accumulatedClickPoints').innerHTML);
			currVal += 1;
			document.getElementById('accumulatedClickPoints').innerHTML = currVal.toString();
			sendResponse({confirm: "confirmed add"});
	}
  );


//On load
document.addEventListener('DOMContentLoaded', restoreOptions); //Restores options from storage on loading
document.getElementById('save').addEventListener('click', saveOptions); //Connects save function to button

