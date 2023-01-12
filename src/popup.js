function saveOptions() {
	let bonus = document.getElementById('autoBonus').checked;
	let bet = document.getElementById('autoBet').checked;
	let betOptions = document.querySelector('input[name="betOptions"]:checked')?.value;

	chrome.storage.sync.set({
		[bonus]: bonus,
		[bet]: bet,
		[betOptions]: betOptions,
	}, function() {
		// Update status to let user know options were saved.
		let saveStatus = document.getElementById('status');
		saveStatus.innerHTML = 'Options saved! Please refresh Twitch Tabs';
		console.log('test');
		setTimeout(function() {
			saveStatus.innerHTML = '';
		}, 750);
	});

	// Gets all twitch tabs
	chrome.tabs.query({
		url: '*://*.twitch.tv/*',
	}, function(tabs) {
		// If no Twitch tabs exist, stop the precheck.
		if (!Array.isArray(tabs) || !tabs.length) {
			return null;
		}
		tabs.forEach(function(tab) {
			// Initializes handshake with potential twitch-clicker.js script inside the tab
			chrome.tabs.sendMessage(tab.id,
				{bonus: bonus, bet: bet, betOptions: betOptions}, function(msg) {
				if(chrome.runtime.lastError) { msg = {}; }
				else { msg = msg || {}; }
			});
		});
	});

	console.log("Options saved");
	console.log("Bonus: " + bonus + " Bet: " + bet + " Bet Options: " + betOptions);
}

// Restores Options state using the preferences saved in chrome.storage
function restoreOptions() {
	chrome.storage.sync.get({
		bonus: false,
		bet: false,
		betOptions: null,
	}, function(items) {
		document.getElementById('autoBonus').checked = items.autoBonus;
		document.getElementById('autoBet').checked = items.autoBet;
		let bets = document.querySelector('input[name="betOptions"]:checked');
		if (bets != null) {
			bets.value = items.betOptions;
		}
		console.log("Bonus: " + items.autoBonus + " Bet: " + items.autoBet + " Bet Options: " + items.betOptions);
	});
	console.log("Options restored");


}

//On load
document.addEventListener('DOMContentLoaded', restoreOptions); //Restores options from storage on loading
document.getElementById('save').addEventListener('click', saveOptions); //Connects save function to button

