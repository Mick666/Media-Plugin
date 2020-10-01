chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request)
    if (request && request.missingContent) {
        document.getElementById('missing').innerText = request.missingContent.join('\n')
    }
})
window.onload = function() {
    chrome.storage.local.get({ missingContent: [] }, function (data) {
        console.log(data)
        document.getElementById('missing').innerText = data.missingContent.join('\n')
    })
}