const skipDecapping = ["PM", "MP", "ABC", "ACT", "NSW", "NT", "VIC", "QLD", "WA", "SA", "ANZ", "NAB", "ANU", "COVID-19", "BHP", "ALP", "LNP", "TAFE", "US", "CSIRO", "UK", "TPG", "CEO"]
const properNouns = ["British", "Australian", "Australia", "Scott", "Morrison", "Daniel", "Andrews", "Victoria", "Queensland", "Tasmania", 
"Annastacia", "Palaszczuk", "Gladys", "Berejiklian", "Mark", "McGowan", "Steven", "Marshall", "Peter", "Gutwein", "Andrew", "Barr", 
"Michael", "Gunner", "Dutton", "Alan", "Tudge", "Kevin", "Rudd", "Anthony", "Albanese", "Tanya", "Plibersek", "Brendan", "O'Connor", 
"Michaelia", "Cash", "Parliament", "House", "Prime", "Minister", "Greg", "Hunt", "Marise", "Payne", "Ken", "Wyatt", "McCormack", "ScoMo", 
"Paul", "Fletcher", "Coulton", "Gee", "Buchholz", "Hogan", "Nola", "Marino", "Josh", "Frydenberg", "Sukkar", "Hastie", "Dave", "Sharma", "Jane", "Hume", 
"Mathias", "Cormann", "David", "Littleproud", "Sussan", "Ley", "Keith", "Pitt", "Trevor", "Evans", "Jonathon", "Duniam", "Simon", "Birmingham", "Alex", 
"Hawke", "Christian", "Porter", "Richard", "Colbeck", "Coleman", "Linda", "Reynolds", "Darren", "Chester", "Angus", "Taylor", "Stuart", "Robert", "JobKeeper", "JobMaker", "JobSeeker",
"Melbourne", "Sydney", "Perth", "Darwin", "Adelaide", "Brisbane", "Hobart", "Canberra", "Coalition"]
const possibleSubheadings = ["exclusive", "inside"]


chrome.storage.local.get({disableLinks: true}, function(data){
    if (data.disableLinks && window.location.toString() !== "https://app.mediaportal.com/dailybriefings/#/briefings")  document.body.addEventListener("mouseover", func)
})

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.disableLinks === "switch") {
            switchLinkDisabler();
        }
    }
)
    
function func(event) {
    if (event.target.href && (/app\.mediaportal\.com\/#\/connect\/media-contact/.test(event.target.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.href))) {
        event.target.href = ""
    }
    if (event.target.parentElement.href && /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.href)) {
        event.target.parentElement.href = ""
    } else if (event.target.parentElement.href && event.target.parentElement.parentElement.href && /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.parentElement.href)) {
        event.target.parentElement.href = ""
    } else if (event.target.parentElement && 
            event.target.parentElement.parentElement &&
            event.target.parentElement.parentElement.parentElement &&
            event.target.parentElement.parentElement.parentElement.parentElement &&
            event.target.parentElement.parentElement.parentElement.parentElement.href && 
            /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.parentElement.parentElement.parentElement.href)) {
        event.target.parentElement.parentElement.parentElement.parentElement.href = ""
    }
}

    
function switchLinkDisabler() {
    chrome.storage.local.get({disableLinks: true}, function(data){
        if (data.disableLinks)  document.body.addEventListener("mouseover", func)
        else document.body.removeEventListener("mouseover", func)
    })
}
    
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getHighlightedText") {
            sendResponse({copy: window.getSelection().toString()});
        } else if (request.action === "highlight") {
            highlightBroadcastItems()
        } else if (request.action === "checkingWords") {
            checkingHighlights()
        }
    });
        
function highlightBroadcastItems() {
    const headlines = document.body.getElementsByClassName("headline mp-page-ellipsis headerRow");
    for (let i = 0; i < headlines.length; i++) {
        if ((/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/).test(headlines[i].firstChild.innerText) 
            && (headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === "fa-volume-up" || 
            headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === "fa-video")) {
                    headlines[i].firstChild.innerHTML = headlines[i].firstChild.innerHTML
                    .replace(/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/gi, function(match) {
                        return '<span style="background-color:#FDFF47;">' + match + "</span>";
                    });
            }
    }
}

function checkingHighlights() {
    let items = [...document.getElementsByClassName("mj-column-per-100 outlook-group-fix")]
    .filter(item => item.children[0].tagName === "TABLE" 
    && item.children[0].children[0].tagName === "TBODY" 
    && (item.children[0].children[0].children.length === 5 || item.children[0].children[0].children.length === 4))
    console.log(items)

    for (let i = 1; i < items.length; i++) {
        items[i].children[0].children[0].children[2].children[0].children[0].children[0].innerHTML =
        items[i].children[0].children[0].children[2].children[0].children[0].children[0].innerHTML.trimStart().replace(/ {2,}/g, "").replace("\n", "")
        .replace(/.*?[\.!\?](?:\s|$)/, function(match) {
            return match.replace("writes", function(submatch) {
                return ' <span style="background-color:#8A2BE2;">' + submatch + "</span>"
            })
        })
        .replace(/^(\w+\s){1,10}/g, function(match) {
            return match
            .replace(/([^ \W]*[A-Z]{2,}[^ \W]*)/g, function(submatch) {
                if (skipDecapping.indexOf(submatch) > -1) return submatch;
                return ' <span style="background-color:#FDFF47;">' + submatch + "</span> "
            })
            .replace(/([^ \W]*[a-z]+[^ \W]*)/g, function(submatch) {
                if (skipDecapping.indexOf(submatch.toUpperCase()) > -1) return ' <span style="background-color:#00FF00;">' + submatch + "</span> "
                else if ((submatch === submatch.toLowerCase() || submatch === submatch.toUpperCase()) && properNouns.indexOf(toSentenceCase(submatch)) > -1 ) return ' <span style="background-color:#00FF00;">' + submatch + "</span> "
                return submatch;
            })
            .replace(/^([^ \W]*[a-z]+[^ \W]*)/, function(submatch) {
                if (submatch !== toSentenceCase(submatch) && skipDecapping.indexOf(submatch) === -1) return ' <span style="background-color:#FDFF47;">' + submatch + "</span> "
                else if (possibleSubheadings.indexOf(submatch.toLowerCase()) > -1) return ' <span style="background-color:#8A2BE2;">' + submatch + "</span> "
                return submatch;
            })
        })
        .replace(/(fuck|shit|cunt|dick|boob|bitch|fag|nigger|chink|gook)*/ig, function(submatch) {
            if (submatch.length > 0) return '<span style="background-color:#FF0000;">' + submatch + "</span>"
            return submatch;
        })
    }
}

const toSentenceCase = (word) => word.split("").map((letter, index) => {
    if (index === 0) {
        return letter.toUpperCase();
    } else return letter.toLowerCase();
}).join("")