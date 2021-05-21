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
let coverageOptions = { contactLinks: true, automatedBroadcast: true, repeatedItems: true, largerAddToFolder: true, outletsToIgnore: true }

function getCoveragePageOptions() {
    return new Promise(options => {
        chrome.storage.local.get({ coverageOptions: coverageOptions }, function(data){
            options(data.coverageOptions)
        })
    })
}

function getCopyCaps() {
    return new Promise(options => {
        chrome.storage.local.get({ copyCaps: defaultCopyCaps }, function(data){
            options(data.copyCaps)
        })
    })
}
function getCopyPropers() {
    return new Promise(options => {
        chrome.storage.local.get({ copyPropers: defaultProperNouns }, function(data){
            options(data.copyPropers)
        })
    })
}

async function loadTextFieldData() {
    let checkingCopyCaps = await getCopyCaps()
    let checkingCopyPropers = await getCopyPropers()
    document.getElementById('decapCaps').value = checkingCopyCaps.join(', ').replace(/ {2,}/g, ' ')
    document.getElementById('decapPropers').value = checkingCopyPropers.join(', ').replace(/ {2,}/g, ' ')
    let wordList = document.getElementsByClassName('wordlist')
    for (let i = 0; i < wordList.length; i++) {
        wordList[i].rows = 25
        wordList[i].cols = 108
    }
}

window.addEventListener('load', async () => {
    let listenerOptions = await getCoveragePageOptions()
    document.getElementById('outlet-links').children[0].checked = listenerOptions.contactLinks
    document.getElementById('automated').children[0].checked = listenerOptions.automatedBroadcast
    document.getElementById('repeated').children[0].checked = listenerOptions.repeatedItems
    document.getElementById('outletsToIgnore').children[0].checked = listenerOptions.outletsToIgnore
    document.getElementById('largerAddToFolder').children[0].checked = listenerOptions.largerAddToFolder

    chrome.storage.local.get({ heroSentenceOption: true }, function(data){
        document.getElementById('heroSentence').children[0].checked = data.heroSentenceOption
    })

    chrome.storage.local.get({ readmoreScroll: true }, function(data){
        document.getElementById('readmore').children[0].checked = data.readmoreScroll
    })

    chrome.storage.local.get({ decap: true }, function(data){
        document.getElementById('decap').children[0].checked = data.decap
    })

    chrome.storage.local.get({ textFieldReplace: true }, function(data){
        document.getElementById('textBoxReplace').children[0].checked = data.textFieldReplace
    })

    chrome.storage.local.get({ autoHighlight: true }, function(data){
        document.getElementById('autoHighlight').children[0].checked = data.autoHighlight
    })

    chrome.storage.local.get({ readMoreCopy: true }, function(data){
        document.getElementById('readMoreCopy').children[0].checked = data.readMoreCopy
    })

    loadTextFieldData()
})


document.getElementById('hotkey').onclick = event => {
    chrome.tabs.create({ url: 'chrome://extensions/configureCommands' })
    event.preventDefault()
}

document.getElementById('heroSentence').addEventListener('change', async function(e) {
    chrome.storage.local.set({ heroSentenceOption: e.target.checked }, function() {
    })
})

document.getElementById('outlet-links').addEventListener('change', async function(e) {
    let eventListenerOptions = await getCoveragePageOptions()
    eventListenerOptions.contactLinks = e.target.checked
    chrome.storage.local.set({ coverageOptions: eventListenerOptions }, function() {
    })
})

document.getElementById('automated').addEventListener('change', async function(e) {
    let eventListenerOptions = await getCoveragePageOptions()
    eventListenerOptions.automatedBroadcast = e.target.checked
    chrome.storage.local.set({ coverageOptions: eventListenerOptions }, function() {
    })
})

document.getElementById('repeated').addEventListener('change', async function(e) {
    let eventListenerOptions = await getCoveragePageOptions()
    eventListenerOptions.repeatedItems = e.target.checked
    chrome.storage.local.set({ coverageOptions: eventListenerOptions }, function() {
    })
})

document.getElementById('outletsToIgnore').addEventListener('change', async function(e) {
    let eventListenerOptions = await getCoveragePageOptions()
    eventListenerOptions.outletsToIgnore = e.target.checked
    chrome.storage.local.set({ coverageOptions: eventListenerOptions }, function() {
    })
})

document.getElementById('largerAddToFolder').addEventListener('change', async function(e) {
    let eventListenerOptions = await getCoveragePageOptions()
    eventListenerOptions.largerAddToFolder = e.target.checked
    chrome.storage.local.set({ coverageOptions: eventListenerOptions }, function() {
    })
})

document.getElementById('readmore').addEventListener('change', function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({ readmoreScroll: true }, function() {
        })
    } else {
        chrome.storage.local.set({ readmoreScroll: false }, function() {
        })
    }
})

document.getElementById('decap').addEventListener('change', function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({ decap: true }, function() {
        })
    } else {
        chrome.storage.local.set({ decap: false }, function() {
        })
    }
})

document.getElementById('textBoxReplace').addEventListener('change', function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({ textFieldReplace: true }, function() {
        })
    } else {
        chrome.storage.local.set({ textFieldReplace: false }, function() {
        })
    }
})

document.getElementById('autoHighlight').addEventListener('change', function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({ autoHighlight: true }, function() {
        })
    } else {
        chrome.storage.local.set({ autoHighlight: false }, function() {
        })
    }
})

document.getElementById('readMoreCopy').addEventListener('change', function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({ readMoreCopy: true }, function() {
        })
    } else {
        chrome.storage.local.set({ readMoreCopy: false }, function() {
        })
    }
})

const itemGrid = document.getElementsByClassName('itemGrid')
const hotkeyGrid = document.getElementById('parentGrid')

// chrome.storage.local.get(['staticText'], function(result) {
//     console.log(result.staticText)
// })
function createOption(hotkey, description, name) {
    let shortcut = document.createElement('p')
    shortcut.innerHTML = hotkey
    if (hotkey === '') shortcut.innerHTML = 'Not bound'
    let desc = document.createElement('p')
    desc.innerHTML = description
    let comm = document.createElement('p')
    comm.innerHTML = name
    hotkeyGrid.appendChild(comm)
    hotkeyGrid.appendChild(shortcut)
    hotkeyGrid.appendChild(desc)
}
chrome.commands.getAll(function(commands) {
    commands.map((command) => {
        if (command.name === '1_paste') {
            createOption(command.shortcut, 'Removes linebreaks from copied text', 'Linebreak copy')
        } else if (command.name === '2_abc') {
            createOption(command.shortcut, 'Ignores ABC\'s Key Points/subheadings when copying text', 'ABC copy')
        } else if (command.name === '3_changeCase') {
            createOption(command.shortcut, 'Changes the case of highlighted text', 'Case change')
        } else if (command.name ==='5_highlightPreviewWords') {
            createOption(command.shortcut, 'Highlight possible mistakes in checking', 'Checking highlighter')
        } else if (command.name ==='l_addLink') {
            createOption(command.shortcut, 'Saves a link for later use', 'Link saver')
        } else if (command.name ==='l_openLinks') {
            createOption(command.shortcut, 'Opens all the saved links & copies them to the clipboard', 'Link opener')
        } else if (command.name ==='c1_saveID') {
            createOption(command.shortcut, 'Saves a highlighted ID for later use', 'Individual ID saver')
        } else if (command.name ==='c_copyID') {
            createOption(command.shortcut, 'Copies all saved IDs to your clipboard', 'Individual ID copier')
        } else if (command.name ==='c_deleteIDs') {
            createOption(command.shortcut, 'Deletes all saved IDs', 'Individual ID deleter')
        } else if (command.name ==='3_toSentenceCase') {
            createOption(command.shortcut, 'Changes highlighted text to Sentence Case', 'Case change to Sentence case')
        } else if (command.name ==='z_mergeHotkey') {
            createOption(command.shortcut, 'Merges selected items', 'Merge hotkey')
        } else if (command.name ==='z_deleteHotkey') {
            createOption(command.shortcut, 'Deletes selected items (DB platform only)', 'Delete hotkey')
        } else if (command.name.startsWith('static-text') || command.name === 't_static-text-10') {
            let shortcut = document.createElement('p')
            shortcut.innerHTML = command.shortcut
            if (shortcut.innerHTML === '') shortcut.innerHTML = 'Not bound'
            let desc = document.createElement('p')
            desc.innerHTML = command.description.replace('Static', 'Preset')
            itemGrid[1].appendChild(shortcut)
            itemGrid[0].appendChild(desc)
        } else if (command.name !== '_execute_browser_action'){
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

chrome.storage.local.get({ staticText: ['Similar coverage reported by: ', 'Also in other publications'] }, function(data){
    for (let i = 0; i < 10; i++) {
        let setting = document.createElement('textarea')
        setting.value = data.staticText[i] || ''
        setting.className = 'staticText'
        itemGrid[2].appendChild(setting)
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
    chrome.storage.local.set({ staticText: options }, function() {
    })
    chrome.storage.local.set({ copyCaps: decapCapsValues }, function() {
    })
    chrome.storage.local.set({ copyPropers: decapPropersValues }, function() {
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