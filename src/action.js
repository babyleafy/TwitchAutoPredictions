let true_check = false;
let bonus;
let bet;
let minPercent;
let seconds;
let pointSum;
let betAmount;
let percentToBet;
// obtains options from storage
chrome.storage.sync.get({
    'bonus': false,
    'bet': false,
    'minPercent': '10',
    'seconds': '10',
    'percentToBet': '10',
    'pointSum': '0',
}, function(items) {
    bonus = items.bonus;
    bet = items.bet;
    minPercent = items.minPercent;
    seconds = items.seconds;
    percentToBet = items.percentToBet;
    pointSum = items.pointSum;
});

//Switches status when user changes options
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
        let storageChange = changes[key];
        switch (key) {
            case 'bonus':
                bonus = storageChange.newValue;
                break;
            case 'bet':
                bet = storageChange.newValue;
                break;
            case 'minPercent':
                minPercent = storageChange.newValue;
                break;
            case 'seconds':
                seconds = storageChange.newValue;
                break;
            case 'percentToBet':
                percentToBet = storageChange.newValue;
                break;
            case 'pointSum':
                pointSum = storageChange.newValue;
                break;
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
    if ('minPercent' in msg) {
        minPercent = msg.minPercent;
        sendResponse({status: 'ok'});
    }
    if ('seconds' in msg) {
        seconds = msg.seconds;
        sendResponse({status: 'ok'});
    }
    if ('percentToBet' in msg) {
        percentToBet = msg.percentToBet;
        sendResponse({status: 'ok'});
    }
    if ('pointSum' in msg) {
        pointSum = msg.pointSum;
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
    let timeString = $('p:contains("Submissions closing in")').html();
    let timeMatch = timeString.match(/\D+(\d{1,2}):(\d{2})/);
    if (timeMatch !== null) {
        let timeMinutes = timeMatch[1];
        let timeSeconds = timeMatch[2];
        console.log("Time: " + timeMatch);
        return Number(timeMinutes) * 60 + Number(timeSeconds);
    }
    return 15;
}

function clickPointButton() {
    let elems = document.querySelector('.community-points-summary').querySelectorAll('button');
    elems.forEach(function(currentElem, index, arr) {
        if (index !== 0) {
            console.log("Clicked bonus!")
            currentElem.click();
            chrome.runtime.sendMessage({increment: 1}, function(response) {
                if(chrome.runtime.lastError) { msg = {}; }
                else { msg = msg || {}; }
            });
        }
    });
}

function openPredictionPage() {
    if (!document.body.contains(document.querySelector('[data-test-selector = "predictions-list-item__title"]'))){
        document.querySelector('[aria-label = "Points Balance"]').click(); // clicks on points balance
    } //TODO check if clicking point balance will actually close the prediction page (might need to use while loop to click until predictionlistitem is found)
    let pointsText = document.querySelector('[data-test-selector = "balance-string"]')
        .firstElementChild.innerHTML; //get current points
    let pointsString = pointsText.match(/(\d+.\d+)/);
    let points = Number(pointsString[0]);
    if (pointsText.includes('K')) {
        points *= 1000;
    } else if (pointsText.includes('M')) {
        points *= 1000000;
    }
    betAmount = Math.floor(points * (Number(percentToBet) / 100));
    try {
        document.querySelector( //gets to prediction page
            '[data-test-selector = "predictions-list-item__title"]').closest('button').click();
    } catch (e) {
    }
}

function makePrediction() {
    //Making the prediction
    let percentBlueElem = document.querySelector(
        '[data-test-selector="prediction-summary-outcome__percentage"] [style="color: rgb(56, 122, 255);"] span');
    console.log(percentBlueElem);
    if (percentBlueElem === null) {
        return;
    }
    document.querySelector( //clicks on Predict with Custom Amount button
        '[data-test-selector = "prediction-checkout-active-footer__input-type-toggle"]').click();

    //Get blue percent and red percent
    let percentBlueText = percentBlueElem.innerHTML;
    let percentBlueStringMatch = percentBlueText.match(/(\d+)/);
    let percentBlue = Number(percentBlueStringMatch[0]);
    let pointInputsBlue = document.querySelectorAll('[type = "number"]')[0];
    let pointInputsRed = document.querySelectorAll('[type = "number"]')[1];

    if (percentBlue < (50 - ~~(Number(minPercent) / 2))) {
        pointInputsBlue.value = betAmount;
        let event = new Event("change", { bubbles: true });
        pointInputsBlue.dispatchEvent(event);
        document.querySelector( //clicks on blue vote button
            '[style = "background-color: rgb(56, 122, 255); border-color: rgb(56, 122, 255); color: rgb(255, 255, 255);"]')
            .closest('button').click();
        console.log("Clicked blue with " + betAmount + " points");

        //Send message to background script to increment prediction count
        chrome.runtime.sendMessage({increment: 2}, function(response) {
            if(chrome.runtime.lastError) { msg = {}; }
            else { msg = msg || {}; }
        });

    } else if (percentBlue > (50 + ~~(Number(minPercent) /2))) {
        pointInputsRed.value = betAmount;
        let event = new Event("change", { bubbles: true });
        pointInputsRed.dispatchEvent(event);
        document.querySelector( //clicks on red vote button
            '[style = "background-color: rgb(245, 0, 155); border-color: rgb(245, 0, 155); color: rgb(255, 255, 255);"]')
            .closest('button').click();
        console.log("Clicked red with " + betAmount + " points");

        //Send message to background script to increment prediction count
        chrome.runtime.sendMessage({increment: 2}, function(response) {
            if(chrome.runtime.lastError) { msg = {}; }
            else { msg = msg || {}; }
        });

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
        // Pre-check
        if (bonus) {
            clickPointButton();
            document.getElementsByClassName('community-points-summary').arrive('button',
                clickPointButton);
        }
        if (bet) {
            try {
                openPredictionPage();
                if (calcTime() > Number(seconds)) {
                    setTimeout(makePrediction, (calcTime() - Number(seconds)) * 1000);
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
                    await until (_ => calcTime() < Number(seconds));
                    console.log("Await finished!");
                    makePrediction();
                } catch (e) {
                    console.log(e);
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
