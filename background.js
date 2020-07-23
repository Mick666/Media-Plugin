//  To set the clipboard's text, we need to use a background html page with a dummy field we can set the value of.
//  To get the highlighted text though, we need to send a message to the content.js file, and get the text in the response.
//  Some of these are to save typing, so we don't need to send the message to the content.js file.
const commandObj = {'static-text-1':0, 'static-text-2':1, 'static-text-3':2, 'static-text-4':3, 'static-text-5':4, 'static-text-6':5, 'static-text-7':6, 'static-text-8':7, 'static-text-9':8, 't_static-text-10':9}
chrome.commands.onCommand.addListener(function (command) {
    console.log(command)
    if (command === '1_paste') {
        chrome.storage.local.get({decap: true}, function(result) {
            getHighlightedText(command, result.decap)
        })
    } else if (command === '2_abc') {
        chrome.storage.local.get({decap: true}, function(result) {
            getHighlightedText(command, result.decap)
        })
    } else if (command === 'highlightBroadcast') {
        highlightBroadcast()
    } else if (command === 'highlightPreviewWords') {
        checkingWords()
    } else if (command === 'copyIDs') {
        getAllIDs()
    } else if (command === 'addLink') {
        addLink()
    }  else if (command === 'openLinks') {
        openLinks()
    } else {
        copy('', command)
    } 
})

let savedLinks = []

//Common words which should capitalised in different ways
const skipDecapping = ['PM', 'MP', 'ABC', 'ACT', 'NSW', 'NT', 'VIC', 'QLD', 'WA', 'SA', 'ANZ', 'NAB', 'ANU', 'COVID-19', 'BHP', 'ALP', 'LNP', 'TAFE', 'US', 
    'CSIRO', 'UK', 'TPG', 'CEO', 'COVID', 'COVID-19', 'PCYC', 'STEM', 'AGL', 'ANSTO', 'SBS', 'GST', 'AMP', 'SMS', 'ACIC', 'NDIS', 'RBA', 'NAPLAN']
const properNouns = ['British', 'Australian', 'Australia', 'Scott', 'Morrison', 'Daniel', 'Andrews', 'Victoria', 'Queensland', 'Tasmania', 
    'Annastacia', 'Palaszczuk', 'Gladys', 'Berejiklian', 'Mark', 'McGowan', 'Steven', 'Marshall', 'Peter', 'Gutwein', 'Andrew', 'Barr', 
    'Michael', 'Gunner', 'Dutton', 'Alan', 'Tudge', 'Kevin', 'Rudd', 'Anthony', 'Albanese', 'Tanya', 'Plibersek', 'Brendan', 'O\'Connor', 
    'Michaelia', 'Cash', 'Parliament', 'House', 'Prime', 'Minister', 'Greg', 'Hunt', 'Marise', 'Payne', 'Ken', 'Wyatt', 'McCormack', 'ScoMo', 
    'Paul', 'Fletcher', 'Coulton', 'Gee', 'Buchholz', 'Hogan', 'Nola', 'Marino', 'Josh', 'Frydenberg', 'Sukkar', 'Hastie', 'Dave', 'Sharma', 'Jane', 'Hume', 
    'Mathias', 'Cormann', 'David', 'Littleproud', 'Sussan', 'Ley', 'Keith', 'Pitt', 'Trevor', 'Evans', 'Jonathon', 'Duniam', 'Simon', 'Birmingham', 'Alex', 
    'Hawke', 'Christian', 'Porter', 'Richard', 'Colbeck', 'Coleman', 'Linda', 'Reynolds', 'Darren', 'Chester', 'Angus', 'Taylor', 'Stuart', 'Robert', 'JobKeeper', 'JobMaker', 'JobSeeker',
    'Melbourne', 'Sydney', 'Perth', 'Darwin', 'Adelaide', 'Brisbane', 'Hobart', 'Canberra', 'Coalition', 'Huawei', 'Premier', 'Dan', 'Tehan', 'Chinese']

// This sets the clipboard based on the key combination, cleaning it up in some cases, setting it to a commonly used term in others.
function copy(str, setting, decap = true) {
    var sandbox = document.getElementById('sandbox')
    if (setting === '1_paste') {
        let words = str.replace(/, pictured,|, pictured left,|, pictured right,/, '')
            .replace(/\(pictured\) |\(pictured left\) |\(pictured right\) /, '')
            .replace(/\n/g, ' ')
            .replace(/^ /, '')
            .replace(/ {2}/g, ' ')
            .split(' ')
        if (decap) {
            for (let i = 0; i < 3 && i < words.length; i++) {
                if (words[i+1]) words[i] = decapWord(words[i], i, words[i+1])
                else words[i] = decapWord(words[i], i)
            }
        }
        sandbox.value = words.join(' ')
        sandbox.select()
        document.execCommand('copy')
        sandbox.value = ('')
    } else if (setting === '2_abc') {
        let words = str.replace(/, pictured,|, pictured left,|, pictured right,/, '')
            .replace(/\(pictured\) |\(pictured left\) |\(pictured right\) /, '')
            .replace(/ Key points.*\n/, '\n')
            .split('\n')
            .filter(x => x.length > 0 && 
            (x.endsWith('.') || 
            x.endsWith('\'') || 
            x.endsWith('!') || 
            x.endsWith('?') ||
            x.endsWith('\'')
            ))
            .join(' ').split(' ')
        if (decap) {
            for (let i = 0; i < 3 && i < words.length; i++) {
                words[i] = decapWord(words[i], i)
            }
        }
        sandbox.value = words.join(' ')
        sandbox.select()
        document.execCommand('copy')
        sandbox.value = ('')
    } else if (setting === 'copyIDs') {
        sandbox.value = str
        sandbox.select()
        document.execCommand('copy')
        sandbox.value = ('')
    }  else {
        chrome.storage.local.get({staticText: ['Similar coverage reported by: ', 'Also in other publications']}, function(result) {
            console.log(result)
            console.log(setting)
            sandbox.value = result.staticText[commandObj[setting]]
            sandbox.select()
            document.execCommand('copy')
            sandbox.value = ('')
        })
    } 
    // else if (setting === 'static-text-2') {
    //     sandbox.value = 'Also in other publications'
    // } 
}

// This gets the highlighted text from the webpage.
function getHighlightedText(setting, decap) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getHighlightedText'}, function(response) {
            copy(response.copy, setting, decap)
        })
    })
}

function getAllIDs() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'copyIDs'}, function(response) {
            copy(response.copy, 'copyIDs')
        })
    })
}

function highlightBroadcast() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'highlight'})
    })
}

function checkingWords() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'checkingWords'})
    })
}
function decapWord(word, i, nextWord) {
    const splitWord = word.split('\'')
    if (isCapitalised(word) && skipDecapping.indexOf(word) === -1) {
        if (properNouns.indexOf(toSentenceCase(word)) > -1 || i === 0) {
            return toSentenceCase(word)
        } else if (splitWord.length > 1) {
            if (skipDecapping.indexOf(splitWord[0]) > -1) return `${splitWord[0].toUpperCase()}'s`
            else if (properNouns.indexOf(toSentenceCase(splitWord[0])) > -1) return `${toSentenceCase(splitWord[0])}'s`
            return word
        } else if (word.toUpperCase() === 'MPS') return 'MPs' 
        else if (word.toLowerCase() === 'federal' && (nextWord === 'Government' || nextWord === 'GOVERNMENT')) return 'Federal'

        return word.toLowerCase()
    } else if (skipDecapping.indexOf(word) > -1) {
        return word.toUpperCase() 
    } 
    return word
}

function addLink() {
    var sandbox = document.getElementById('sandbox')
    sandbox.select()
    document.execCommand('paste')
    savedLinks.push(sandbox.value)
    console.log(savedLinks)
    sandbox.value = ('')
}

function openLinks() {
    var sandbox = document.getElementById('sandbox')
    sandbox.value = savedLinks.join('\n').replace(' ', '')
    sandbox.select()
    document.execCommand('copy')
    sandbox.value = ('')
    console.log(savedLinks)
    for (let i = 0; i < savedLinks.length; i++) {
        chrome.tabs.create({url: savedLinks[i], active: false})
    }
    savedLinks = []
}

const isCapitalised = (word) => word.toUpperCase() === word
const toSentenceCase = (word) => word.split('').map((letter, index) => {
    if (index === 0) {
        return letter.toUpperCase()
    } else return letter.toLowerCase()
}).join('')




// ,
//     'browser_action': {
//         'default_icon': 'images/icon-48.png',
//         'default_popup': 'popup.html',
//         'default_title': 'MP Improvements'
//       },