document.getElementById('hotkey').onclick = event => {
    chrome.tabs.create({url: 'chrome://extensions/configureCommands'});
    event.preventDefault();
};
document.getElementById('switch').addEventListener("change", function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({disableLinks: true}, function() {
        })
    } else {
        chrome.storage.local.set({disableLinks: false}, function() {
        })
    }
});

document.getElementById('decap').addEventListener("change", function(e) {
    if (e.target.checked) {
        chrome.storage.local.set({decap: true}, function() {
        })
    } else {
        chrome.storage.local.set({decap: false}, function() {
        })
    }
});
const itemGrid = document.getElementsByClassName("itemGrid")

// chrome.storage.local.get(['staticText'], function(result) {
//     console.log(result.staticText)
// })
function createOption(hotkey, description, name) {
    let shortcut = document.createElement("p")
    shortcut.innerHTML = hotkey;
    let desc = document.createElement("p");
    desc.innerHTML = description
    let comm = document.createElement("p")
    comm.innerHTML = name
    itemGrid[0].appendChild(comm)
    itemGrid[1].appendChild(shortcut)
    itemGrid[2].appendChild(desc)
}
chrome.commands.getAll(function(commands) {
    console.log(commands)
    commands.map((command)=> {
        if (command.name === "1_paste") {
            createOption(command.shortcut, "Removes linebreaks from copied text", "Linebreak copy")
        } else if (command.name === "2_abc") {
            createOption(command.shortcut, "Ignores ABC's Key Points when copying text", "ABC copy")
        } else if (command.name ==="highlightBroadcast") {
            createOption(command.shortcut, "Highlights broadcast items which need a word recapitalised", "Broadcast higlighter")
        } else if (command.name ==="highlightPreviewWords") {
            createOption(command.shortcut, "Highlight possible mistakes in checking", "Checking highlighter")
        }
        else if (command.name === "_execute_browser_action") {
        } else {
            let shortcut = document.createElement("p")
            shortcut.innerHTML = command.shortcut;
            if (shortcut.innerHTML === "") shortcut.innerHTML = "Not bound"
            let desc = document.createElement("p")
            desc.innerHTML = command.description
            itemGrid[1].appendChild(shortcut)
            itemGrid[0].appendChild(desc)
        }
    })
})
// ["Similar coverage reported by: ", "Also in other publications"]
// ["Similar coverage reported by: ", "Also in other publications", "Click here to access PDF version of print articles", "Click here to access text version of print articles", "Click here to access combined PDF report of today's front pages", "Click here to access all print articles", "Click here to view all print articles", "Michael.Martino@isentia.com", 
// "The Minister for Trade, Tourism and Investment is also mentioned in "X" in the Minister for Foreign Affairs section", "The Department of Foreign Affairs and Trade is also mentioned in \"X\" in the Minister for Foreign Affairs section"]

chrome.storage.local.get({staticText: ["Similar coverage reported by: ", "Also in other publications"]}, function(data){
    for (let i = 0; i < 10; i++) {
        let setting = document.createElement("textarea");
        setting.value = data.staticText[i] || ""
        setting.className = "staticText"
        // console.log(setting)
        itemGrid[2].appendChild(setting)
    }
});
document.getElementById('save').addEventListener('click',
    saveOptions);

function saveOptions() {
    const optionsHTML = document.getElementsByClassName("staticText");
    let options = [];
    for (let i = 0; i < optionsHTML.length; i++) {
        options.push(optionsHTML[i].value)
    }
    chrome.storage.local.set({staticText: options}, function() {
        console.log(options);
      });
}