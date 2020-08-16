const defaultCheckCaps = ['PM', 'MP', 'ABC', 'ACT', 'NSW', 'NT', 'VIC', 'WA', 'SA', 'ANZ', 'NAB', 'ANU', 'COVID-19', 'BHP', 'ALP', 'LNP', 'TAFE', 'US', 
    'CSIRO', 'UK', 'TPG', 'CEO', 'COVID', 'COVID-19', 'PCYC', 'STEM', 'AGL', 'ANSTO', 'SBS', 'GST', 'AMP', 'SMS', 'ACIC', 'NDIS', 'RBA', 'NAPLAN', 'AFP', 'SES']
const defaultCheckProperNouns = ['British', 'Australian', 'Australia', 'Scott', 'Morrison', 'Daniel', 'Andrews', 'Victoria', 'Queensland', 'Tasmania', 
    'Annastacia', 'Palaszczuk', 'Gladys', 'Berejiklian', 'Mark', 'McGowan', 'Steven', 'Marshall', 'Peter', 'Gutwein', 'Andrew', 'Barr',
    'Michael', 'Gunner', 'Dutton', 'Alan', 'Tudge', 'Kevin', 'Rudd', 'Anthony', 'Albanese', 'Tanya', 'Plibersek', 'Brendan', "O'Connor",
    'Michaelia', 'Greg', 'Hunt', 'Marise', 'Payne', 'Ken', 'Wyatt', 'McCormack', 'ScoMo', 
    'Paul', 'Fletcher', 'Coulton', 'Gee', 'Buchholz', 'Hogan', 'Nola', 'Marino', 'Josh', 'Frydenberg', 'Sukkar', 'Hastie', 'Dave', 'Sharma', 'Jane', 'Hume', 
    'Mathias', 'Cormann', 'David', 'Littleproud', 'Sussan', 'Ley', 'Keith', 'Pitt', 'Trevor', 'Evans', 'Jonathon', 'Duniam', 'Simon', 'Birmingham', 'Alex', 
    'Hawke', 'Christian', 'Porter', 'Richard', 'Colbeck', 'Coleman', 'Linda', 'Reynolds', 'Darren', 'Chester', 'Angus', 'Taylor', 'Stuart', 'Robert', 'JobKeeper', 'JobMaker', 'JobSeeker',
    'Melbourne', 'Sydney', 'Perth', 'Darwin', 'Adelaide', 'Brisbane', 'Hobart', 'Canberra', 'Coalition', 'Huawei', 'Premier', 'Dan', 'Tehan', 'Chinese']
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

function getEventListenerOptions() {
    return new Promise(options => {
        chrome.storage.local.get({listenerOptions: [true, true, true]}, function(data){
            options(data.listenerOptions)
        })
    })
}
function getCheckingCaps() {
    return new Promise(options => {
        chrome.storage.local.get({checkingCaps: defaultCheckCaps}, function(data){
            options(data.checkingCaps)
        })
    })
}
function getCheckingPropers() {
    return new Promise(options => {
        chrome.storage.local.get({checkingPropers: defaultCheckProperNouns}, function(data){
            options(data.checkingPropers)
        })
    })
}
function getCopyCaps() {
    return new Promise(options => {
        chrome.storage.local.get({copyCaps: defaultCopyCaps}, function(data){
            options(data.copyCaps)
        })
    })
}
function getCopyPropers() {
    return new Promise(options => {
        chrome.storage.local.get({copyPropers: defaultProperNouns}, function(data){
            options(data.copyPropers)
        })
    })
}

async function loadTextFieldData() {
    let checkingCaps = await getCheckingCaps()
    let checkingPropers = await getCheckingPropers()
    let checkingCopyCaps = await getCopyCaps()
    let checkingCopyPropers = await getCopyPropers()
    document.getElementById('decapCaps').value = checkingCaps.join(', ').replace(/ {2,}/g, ' ')
    document.getElementById('decapPropers').value = checkingPropers.join(', ').replace(/ {2,}/g, ' ')
    document.getElementById('checkingCaps').value = checkingCopyCaps.join(', ').replace(/ {2,}/g, ' ')
    document.getElementById('checkingPropers').value = checkingCopyPropers.join(', ').replace(/ {2,}/g, ' ')
    let wordList = document.getElementsByClassName('wordlist')
    for (let i = 0; i < wordList.length; i++) {
        wordList[i].rows = 25
        wordList[i].cols = 75
    }
}

window.addEventListener('load', async () => {
    document.getElementById('options').style.display = 'block'
    let listenerOptions = await getEventListenerOptions()
    let optionCheckboxes = document.getElementsByClassName('listenerOptions')
    for (let i = 0; i < optionCheckboxes.length; i++) {
        optionCheckboxes[i].children[0].checked = listenerOptions[i]
    }

    chrome.storage.local.get({readmoreScroll: true}, function(data){
        document.getElementById('readmore').children[0].checked = data.readmoreScroll
    })

    chrome.storage.local.get({decap: true}, function(data){
        document.getElementById('decap').children[0].checked = data.decap
    })
    loadTextFieldData()
})

document.getElementById('hotkey').onclick = event => {
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'})
    event.preventDefault()
}
document.getElementById('switch').addEventListener('change', async function(e) {
    let eventListenerOptions = await getEventListenerOptions()
    eventListenerOptions[0] = e.target.checked
    chrome.storage.local.set({listenerOptions: eventListenerOptions}, function() {
    })
})

document.getElementById('automated').addEventListener('change', async function(e) {
    let eventListenerOptions = await getEventListenerOptions()
    eventListenerOptions[1] = e.target.checked
    chrome.storage.local.set({listenerOptions: eventListenerOptions}, function() {
    })
})

document.getElementById('repeated').addEventListener('change', async function(e) {
    let eventListenerOptions = await getEventListenerOptions()
    eventListenerOptions[2] = e.target.checked
    chrome.storage.local.set({listenerOptions: eventListenerOptions}, function() {
    })
})

document.getElementById('readmore').addEventListener('change', function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({readmoreScroll: true}, function() {
        })
    } else {
        chrome.storage.local.set({readmoreScroll: false}, function() {
        })
    }
})

document.getElementById('decap').addEventListener('change', function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({decap: true}, function() {
        })
    } else {
        chrome.storage.local.set({decap: false}, function() {
        })
    }
})
const itemGrid = document.getElementsByClassName('itemGrid')

// chrome.storage.local.get(['staticText'], function(result) {
//     console.log(result.staticText)
// })
function createOption(hotkey, description, name) {
    let shortcut = document.createElement('p')
    shortcut.innerHTML = hotkey
    if (hotkey == '') shortcut.innerHTML = 'Not bound'
    let desc = document.createElement('p')
    desc.innerHTML = description
    let comm = document.createElement('p')
    comm.innerHTML = name
    itemGrid[0].appendChild(comm)
    itemGrid[1].appendChild(shortcut)
    itemGrid[2].appendChild(desc)
}
chrome.commands.getAll(function(commands) {
    commands.map((command)=> {
        if (command.name === '1_paste') {
            createOption(command.shortcut, 'Removes linebreaks from copied text', 'Linebreak copy')
        } else if (command.name === '2_abc') {
            createOption(command.shortcut, 'Ignores ABC\'s Key Points when copying text', 'ABC copy')
        } else if (command.name ==='highlightBroadcast') {
            createOption(command.shortcut, 'Highlights broadcast items which need a word recapitalised', 'Broadcast higlighter')
        } else if (command.name ==='highlightPreviewWords') {
            createOption(command.shortcut, 'Highlight possible mistakes in checking', 'Checking highlighter')
        } else if (command.name ==='copyIDs') {
            createOption(command.shortcut, 'Copy all visible IDs', 'All visible IDs copier')
        } else if (command.name ==='addLink') {
            createOption(command.shortcut, 'Saves a link for later use', 'Link saver')
        } else if (command.name ==='openLinks') {
            createOption(command.shortcut, 'Opens all the saved links & copies them to the clipboard', 'Link opener')
        } else if (command.name ==='saveID') {
            createOption(command.shortcut, 'Saves a highlighted ID for later use', 'Individual ID saver')
        } else if (command.name ==='copyID') {
            createOption(command.shortcut, 'Copies all saved IDs to your clipboard', 'Individual ID copier')
        } else if (command.name ==='deleteIDs') {
            createOption(command.shortcut, 'Deletes all saved IDs', 'ID deleter')
        }
        else if (command.name === '_execute_browser_action') {
        } else if (command.name.startsWith('static-text') || command.name === 't_static-text-10') {
            let shortcut = document.createElement('p')
            shortcut.innerHTML = command.shortcut
            if (shortcut.innerHTML === '') shortcut.innerHTML = 'Not bound'
            let desc = document.createElement('p')
            desc.innerHTML = command.description
            itemGrid[4].appendChild(shortcut)
            itemGrid[3].appendChild(desc)
        } else {
            let shortcut = document.createElement('p')
            shortcut.innerHTML = command.shortcut
            if (shortcut.innerHTML === '') shortcut.innerHTML = 'Not bound'
            let desc = document.createElement('p')
            desc.innerHTML = command.description
            itemGrid[1].appendChild(shortcut)
            itemGrid[0].appendChild(desc)
        }
    })
})
// Click here to access PDF version of print articles
// Click here to access text version of print articles
// Click here to access combined PDF report of today's front pages
// Click here to access all print articles
// Click here to view all print articles
// Michael.Martino@isentia.com
// The Minister for Trade, Tourism and Investment is also mentioned in 'X' in the Minister for Foreign Affairs section
// The Department of Foreign Affairs and Trade is also mentioned in 'X' in the Minister for Foreign Affairs section

chrome.storage.local.get({staticText: ['Similar coverage reported by: ', 'Also in other publications']}, function(data){
    for (let i = 0; i < 10; i++) {
        let setting = document.createElement('textarea')
        setting.value = data.staticText[i] || ''
        setting.className = 'staticText'
        // console.log(setting)
        itemGrid[5].appendChild(setting)
    }
})
document.getElementById('save').addEventListener('click', saveOptions)

function saveOptions(e) {
    e.target.innerText = 'Saved!'
    setTimeout(function(){ e.target.innerText = 'Save' }, 5000)
    const optionsHTML = document.getElementsByClassName('staticText')
    let options = []
    for (let i = 0; i < optionsHTML.length; i++) {
        options.push(optionsHTML[i].value)
    }
    let decapCapsValues = document.getElementById('decapCaps').value.replace(/, {1,}/g, ',').split(',')
    let decapPropersValues = document.getElementById('decapPropers').value.replace(/, {1,}/g, ',').split(',')
    let checkingCopyCapsValues = document.getElementById('checkingCaps').value.replace(/, {1,}/g, ',').split(',')
    let checkingCopyPropersValues = document.getElementById('checkingPropers').value.replace(/, {1,}/g, ',').split(',')
    chrome.storage.local.set({staticText: options}, function() {
    })
    chrome.storage.local.set({checkingCaps: checkingCopyCapsValues}, function() {
    })
    chrome.storage.local.set({checkingPropers: checkingCopyPropersValues}, function() {
    })
    chrome.storage.local.set({copyCaps: decapCapsValues}, function() {
    })
    chrome.storage.local.set({copyPropers: decapPropersValues}, function() {
    })
}

const tabLinks = document.getElementsByClassName('tablinks')
for (let i = 0; i < tabLinks.length; i++) {
    tabLinks[i].addEventListener('mousedown', openTab)
}

function openTab(evt) {
    if (!evt) return
    let tabID = document.getElementById(evt.target.id)
    // Declare all variables
    var i, tabcontent, tablinks

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName('tabcontent')
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none'
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName('tablinks')
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '')
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabID.dataset.key).style.display = 'block'
    evt.currentTarget.className += ' active'
}