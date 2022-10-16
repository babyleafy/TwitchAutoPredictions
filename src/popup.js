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
    checkForPoints();
}

main();