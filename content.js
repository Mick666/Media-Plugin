const skipDecapping = ['PM', 'MP', 'ABC', 'ACT', 'NSW', 'NT', 'VIC', 'QLD', 'WA', 'SA', 'ANZ', 'NAB', 'ANU', 'COVID-19', 'BHP', 'ALP', 'LNP', 'TAFE', 'US', 
    'CSIRO', 'UK', 'TPG', 'CEO', 'COVID', 'COVID-19', 'PCYC', 'STEM', 'AGL', 'ANSTO', 'SBS', 'GST', 'AMP', 'SMS', 'ACIC', 'NDIS', 'RBA', 'NAPLAN']
const properNouns = ['British', 'Australian', 'Australia', 'Scott', 'Morrison', 'Daniel', 'Andrews', 'Victoria', 'Queensland', 'Tasmania', 
    'Annastacia', 'Palaszczuk', 'Gladys', 'Berejiklian', 'Mark', 'McGowan', 'Steven', 'Marshall', 'Peter', 'Gutwein', 'Andrew', 'Barr',
    'Michael', 'Gunner', 'Dutton', 'Alan', 'Tudge', 'Kevin', 'Rudd', 'Anthony', 'Albanese', 'Tanya', 'Plibersek', 'Brendan', "O'Connor",
    'Michaelia', 'Parliament', 'House', 'Prime', 'Minister', 'Greg', 'Hunt', 'Marise', 'Payne', 'Ken', 'Wyatt', 'McCormack', 'ScoMo', 
    'Paul', 'Fletcher', 'Coulton', 'Gee', 'Buchholz', 'Hogan', 'Nola', 'Marino', 'Josh', 'Frydenberg', 'Sukkar', 'Hastie', 'Dave', 'Sharma', 'Jane', 'Hume', 
    'Mathias', 'Cormann', 'David', 'Littleproud', 'Sussan', 'Ley', 'Keith', 'Pitt', 'Trevor', 'Evans', 'Jonathon', 'Duniam', 'Simon', 'Birmingham', 'Alex', 
    'Hawke', 'Christian', 'Porter', 'Richard', 'Colbeck', 'Coleman', 'Linda', 'Reynolds', 'Darren', 'Chester', 'Angus', 'Taylor', 'Stuart', 'Robert', 'JobKeeper', 'JobMaker', 'JobSeeker',
    'Melbourne', 'Sydney', 'Perth', 'Darwin', 'Adelaide', 'Brisbane', 'Hobart', 'Canberra', 'Coalition', 'Huawei', 'Premier', 'Dan', 'Tehan', 'Chinese']
const possibleSubheadings = ['exclusive', 'inside']
//A, The


chrome.storage.local.get({disableLinks: true}, function(data){
    if (data.disableLinks && window.location.toString() !== 'https://app.mediaportal.com/dailybriefings/#/briefings')  document.body.addEventListener('scroll', func)
})

chrome.storage.local.get({readmoreScroll: true}, function(data){
    if (data.readmoreScroll){
        document.addEventListener('mousedown', function(e) {
            if (e.target.outerText === ' Read More') {
                setTimeout(function(){
                    e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[0].scrollIntoView(true)
                    window.scrollTo(window.scrollX, window.scrollY-150)
                }, 1000)
            }
        })
    }
})

document.addEventListener('mousedown', function(e) {
    if (e.target.nodeName === 'H4' && / Brief| Folder/.test(e.target.parentElement.outerText)) {
        document.title = e.target.innerText
    } else if (e.target.nodeName === 'SPAN' && e.target.parentElement.nodeName === 'A') {
        if (e.target.outerText === ' Coverage') {
            document.title = 'Mediaportal Coverage'
        } else if (e.target.outerText === ' Report Builder') {
            document.title = 'Report Builder'
        }
    }
})

window.onload = function() {
    if (document.getElementsByClassName('coverage-jump-trigger ng-binding').length > 0) {
        document.title = document.getElementsByClassName('coverage-jump-trigger ng-binding')[0].innerText.trimEnd()
    }
}

document.addEventListener('scroll', function() {
    let links = [...document.querySelectorAll('a')].filter(link => /app\.mediaportal\.com\/#\/connect\/media-contact/.test(link.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(link.href))
    links.map(link => link.href = '')
})

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.disableLinks === 'switch') {
            switchLinkDisabler();
        }
    }
)
    
function func() {
    let links = [...document.querySelectorAll('a')].filter(link => /app\.mediaportal\.com\/#\/connect\/media-contact/.test(link.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(link.href))
    links.map(link => link.href = '')
    // if (event.target.href && (/app\.mediaportal\.com\/#\/connect\/media-contact/.test(event.target.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.href))) {
    //     event.target.href = ''
    // }
    // if (event.target.parentElement.href && /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.href)) {
    //     event.target.parentElement.href = ''
    // } else if (event.target.parentElement.href && event.target.parentElement.parentElement.href && /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.parentElement.href)) {
    //     event.target.parentElement.href = ''
    // } else if (event.target.parentElement && 
    //         event.target.parentElement.parentElement &&
    //         event.target.parentElement.parentElement.parentElement &&
    //         event.target.parentElement.parentElement.parentElement.parentElement &&
    //         event.target.parentElement.parentElement.parentElement.parentElement.href && 
    //         /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.parentElement.parentElement.parentElement.href)) {
    //     event.target.parentElement.parentElement.parentElement.parentElement.href = ''
    // }
}

    
function switchLinkDisabler() {
    chrome.storage.local.get({disableLinks: true}, function(data){
        if (data.disableLinks)  document.body.addEventListener('mouseover', func)
        else document.body.removeEventListener('mouseover', func)
    })
}
    
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === 'getHighlightedText') {
            sendResponse({copy: window.getSelection().toString()})
        } else if (request.action === 'highlight') {
            highlightBroadcastItems()
        } else if (request.action === 'checkingWords') {
            checkingHighlights()
        } else if (request.action === 'copyIDs') {
            let IDs = getAllIDs()
            sendResponse({copy: IDs})
        }
});
        
function highlightBroadcastItems() {
    const headlines = document.body.getElementsByClassName('headline mp-page-ellipsis headerRow');
    for (let i = 0; i < headlines.length; i++) {
        if ((/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/).test(headlines[i].firstChild.innerText) 
            && (headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === 'fa-volume-up' || 
            headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === 'fa-video')) {
            headlines[i].firstChild.innerHTML = headlines[i].firstChild.innerHTML
                .replace(/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/gi, function(match) {
                    return "<span style='background-color:#FDFF47;'>" + match + "</span>"
                })
        }
    }
}

function cleanUpAuthorLines(byline) {
    console.log(byline)
    if (byline.length > 1 && byline[1] === 'Letters') {
        byline[1] = "<span style='background-color:#8A2BE2;'>" + byline[1] + "</span>" 
    }
    if (byline.length < 4) return byline
    let splitByline = byline[3].split(' ')
    if (byline[3].toUpperCase() === byline[3]) {
        byline[3] = "<span style='background-color:#FDFF47;'>" + byline[3] + "</span>" 
    } else if (splitByline.length === 1) {
        byline[3] = "<span style='background-color:#00FF00;'>" + byline[3] + "</span>" //Possible proper noun;
    } else if (splitByline.length > 2 && byline[3].search(/and/) === -1) {
        if (!/ van | le /i.test(byline[3])) {
            byline[3] = "<span style='background-color:#00FF00;'>" + byline[3] + "</span>" //Possible proper noun
        }
        return byline
    } else if (byline[3].search(/Alice Man/) > -1) {
        byline[3] = "<span style='background-color:#00FF00;'>" + byline[3] + "</span>" //Possible proper noun
    }
    return byline
}

function highlightHeadlines(headline, headlinesChecked) {
    let editedHeadline = headline
    if (headline.toUpperCase() === headline) {
        editedHeadline = "<span style='background-color:#FDFF47;'>" + headline + "</span>" 
    } else if (headlinesChecked.indexOf(headline.toLowerCase()) > -1) {
        editedHeadline = "<span style='background-color:#00FF00;'>" + headline + "</span>" 
    }
    headlinesChecked.push(headline.toLowerCase())
    return editedHeadline
}

function checkingHighlights() {
    let links = document.querySelectorAll('a')
    let items = [...document.getElementsByClassName('mj-column-per-100 outlook-group-fix')]
        .filter(item => item.children[0].tagName === 'TABLE' 
        && item.children[0].children[0].tagName === 'TBODY' 
        && (item.children[0].children[0].children.length === 5 || item.children[0].children[0].children.length === 4))
    let headlinesChecked = []

    for (let i = 0; i < links.length; i++) {
        if (links[i].innerHTML === 'Read Plain Text' || links[i].innerHTML === 'Read More') break

        if (links[i].innerHTML.match(/MonitorReport\-/)) {
            links[i].style.backgroundColor = '#00FF00'
        }
    }
    let i = 0
    if (items[0].outerText.match(/LINKS|EXECUTIVE SUMMARY/)) i++

    for (i; i < items.length; i++) {
        let headline = items[i].children[0].children[0].children[0].children[0].children[0].innerHTML.trimStart().replace(/ {2,}/g, '').replace('\n', '');
        let authorLine = items[i].children[0].children[0].children[1].children[0].children[0].innerHTML.trimStart().replace(/ {2,}/g, '').replace('\n', '').split(', ')

        items[i].children[0].children[0].children[0].children[0].children[0].innerHTML = highlightHeadlines(headline, headlinesChecked);
        items[i].children[0].children[0].children[1].children[0].children[0].innerHTML = cleanUpAuthorLines(authorLine).join(', ')


        items[i].children[0].children[0].children[2].children[0].children[0].children[0].innerHTML =
        items[i].children[0].children[0].children[2].children[0].children[0].children[0].innerHTML.trimStart().replace(/ {2,}/g, '').replace('\n', '')
            .replace(/.*?[\.!\?](?:\s|$)/, function(match) {
                return match.replace('writes', function(submatch) {
                    return "<span style='background-color:#8A2BE2;'>" + submatch + "</span>" // possible subheading
                })
            })
            .replace(/^.*?[\.!\?](?:\s|$)/g, function(match) {
                return match
                    .replace(/([^ \W]*[A-Z]{2,}[^ \W]*)/g, function(submatch) {
                        if (skipDecapping.indexOf(submatch) > -1 || submatch === 'I' || submatch === 'MPs') return submatch
                        return "<span style='background-color:#FDFF47;'>" + submatch + '</span> ' // possible all caps
                    })
                    .replace(/([^ \W]*[a-z]+[^ \W]*)/g, function(submatch) {
                        if (submatch === 'amp') return submatch
                        // Checks the lower case & title case words
                        if (skipDecapping.indexOf(submatch.toUpperCase()) > -1) return "<span style='background-color:#00FF00;'>" + submatch + '</span> '
                        else if ((submatch === submatch.toLowerCase() || submatch === submatch.toUpperCase()) && properNouns.indexOf(toSentenceCase(submatch)) > -1 ) {
                            return "<span style='background-color:#00FF00;'>" + submatch + '</span> ' //Possible proper noun
                        } else if (submatch.toLowerCase() === 'scomo' && submatch !== 'ScoMo') {
                            return "<span style='background-color:#00FF00;'>" + submatch + '</span> ' //Possible ScoMo miscapping
                        }
                        return submatch
                    })
                    .replace(/^([^ \W]*[a-z]+[^ \W]*)/, function(submatch) {
                    // Checks the first word of the match
                        if (submatch !== toSentenceCase(submatch) && skipDecapping.indexOf(submatch) === -1) return "<span style='background-color:#FDFF47;'>" + submatch + '</span> ' //Possible all caps
                        else if (possibleSubheadings.indexOf(submatch.toLowerCase()) > -1) return "<span style='background-color:#8A2BE2;'>" + submatch + '</span> ' // Possible subheadings
                        return submatch
                    })
                    .replace(/([^ \W]*[a-z]+[^ \W]*)/g, function(submatch, _, offset) {
                        if ((submatch === 'The' || submatch === 'A') && offset > 0) {
                            return "<span style='background-color:#8A2BE2;'>" + submatch + '</span> ' // Possible subheadings
                        }
                        return submatch
                    })
            })
            .replace(/(fuck|shit|cunt|dick|boob|bitch|fag|nigger|chink|gook)*/ig, function(submatch) {
                if (submatch.length > 0) return "<span style='background-color:#FF0000;'>" + submatch + "</span>" // swear word
                return submatch
            })
    }
}

const toSentenceCase = (word) => word.split('').map((letter, index) => {
    if (index === 0) {
        return letter.toUpperCase()
    } else return letter.toLowerCase()
}).join('')

function getAllIDs() {
    return [...document.getElementsByClassName('list-unstyled media-item-meta-data-list')].map(item => item.firstChild.innerText.replace('Item ID: ', '')).join('\n')
}