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

function calcTime(){
    let timeString = $('p:contains("Submissions closing in"*)').innerHTML;
    let timeMatch = timeString.match(/\D+(\d{1,2}):(\d{2})/)[2];
    return Number(timeMatch);
}

function clickPointButton() {
    let elems = document.querySelector('.community-points-summary').querySelectorAll('button');
    elems.forEach(function(currentElem, index, arr) {
        if (index !== 0) {
            console.log("Clicked points")
            currentElem.click();
            //TODO send message and update popup with points collected

            chrome.runtime.sendMessage({increment: "addPoint"}, function(response) {
                console.log(response.confirm);
            });

        }
    });
}

function openPredictionPage() {
    if (!document.body.contains(document.querySelector('[data-test-selector = "predictions-list-item__title"]'))){
        document.querySelector('[aria-label = "Points Balance"]').click(); // clicks on points balance
        console.log("Points balance clicked");
    }
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
    betAmount = Math.floor(points * 0.1); //TODO make this 0.1 a user option (what percentage of points they want to click)
    try {
        document.querySelector( //gets to prediction page
            '[data-test-selector = "predictions-list-item__title"]').closest('button').click();
        console.log("Prediction interface reached");
    } catch (e) {
        console.log("Prediction interface reached already");
    }

}

function makePrediction() {
    //Making the prediction
    let percentBlueElem = document.querySelector(
        '[data-test-selector="prediction-summary-outcome__percentage"] [style="color: rgb(56, 122, 255);"] span');
    console.log(percentBlueElem);
    if (percentBlueElem === null) {
        console.log("Couldn't find percentage");
        return;
    }
    document.querySelector( //clicks on Predict with Custom Amount button
        '[data-test-selector = "prediction-checkout-active-footer__input-type-toggle"]').click();
    console.log("Clicked on Predict with Custom Amount button");

    let percentBlueText = percentBlueElem.innerHTML;
    let percentBlueStringMatch = percentBlueText.match(/(\d+)/)[0];
    let percentBlue = Number(percentBlueStringMatch);
    console.log("Percent Blue: " + percentBlue);

    let pointInputsBlue = document.querySelectorAll('[type = "number"]')[0];
    let pointInputsRed = document.querySelectorAll('[type = "number"]')[1];
    console.log(pointInputsBlue);
    console.log(pointInputsRed);
    if (percentBlue < (50 - ~~((0 + 1) / 2))) { //TODO make this 0 a user option (right now 0 is a placeholder for the difference between the two bet options)
        pointInputsBlue.value = betAmount;
        let event = new Event("change", { bubbles: true });
        pointInputsBlue.dispatchEvent(event);
        document.querySelector( //clicks on blue vote button
            '[style = "background-color: rgb(56, 122, 255); border-color: rgb(56, 122, 255); color: rgb(255, 255, 255);"]')
            .closest('button').click();
        console.log("Clicked blue with " + betAmount + " points");
    } else if (percentBlue > (50 + ~~((0 + 1) /2))) {
        pointInputsRed.value = betAmount;
        let event = new Event("change", { bubbles: true });
        pointInputsRed.dispatchEvent(event);
        document.querySelector( //clicks on red vote button
            '[style = "background-color: rgb(245, 0, 155); border-color: rgb(245, 0, 155); color: rgb(255, 255, 255);"]')
            .closest('button').click();
        console.log("Clicked red with " + betAmount + " points");
    } else {
        console.log("No bet made");
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
        console.log('Bonus: ' + bonus + ' Bet: ' + bet + ' BetOptions: ' + betOptions);

        // Pre-check
        if (bonus) {
            clickPointButton();
            document.getElementsByClassName('community-points-summary').arrive('button',
                clickPointButton);
        }
        if (bet) {
            try {
                openPredictionPage();
                if (calcTime() > 25) {
                    setTimeout(makePrediction, (calcTime() - 20) * 1000);
                } else {
                    makePrediction();
                }
            } catch (e) {
                console.log(e);
            }
            document.arrive('[data-test-selector = "community-prediction-highlight-header__title"]',
                async function() {
                try {
                    openPredictionPage();
                    await until (_ => calcTime() < 20); //TODO make this 20 a user option: it represents how many seconds left before the bet executes
                    console.log("Await finished!");
                    makePrediction();
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
        true_check = true;
        checkPage();
    }, 15000);

}

main();
