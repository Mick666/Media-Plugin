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
const itemGrid = document.getElementsByClassName("itemGrid")

// chrome.storage.local.get(['staticText'], function(result) {
//     console.log(result.staticText)
// })

chrome.commands.getAll(function(commands) {
    commands.map((command)=> {
        if (command.name === "1_paste") {
            let shortcut = document.createElement("p")
            shortcut.innerHTML = command.shortcut;
            let desc = document.createElement("p");
            desc.innerHTML = "Removes linebreaks from copied text"
            let comm = document.createElement("p")
            comm.innerHTML = "Linebreak copy"
            itemGrid[0].appendChild(comm)
            itemGrid[1].appendChild(shortcut)
            itemGrid[2].appendChild(desc)
        } else if (command.name === "2_abc") {
            let shortcut = document.createElement("p")
            shortcut.innerHTML = command.shortcut;
            let desc = document.createElement("p");
            desc.innerHTML = "Ignores ABC's Key Points when copying text"
            let comm = document.createElement("p")
            comm.innerHTML = "ABC copy"
            itemGrid[0].appendChild(comm)
            itemGrid[1].appendChild(shortcut)
            itemGrid[2].appendChild(desc)
        } else {
            let shortcut = document.createElement("p")
            shortcut.innerHTML = command.shortcut;
            let desc = document.createElement("p")
            desc.innerHTML = command.description
            itemGrid[1].appendChild(shortcut)
            itemGrid[0].appendChild(desc)
        }
    })
})

chrome.storage.local.get({staticText: ["Similar coverage reported by: ", "Also in other publications"]}, function(data){
    for (let i = 0; i < 5; i++) {
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