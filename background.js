import fetchFromServer from './briefingChecks.js'
//  To set the clipboard's text, we need to use a background html page with a dummy field we can set the value of.
//  To get the highlighted text though, we need to send a message to the content.js file, and get the text in the response.
//  Some of these are to save typing, so we don't need to send the message to the content.js file.
const commandObj = { 'static-text-1': 0, 'static-text-2': 1, 'static-text-3': 2, 'static-text-4': 3, 'static-text-5': 4, 'static-text-6': 5, 'static-text-7': 6, 'static-text-8': 7, 'static-text-9': 8, 't_static-text-10': 9 }
let savedLinks = []
let savedIDs = []

//Common words which should capitalised in different ways
const defaultCopyCaps = ['PM', 'MP', 'ABC', 'ACT', 'NSW', 'NT', 'VIC', 'QLD', 'WA', 'SA', 'ANZ', 'NAB', 'ANU', 'COVID-19', 'BHP', 'ALP', 'LNP', 'TAFE', 'US',
    'CSIRO', 'UK', 'TPG', 'CEO', 'COVID', 'COVID-19', 'PCYC', 'STEM', 'AGL', 'ANSTO', 'SBS', 'GST', 'AMP', 'SMS', 'ACIC', 'NDIS', 'RBA', 'NAPLAN', 'AFP', 'SES']
const defaultProperNouns = ['British', 'Australian', 'Australia', 'Scott', 'Morrison', 'Daniel', 'Andrews', 'Victoria', 'Queensland', 'Tasmania',
    'Annastacia', 'Palaszczuk', 'Gladys', 'Berejiklian', 'Mark', 'McGowan', 'Steven', 'Marshall', 'Peter', 'Gutwein', 'Andrew', 'Barr',
    'Michael', 'Gunner', 'Dutton', 'Alan', 'Tudge', 'Kevin', 'Rudd', 'Anthony', 'Albanese', 'Tanya', 'Plibersek', 'Brendan', 'O\'Connor',
    'Michaelia', 'Cash', 'Parliament', 'House', 'Prime', 'Minister', 'Greg', 'Hunt', 'Marise', 'Payne', 'Ken', 'Wyatt', 'McCormack', 'ScoMo',
    'Paul', 'Fletcher', 'Coulton', 'Gee', 'Buchholz', 'Hogan', 'Nola', 'Marino', 'Josh', 'Frydenberg', 'Sukkar', 'Hastie', 'Dave', 'Sharma', 'Jane', 'Hume',
    'Mathias', 'Cormann', 'David', 'Littleproud', 'Sussan', 'Ley', 'Keith', 'Pitt', 'Trevor', 'Evans', 'Jonathon', 'Duniam', 'Simon', 'Birmingham', 'Alex',
    'Hawke', 'Christian', 'Porter', 'Richard', 'Colbeck', 'Coleman', 'Linda', 'Reynolds', 'Darren', 'Chester', 'Angus', 'Taylor', 'Stuart', 'Robert', 'JobKeeper', 'JobMaker', 'JobSeeker',
    'Melbourne', 'Sydney', 'Perth', 'Darwin', 'Adelaide', 'Brisbane', 'Hobart', 'Canberra', 'Coalition', 'Huawei', 'Premier', 'Dan', 'Tehan', 'Chinese']

chrome.commands.onCommand.addListener(function (command) {
    console.log(command)
    console.log(navigator)
    if (command === '1_paste') {
        chrome.storage.local.get({ decap: true }, function (result) {
            getHighlightedText(command, result.decap)
        })
    } else if (command === '2_abc') {
        chrome.storage.local.get({ decap: true }, function (result) {
            getHighlightedText(command, result.decap)
        })
    } else if (command === 'l_addLink') {
        executePaste(addLinks)
        return true
    } else if (command === 'z_mergeHotkey') {
        platformHotkey('merge')
    } else if (command === 'z_deleteHotkey') {
        platformHotkey('delete')
    } else if (command === 'l_openLinks') {
        openLinks()
    } else if (command === 'c1_saveID') {
        saveID()
    } else if (command === 'c_copyID') {
        copyID()
    } else if (command === 'c_deleteIDs') {
        deleteIDs()
    } else if (command === '3_changeCase') {
        changeCase()
    }  else if (command === '3_toSentenceCase') {
        changeToSentenceCase()
    }  else if (command === 'c2_pasteEntireField') {
        chrome.storage.local.get({ decap: true }, function (result) {
            getHighlightedText(command, result.decap)
        })
    } else if (command === 'c2_pasteWithContext') {
        chrome.storage.local.get({ decap: true }, function (result) {
            getHighlightedText(command, result.decap)
        })
    } else {
        console.log('Else')
        copy('', command)
    }
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request) return
    if (request.action === 'getBriefingCheck') {
        fetchFromServer(request.data).then(data => sendResponse({ briefingChecks: data }))
        return true
        // chrome.tabs.query({}, function () {
        //     sendResponse({ briefingChecks: fetchFromServer(request.data) })
        // })
    }
})


function getCopyCaps() {
    return new Promise(options => {
        chrome.storage.local.get({ copyCaps: defaultCopyCaps }, function (data) {
            options(data.copyCaps)
        })
    })
}
function getCopyPropers() {
    return new Promise(options => {
        chrome.storage.local.get({ copyPropers: defaultProperNouns }, function (data) {
            options(data.copyPropers)
        })
    })
}

function getTextFieldReplace() {
    return new Promise(options => {
        chrome.storage.local.get({ textFieldReplace: true }, function (data) {
            options(data.textFieldReplace)
        })
    })
}

// This sets the clipboard based on the key combination, cleaning it up in some cases, setting it to a commonly used term in others.
async function copy(str, setting, decap = true) {
    let properNouns = await getCopyPropers()
    let skipDecapping = await getCopyCaps()
    let textFieldReplaceOption = await getTextFieldReplace()
    // var sandbox
    // if (!doc.getElementById('sandbox')) {
    //     sandbox = doc.createElement('textarea')
    // } else sandbox = doc.getElementById('sandbox')
    if (setting === '1_paste') {
        let words = str.replace(/, pictured,|, pictured left,|, pictured right,/, '')
            .replace(/\(pictured\) |\(pictured left\) |\(pictured right\) /, '')
            .replace(/\n/g, ' ')
            .replace(/^ /, '')
            .replace(/ {2}/g, ' ')
            .split(' ')
        if (decap) {
            for (let i = 0; i < 3 && i < words.length; i++) {
                if (words[i + 1]) words[i] = decapWord(words[i], i, words[i + 1], properNouns, skipDecapping)
                else words[i] = decapWord(words[i], i)
            }
        }
        executeCopy(words.join(' '))
        if (textFieldReplaceOption) updateField(words.join(' '))
    } else if (setting === '2_abc') {
        let words = str.replace(/, pictured,|, pictured left,|, pictured right,/, '')
            .replace(/\(pictured\) |\(pictured left\) |\(pictured right\) /, '')
            .replace(/ Key points.*\n/, '\n')
            .replace(/\.Key points.*\n/, '.\n')
            .split('\n')
            .filter(x => x.length > 0 &&
                (x.endsWith('.') ||
                    x.endsWith('\'') ||
                    x.endsWith('!') ||
                    x.endsWith('?') ||
                    x.endsWith('\'')
                ))
            .filter(x => !/^Get breaking news as it happens/.test(x) && !/^Get latest news and live notifications with the ABC News app/.test(x) &&
            !/^Get the latest news and live notifications with the ABC News app/.test(x) && !/^Download App/.test(x) &&
            !/^Space to play or pause, M to mute/.test(x) && !/^Download the ABC News app for all the latest./.test(x))
            .map(x => x.startsWith('Download the ABC News app on the App Store ') ? x.replace('Download the ABC News app on the App Store ', '') : x)
            .join(' ').split(' ')
        if (decap) {
            for (let i = 0; i < 3 && i < words.length; i++) {
                if (words[i + 1]) words[i] = decapWord(words[i], i, words[i + 1], properNouns, skipDecapping)
                else words[i] = decapWord(words[i], i)
            }
        }
        executeCopy(words.join(' '))
        if (textFieldReplaceOption) updateField(words.join(' '))
    } else if (setting === 'copyIDs') {
        executeCopy(str)
    } else if (setting === 'copyStaticText' || setting === 'copyIndSyndNote') {
        console.log('Static text', str)
        executeCopy(str)
    } else {
        chrome.storage.local.get({ staticText: ['Similar coverage reported by: ', 'Also in other publications'] }, function (result) {
            console.log(result)
            console.log(setting)
            executeCopy(result.staticText[commandObj[setting]])
        })
    }
}

// This gets the highlighted text from the webpage.
function getHighlightedText(setting, decap) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getHighlightedText' }, function (response) {
            copy(response.copy, setting, decap, response.document)
        })
    })
}

function changeCase() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'changeCase' })
    })
}

function changeToSentenceCase() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'changeToSentenceCase' })
    })
}

function executeCopy(txt) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'executeCopy', text: txt })
    })
}

async function executePaste(fnc) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'executePaste', links: savedLinks })
    })
}

function addLinks(link) {
    savedLinks.push(link)
}

function platformHotkey(text) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: text })
    })
}

function updateField(data) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'setFieldValue', data: data })
    })
}

function decapWord(word, i, nextWord, properNouns, skipDecapping) {
    if (!word || word === '') return
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
    } else if (skipDecapping.indexOf(word.toUpperCase()) > -1) {
        return word.toUpperCase()
    } else if (properNouns.includes(toSentenceCase(word))) {
        return toSentenceCase(word)
    }
    return word
}

function openLinks() {
    executeCopy(savedLinks.join('\n').replace(' ', ''))
    console.log(savedLinks)
    for (let i = 0; i < savedLinks.length; i++) {
        chrome.tabs.create({ url: savedLinks[i], active: false })
    }
    savedLinks = []
}

function saveID() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getHighlightedText' }, function (response) {
            if (!isNaN(response.copy.replace('Item ID: ', '').substring(1))) {
                savedIDs.push(response.copy.replace('Item ID: ', ''))
            }
        })
    })
}

function copyID(sandbox) {
    sandbox.value = savedIDs.join('\n').replace(' ', '')
    executeCopy(savedIDs.join('\n').replace(' ', ''))
}

function deleteIDs() {
    savedIDs = []
}

const isCapitalised = (word) => word.toUpperCase() === word
const toSentenceCase = (word) => word.split('').map((letter, index) => {
    if (index === 0) {
        return letter.toUpperCase()
    } else return letter.toLowerCase()
}).join('')

chrome.runtime.onMessage.addListener(function(request) {
    console.log(request)
    if (!request) return
    if (request.action === 'createWindow' && request.url) {
        chrome.storage.local.set({ missingContent: request.missingItems, currentPortal: request.currentPortal }, function() {
            chrome.tabs.create({ url: request.url }, function () {
            })
        })

    } else if (request.action === 'plainTextEmail' && request.url) {
        chrome.storage.local.set({ briefingData: request.briefingData }, function() {
            chrome.tabs.create({ url: request.url }, function () {
            })
        })
    } else if (request.action === 'copyStaticText') {
        copy(request.text, request.action)
    }  else if (request.action === 'copyIndSyndNote') {
        copy(request.syndNotes, request.action)
    } else if (request.action === '1_paste' || request.action === '2_abc') {
        copy(request.copy, request.action)
    }
})

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request && request.action === 'logTabs') {
        chrome.tabs.query({}, function(foundTabs) {
            const MPTabs = foundTabs.filter(tab => tab.url.startsWith('https://app.mediaportal') && tab.incognito === request.incog)
            console.log(foundTabs)
            sendResponse({ tabs: MPTabs.length })
        })
    }
    return true
})



// ,
//     'browser_action': {
//         'default_icon': 'images/icon-48.png',
//         'default_popup': 'popup.html',
//         'default_title': 'MP Improvements'
//       },