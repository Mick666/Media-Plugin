function getEventListenerOptions() {
    return new Promise(options => {
        chrome.storage.local.get({listenerOptions: [true, true, true]}, function(data){
            options(data.listenerOptions)
        })
    })
}

window.addEventListener('load', async () => {
    let listenerOptions = await getEventListenerOptions()
    let optionCheckboxes = document.getElementsByClassName('listenerOptions')
    for (let i = 0; i < optionCheckboxes.length; i++) {
        optionCheckboxes[i].children[0].checked = listenerOptions[i]
        console.log(optionCheckboxes[i].children[0].checked)
    }

    chrome.storage.local.get({readmoreScroll: true}, function(data){
        document.getElementById('readmore').children[0].checked = data.readmoreScroll
    })

    chrome.storage.local.get({decap: true}, function(data){
        console.log(document.getElementById('decap').children[0])
        console.log(data.decap)
        document.getElementById('decap').children[0].checked = data.decap
    })
})

document.getElementById('hotkey').onclick = event => {
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'})
    event.preventDefault()
}
document.getElementById('switch').addEventListener('change', async function(e) {
    let eventListenerOptions = await getEventListenerOptions()
    eventListenerOptions[0] = e.target.checked
    console.log(eventListenerOptions)
    chrome.storage.local.set({listenerOptions: eventListenerOptions}, function() {
    })
})

document.getElementById('automated').addEventListener('change', async function(e) {
    let eventListenerOptions = await getEventListenerOptions()
    eventListenerOptions[1] = e.target.checked
    console.log(eventListenerOptions)
    chrome.storage.local.set({listenerOptions: eventListenerOptions}, function() {
    })
})

document.getElementById('repeated').addEventListener('change', async function(e) {
    let eventListenerOptions = await getEventListenerOptions()
    eventListenerOptions[2] = e.target.checked
    console.log(eventListenerOptions)
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
    chrome.storage.local.set({staticText: options}, function() {
        console.log(options)
    })
}