function saveOptions() {
	var bonus = document.getElementById('autoBonus').checked;
	var bet = document.getElementById('autoBet').checked;
	var betOption = document.querySelector('input[name="betOptions"]:checked').value;
	var betPPPOption = document.querySelector('input[name="PPP"]:checked').value;

	chrome.storage.sync.set({
		bonus: bonus,
		bet: bet,
		betOption: betOption,
		betPPPOption: betPPPOption
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Options saved!';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}

// Restores Options state using the preferences saved in chrome.storage
function restoreOptions() {
	chrome.storage.sync.get({
		bonus: false,
		bet: false,
		betOption: false,
		betPPPOption: false,
	}, function(items) {
		document.getElementById('autoBonus').checked = items.autoBonus;
		document.getElementById('autoBet').checked = items.autoBet;
		document.querySelector('input[name="betOptions"]:checked').value = items.betOptions;
		document.querySelector('input[name="PPP"]:checked').value = items.betPPPOption;
	});
}

function clickPointButton() {
    var elems = document.querySelector('.community-points-summary').querySelectorAll('button');
    elems.forEach(function(currentElem, index, arr) {
		if (index != 0) {
			currentElem.click();
		}
	});
}

function checkForPoints () {
	Arrive.unbindAllArrive();
	if (document.body.contains(document.getElementsByClassName('community-points-summary')[0])) {
		clickPointButton();
	}
}

function main() {
	if (document.getElementById('autoBonus').checked) {
		checkForPoints();
	}
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

main();