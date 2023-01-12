const data = await chrome.storage.sync.get(['bonus', 'bet', 'betOptions']);
let true_check = false;
let bonus = data.bonus;
let bet = data.bet;
let betOptions = data.betOptions;
// obtain from either storage directly or selected buttons

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
        let storageChange = changes[key];
        if (key === 'bonus') {
            bonus = storageChange.newValue;
            console.log("Bonus: " + bonus);
        }
        else if (key === 'bet') {
            bet = storageChange.newValue;
            console.log("Bet: " + bet);
        }
        else if (key === 'betOptions') {
            betOptions = storageChange.newValue;
            console.log("BetOptions: " + betOptions);
        }
    }
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.text === "check") {
        sendResponse({status: 'confirmed'});
    }
    if ('bonus' in msg) {
        bonus = msg.bonus;
        sendResponse({status: 'ok'});
    }
    if ('bet' in msg) {
        bet = msg.bet;
        sendResponse({status: 'ok'});
    }
    if ('betOptions' in msg) {
        betOptions = msg.betOptions;
        sendResponse({status: 'ok'});
    }
    if ('urlChanged' in msg) {
        true_check = true;
        setTimeout(checkPage, 5000);
        sendResponse({status: 'ok'})
    }

});

function clickPointButton() {
    let elems = document.querySelector('.community-points-summary').querySelectorAll('button');
    elems.forEach(function(currentElem, index, arr) {
        if (index !== 0) {
            console.log("Clicked points")
            currentElem.click();
        }
    });
}

function checkPage() {
    // Prevent firing script upon simultaneous redirects and fast page switching
    if (!true_check) { return }
    true_check = false;

    Arrive.unbindAllArrive();

    if (document.body.contains(document.getElementsByClassName('community-points-summary')[0])) {
        // Presumably on a channel page that already contains points section div
        console.log('Detected inside of a channel page.');
        console.log(true_check);
        console.log('Initializing Arrive');
        console.log('Bonus: ' + bonus + ' Bet: ' + bet + ' BetOptions: ' + betOptions);

        // Pre-check
        if (bonus) {
            clickPointButton();
            document.getElementsByClassName('community-points-summary').arrive('button',
                clickPointButton);
        }

    }
    else {
        // Presumably outside a channel page
        console.log('Detected outside of a channel page.');
    }
}

function main() {
    setTimeout(function() {
        console.log('Twitch Points Autoclicker: Initialized!');

        true_check = true;
        checkPage();
    }, 10000);

}

main();