function saveOptions() {
	let bonus = document.getElementById('autoBonus').checked;
	let bet = document.getElementById('autoBet').checked;
	let minPercent = document.querySelector('input[id="minPercent"]').value;
	let seconds = document.getElementById('seconds').value;
	let percentToBet = document.getElementById('percentToBet').value;
	let pointSum = document.getElementById('accumulatedClickPoints').innerHTML;
	let predSum = document.getElementById('accumulatedPredictionsMade').innerHTML;
	chrome.storage.sync.set({
		bonus: bonus,
		bet: bet,
		minPercent: minPercent,
		seconds : seconds,
		percentToBet: percentToBet,
		pointSum: pointSum,
		predSum: predSum
	}, function() {
		// Update status to let user know options were saved.
		let saveStatus = document.getElementById('status');
		saveStatus.innerHTML = 'Options saved! Please refresh tab for changes to take effect.';
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
				{bonus: bonus, bet: bet, minPercent: minPercent, seconds: seconds,
					pointSum: pointSum, predSum: predSum},
				function(msg) {
				if(chrome.runtime.lastError) { msg = {}; }
				else { msg = msg || {}; }
			});
		});
	});

	console.log("Options saved!");
}

// Restores Options state using the preferences saved in chrome.storage
function restoreOptions() {
	chrome.storage.sync.get({
		'bonus': false,
		'bet': false,
		'minPercent': '10',
		'seconds': '10',
		'percentToBet': '10',
		'pointSum': '0',
		'predSum': '0'
	}, function(items) {
		document.getElementById('autoBonus').checked = items.bonus;
		document.getElementById('autoBet').checked = items.bet;
		document.getElementById('minPercent').value = items.minPercent;
		document.getElementById('percentDisplay').innerHTML = items.minPercent + "%";
		document.getElementById('seconds').value = items.seconds;
		document.getElementById('secondsDisplay').innerHTML = items.seconds + "s";
		document.getElementById('percentToBet').value = items.percentToBet;
		document.getElementById('percentToBetDisplay').innerHTML = items.percentToBet + "%";
		document.getElementById('accumulatedClickPoints').innerHTML = (Number(items.pointSum) * 50).toString();
		document.getElementById('accumulatedPredictionsMade').innerHTML = items.predSum;
	});
	console.log("Options restored");

}

//For updating slider values
let percentSlider = document.getElementById("minPercent");
let percentDisplay = document.getElementById("percentDisplay");
let secondsSlider = document.getElementById("seconds");
let secondsDisplay = document.getElementById("secondsDisplay");
let percentToBetSlider = document.getElementById("percentToBet");
let percentToBetDisplay = document.getElementById("percentToBetDisplay");

//On load
document.addEventListener('DOMContentLoaded', restoreOptions); //Restores options from storage on loading
document.getElementById('save').addEventListener('click', saveOptions); //Connects save function to button
percentSlider.addEventListener('input', function() {
	percentDisplay.innerHTML = percentSlider.value+"%";
});
secondsSlider.addEventListener('input', function() {
	secondsDisplay.innerHTML = secondsSlider.value+"s";
});
percentToBetSlider.addEventListener('input', function() {
	percentToBetDisplay.innerHTML = percentToBetSlider.value+"%";
});
