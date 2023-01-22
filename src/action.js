let true_check = false;
let bonus;
let bet;
let betOptions;
let points;
let betAmount;
// obtains options from storage
chrome.storage.sync.get({
    'bonus': false,
    'bet': false,
    'betOptions': null
}, function(items) {
    bonus = items.bonus;
    bet = items.bet;
    betOptions = items.betOptions;
});

//Switches status when user changes options
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

//Redundancy, additionally to check for handshake between background.js
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

function until(conditionFunction) {

    const poll = resolve => {
        if(conditionFunction()) resolve();
        else setTimeout(_ => poll(resolve), 1000);
    }

    return new Promise(poll);
}

function clickPointButton() {
    let elems = document.querySelector('.community-points-summary').querySelectorAll('button');
    elems.forEach(function(currentElem, index, arr) {
        if (index !== 0) {
            console.log("Clicked points")
            currentElem.click();
        }
    });
}

function openPredictionPage() {
    document.querySelector('[aria-label = "Points Balance"]').click(); // clicks on points balance
    console.log("Points balance clicked");
    let pointsText = document.querySelector('[data-test-selector = "balance-string"]')
        .firstElementChild.innerHTML; //get current points
    let pointsString = pointsText.match(/(\d+.\d+)/)[0];
    points = Number(pointsString);
    if (pointsText.includes('K')) {
        points *= 1000;
    } else if (pointsText.includes('M')) {
        points *= 1000000;
    }
    console.log("Points: " + points);
    betAmount = Math.floor(points / 12); //TODO make this 15 a user option
    document.querySelector( //gets to prediction page
        '[data-test-selector = "predictions-list-item__title"]').closest('button').click();
    console.log("Prediction interface reached");
}

function makePrediction() {
    //Making the prediction
    let percentBlueElem = document.querySelector(
        '[data-test-selector = "prediction-summary-outcome__percentage"] [style = "color: rbg(56, 122, 255);"]');
    if (percentBlueElem === null) {
        return;
    }
    let percentBlueText = percentBlueElem.innerHTML;
    let percentBlue = Number(percentBlueText.match(/(\d+)/));
    console.log("Percent Blue: " + percentBlue);

    let pointInputs = document.querySelectorAll('[type = "number"]');
    if (percentBlue < 50) {
        pointInputs[0].value = betAmount;
        document.querySelector( //clicks on blue vote button
            '[style = "background-color: rgb (56, 122, 255); border-color: rgb(56, 122, 255); color: rgb(255, 255, 255);"]')
            .closest('button').click();
        console.log("Clicked blue");
    } else {
        pointInputs[1].value = betAmount;
        document.querySelector( //clicks on red vote button
            '[style = "background-color: rgb (245, 0, 155); border-color: rgb(245, 0, 155); color: rgb(255, 255, 255);"]')
            .closest('button').click();
        console.log("Clicked red");
    }
}


function checkPage() {
    // Prevent firing script upon simultaneous redirects and fast page switching
    if (!true_check) { return }
    true_check = false;

    Arrive.unbindAllArrive();

    if (document.body.contains(document.getElementsByClassName('community-points-summary')[0])) {
        // Presumably on a channel page that already contains points section div
        console.log('Detected inside of a channel page.');
        console.log('Initializing Arrive');
        console.log('Bonus: ' + bonus + ' Bet: ' + bet + ' BetOptions: ' + betOptions);

        // Pre-check
        if (bonus) {
            clickPointButton();
            document.getElementsByClassName('community-points-summary').arrive('button',
                clickPointButton);
        }
        if (bet) {
            openPredictionPage();
            makePrediction();
            document.arrive('[data-test-selector = "community-prediction-highlight-header__title"]',
                async function() {
                try {
                    openPredictionPage();
                    let timeElement = $('p:contains("Submissions closing in"*)');
                    await until(_ => Number(timeElement.innerHTML.match(/(\d+)/)) < 15);
                    makePrediction();
                    console.log("Made a prediction");
                } catch (error) {
                    console.log(error);
                }

            });
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