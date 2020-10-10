const defaultCheckCaps = ['PM', 'MP', 'ABC', 'ACT', 'NSW', 'NT', 'VIC', 'QLD', 'WA', 'SA', 'ANZ', 'NAB', 'ANU', 'COVID-19', 'BHP', 'ALP', 'LNP', 'TAFE', 'US', 'CSIRO', 'UK', 'TPG', 'CEO',
    'COVID', 'COVID-19', 'PCYC', 'STEM', 'AGL', 'ANSTO', 'SBS', 'GST', 'AMP', 'SMS', 'ACIC', 'NDIS', 'RBA', 'NAPLAN', 'AFP', 'SES', 'UN', 'PNG', 'AFMA', 'ABF', 'ASIC', 'ASIO', 'CBD', 'CCTV', 'HSC', 'HECS']
const defaultCheckProperNouns = ['British', 'Australian', 'Australia', 'Scott', 'Morrison', 'Daniel', 'Andrews', 'Victoria', 'Queensland', 'Tasmania',
    'Annastacia', 'Palaszczuk', 'Gladys', 'Berejiklian', 'Mark', 'McGowan', 'Steven', 'Marshall', 'Peter', 'Gutwein', 'Andrew', 'Barr',
    'Michael', 'Gunner', 'Dutton', 'Alan', 'Tudge', 'Kevin', 'Rudd', 'Anthony', 'Albanese', 'Tanya', 'Plibersek', 'Brendan', 'O\'Connor',
    'Michaelia', 'Greg', 'Hunt', 'Marise', 'Payne', 'Ken', 'Wyatt', 'McCormack', 'ScoMo',
    'Paul', 'Fletcher', 'Coulton', 'Gee', 'Buchholz', 'Hogan', 'Nola', 'Marino', 'Josh', 'Frydenberg', 'Sukkar', 'Hastie', 'Dave', 'Sharma', 'Jane', 'Hume',
    'Mathias', 'Cormann', 'David', 'Littleproud', 'Sussan', 'Ley', 'Keith', 'Pitt', 'Trevor', 'Evans', 'Jonathon', 'Duniam', 'Simon', 'Birmingham', 'Alex',
    'Hawke', 'Christian', 'Porter', 'Richard', 'Colbeck', 'Coleman', 'Linda', 'Reynolds', 'Darren', 'Chester', 'Angus', 'Taylor', 'Stuart', 'Robert', 'JobKeeper', 'JobMaker', 'JobSeeker',
    'Melbourne', 'Sydney', 'Perth', 'Darwin', 'Adelaide', 'Brisbane', 'Hobart', 'Canberra', 'Coalition', 'Huawei', 'Premier', 'Dan', 'Tehan', 'Chinese']
let seenIDs = []
let listenerOptions = [true, true, true]
let checkingHasRun = false
let lastHighlightedElement = null
let reclipObj = {}
let currentPortal = null
let lastAddedContent = []

window.onload = async function () {
    let lastReset = await getLastContentReset()
    console.log(`Tracked items last reset at: ${lastReset}`)
    let currentDate = new Date()
    let timeDif = (currentDate.getTime() - new Date(lastReset).getTime()) / 1000 / 3600
    if (timeDif > 15) {
        chrome.storage.local.set({ contentReset: currentDate.toString() }, function() {
        })
        chrome.storage.local.set({ archivedContent: {} }, function() {
        })
    }

    if (window.location.href.toString().startsWith('https://app.mediaportal.com/')) currentPortal = await getCurrentPortal()
    console.log(currentPortal)

    if (document.getElementsByClassName('coverage-jump-trigger ng-binding').length > 0) {
        document.title = document.getElementsByClassName('coverage-jump-trigger ng-binding')[0].innerText.trimEnd()
        if (document.getElementsByClassName('sorting dropdown').length > 0) {
            addHeadlineSortOptions()
        }
    } else if (window.location.href === 'https://app.mediaportal.com/dailybriefings/#/briefings') {
        document.title = 'DB Platform'
    } else if (window.location.href === 'https://app.mediaportal.com/#/monitor/media-coverage') {
        document.title = 'Mediaportal Coverage'
        setTimeout(makeNumbersAccurate, 2000)
    } else if (window.location.href === 'https://app.mediaportal.com/#/report-builder/view') {
        document.title = 'Report Builder'
        if (document.getElementsByClassName('dropdown-display').length > 0 && document.getElementsByClassName('dropdown-display')[0].innerText === ' Excel') createRPButton()
        else {
            setTimeout((() => {
                if (document.getElementsByClassName('dropdown-display').length > 0 && document.getElementsByClassName('dropdown-display')[0].innerText === ' Excel') createRPButton()
            }), 500)
        }
    } else if (window.location.href.toString().startsWith('https://briefing-api.mediaportal.com/api/download')) {
        const highlightOption = await getAutoHighlightOption()
        if (highlightOption) setTimeout(checkingHighlights, 1000)
    } else if (window.location.href.toString().startsWith('https://app.mediaportal.com/dailybriefings/#/report')) {
        if (document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset').length === 0) {
            setTimeout(createDBPlatformButtons, 2000)
        } else {
            createDBPlatformButtons()
            if (document.getElementsByClassName('mat-slide-toggle-label').length > 0) document.getElementsByClassName('mat-slide-toggle-label')[0].addEventListener('mousedown', improveAccessibiltyOptions)
            else setTimeout(() => document.getElementsByClassName('mat-slide-toggle-label')[0].addEventListener('mousedown', improveAccessibiltyOptions), 500)
        }
    }
}

document.addEventListener('mousedown', async function (e) {
    if (e.button !== 0 || e.ctrlKey || !e.target) return

    if (((e.target.className && e.target.className === 'coverage-anchor') ||
        (e.target.parentElement && (e.target.parentElement.className === 'coverage-anchor' || e.target.parentElement.className === 'item-primary-panel')) ||
        (e.target.parentElement && e.target.parentElement.parentElement && e.target.parentElement.parentElement.className === 'item-primary-panel'))
        && / Brief| Folder/.test(e.target.parentElement.outerText) ||
        e.target.parentElement && (e.target.parentElement.className === 'item-unread-count' || e.target.parentElement.parentElement.className === 'item-unread-count')) {

        if (e.target.nodeName === 'DIV') document.title = e.target.parentElement.children[1].outerText.trimEnd()
        else if (e.target.nodeName === 'A' && e.target.children[1]) document.title = e.target.children[1].innerText
        else if (e.target.nodeName === 'SPAN' && (e.target.className === 'unread ng-scope' || e.target.className === 'item-type ng-binding')) document.title = e.target.parentElement.parentElement.parentElement.children[1].innerText
        else document.title = e.target.outerText.trimEnd()

        setTimeout(function () {
            if (document.getElementsByClassName('sorting dropdown').length > 0) {
                addHeadlineSortOptions()
            }
        }, 2000)
    } else if (e.target.nodeName === 'SPAN' && e.target.outerText === ' BACK' || e.target.nodeName === 'A' && e.target.outerText === ' Coverage' ||
            e.target.href === 'https://app.mediaportal.com/#/monitor/media-coverage' || (e.target.parentElement && e.target.parentElement.href === 'https://app.mediaportal.com/#/monitor/media-coverage')) {
        document.addEventListener('scroll', func)
        document.title = 'Mediaportal Coverage'
        seenIDs = []
        let setting = await getNumberFix()
        if (setting) setTimeout(waitForMP, 1000)
    } else if (e.target.href === 'https://app.mediaportal.com/#/report-builder/view' || (e.target.parentElement && e.target.parentElement.href === 'https://app.mediaportal.com/#/report-builder/view')) {
        document.removeEventListener('scroll', func)
        document.title = 'Report Builder'
        setTimeout(() => {
            if (document.getElementsByClassName('dropdown-display').length > 0 && document.getElementsByClassName('dropdown-display')[0].innerText === ' Excel') {
                createRPButton()
            } else {
                console.log(document.getElementsByClassName('dropdown-display'))
            }
        }, 2000)
    } else if (e.target.id === 'btnLogin') {
        let lastReset = await getLastContentReset()
        let currentDate = new Date()
        console.log(lastReset, currentDate)
        let timeDif = (currentDate.getTime() - new Date(lastReset).getTime()) / 1000 / 3600
        if (timeDif > 15) {
            chrome.storage.local.set({ contentReset: currentDate.toString() }, function() {
            })
            chrome.storage.local.set({ archivedContent: {} }, function() {
            })
        }
        if (chrome.extension.inIncognitoContext) {
            chrome.storage.local.set({ currentPortalIncog: document.getElementById('txtUsername').value.toLowerCase() }, function() {
            })
        } else {
            chrome.storage.local.set({ currentPortalRegular: document.getElementById('txtUsername').value.toLowerCase() }, function() {
            })
        }
    }  else if (e.target.parentElement && e.target.parentElement.className === 'modal-footer ng-scope' && e.target.innerText === 'Add') {
        archiveSelectedContent()
    } else if (e.target.parentElement && e.target.parentElement.className === 'modal-footer ng-scope' && e.target.innerText === 'Remove') {
        removeArchivedContent()
    } else if (window.location.href.toString() === 'https://app.mediaportal.com/#/report-builder/view' && document.getElementsByClassName('dropdown-display').length > 0
        && e.target.parentElement && e.target.parentElement.parentElement === document.getElementsByClassName('dropdown-list')[0].firstElementChild.children[4]) {
        setTimeout(createRPButton, 500)
    }

    if (e.target.className === 'ng-binding ng-scope' && (e.target.innerText === 'APPLY' || e.target.parentElement.className === 'md-button ng-scope md-ink-ripple')) {
        let setting = await getNumberFix()
        if (setting) setTimeout(waitForMP, 1000)
    }

    if (e.target.className === 'mp-icon fas fa-play' || (e.target.className === 'mat-button-wrapper' && e.target.firstElementChild && e.target.firstElementChild.className === 'mp-icon fas fa-play')) {
        setTimeout(createDBPlatformButtons, 1000)
        setTimeout(() => document.getElementsByClassName('mat-slide-toggle-label')[0].addEventListener('mousedown', improveAccessibiltyOptions), 1000)
    }


})

function waitForMP() {
    if (document.getElementsByClassName('lzy-header ng-scope').length > 0){
        console.log('running loop...')
        setTimeout(waitForMP, 1000)
        return
    }
    makeNumbersAccurate()
}

if (window.location.href.toString() === 'https://www.mediaportal.com/' || window.location.href.toString() === 'https://www.mediaportal.com' || window.location.href.toString().startsWith('https://www.mediaportal.com/login.aspx')) {
    document.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            let lastReset = await getLastContentReset()
            let currentDate = new Date()
            let timeDif = (currentDate.getTime() - new Date(lastReset).getTime()) / 1000 / 3600
            if (timeDif > 15) {
                chrome.storage.local.set({ contentReset: currentDate.toString() }, function() {
                })
                chrome.storage.local.set({ archivedContent: {} }, function() {
                })
            }
            if (chrome.extension.inIncognitoContext) {
                chrome.storage.local.set({ currentPortalIncog: document.getElementById('txtUsername').value.toLowerCase() }, function() {
                })
            } else {
                chrome.storage.local.set({ currentPortalRegular: document.getElementById('txtUsername').value.toLowerCase() }, function() {
                })
            }
        }
    })
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'getHighlightedText') {
            sendResponse({ copy: window.getSelection().toString() })
            lastHighlightedElement = document.getSelection().baseNode
        } else if (request.action === 'highlight') {
            highlightBroadcastItems()
            getPossibleSyndications()
        } else if (request.action === 'checkingWords' && !checkingHasRun) {
            checkingHasRun = true
            checkingHighlights()
        } else if (request.action === 'copyIDs') {
            let IDs = getAllIDs()
            sendResponse({ copy: IDs })
        } else if (request.action === 'changeCase') {
            changeCase()
        } else if (request.action === 'changeToSentenceCase') {
            changeToSentenceCase()
        } else if (request.action === 'setFieldValue') {
            setFieldValue(request.data)
        } else if (request.action === 'fixPressSyndications') {
            fixPressSyndications()
        }
    }
)

function addHeadlineSortOptions() {
    document.getElementsByClassName('sorting dropdown')[0].children[1].appendChild(createDivider())
    document.getElementsByClassName('sorting dropdown')[0].children[1].appendChild(createNewListItem('Asc'))
    document.getElementsByClassName('sorting dropdown')[0].children[1].appendChild(createNewListItem('Desc'))
}
function createDivider() {
    let newList = document.createElement('li')
    newList.className = 'divider'
    return newList
}

function createNewListItem(direction) {
    let newListItem = document.createElement('li')
    newListItem.className = 'ng-scope'
    let newLink = document.createElement('a')
    newLink.className = 'ng-pristine ng-untouched ng-valid ng-binding ng-not-empty'
    newLink.innerText = `PLUGIN: Headline (${direction})`
    newLink.addEventListener('click', () => sortItems(direction))

    newListItem.appendChild(newLink)
    return newListItem
}
function sortItems(direction) {
    let groups = document.getElementsByClassName('folder-details-wrap ng-scope')
    for (let i = 0; i < groups.length; i++) {
        let parent = groups[i].firstElementChild.firstElementChild
        let children = [...parent.children]
        children.sort((a, b) => {
            let aText = a.firstElementChild.firstElementChild.children[1].innerText
            let bText = b.firstElementChild.firstElementChild.children[1].innerText
            if (aText < bText) {
                return direction === 'Asc' ? -1 : 1
            }
            if (aText > bText) {
                return direction === 'Asc' ? 1 : -1
            }
            return 0
        })
        for (let j = 0; j < children.length; j++) {
            parent.appendChild(children[j])
        }
    }
}

chrome.storage.local.get({ heroSentenceOption: true }, function (data) {
    if (data.heroSentenceOption && window.location.toString() !== 'https://app.mediaportal.com/dailybriefings/#/briefings') {
        document.addEventListener('scroll', function () {
            const readMores = [...document.getElementsByClassName('btn-read-more ng-scope')].filter(item => item.firstElementChild && item.firstElementChild.innerText === 'Read more...')
            readMores.forEach(item => item.firstElementChild.click())
        })
    }
})

function func() {
    if (listenerOptions[0]) {
        let links = [...document.querySelectorAll('a')].filter(link => /app\.mediaportal\.com\/#\/connect\/media-contact/.test(link.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(link.href))
        links.map(link => link.href = '')
    }
    greyOutAutomatedBroadcast()
}

function greyOutAutomatedBroadcast() {
    let items = [...document.getElementsByClassName('list-unstyled media-item-meta-data-list')]
        .filter(item => !item.className.includes('edited')
        && item.firstChild && item.firstChild.innerText !== 'Item ID: {{::item.summary_id}}'
        && !item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.className.includes('media-item-syndication'))

    items.forEach(item => {
        if (listenerOptions[1] && item.firstChild.innerText.startsWith('Item ID: R')) {
            item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.opacity = '0.5'
            item.className += ' edited'
        } else if (listenerOptions[1] && seenIDs.includes(item.firstChild.innerText) && !item.className.includes('master')) {
            item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.opacity = '0.5'
            item.className += ' edited'
        } else if (listenerOptions[2] && !item.className.includes('master')) {
            seenIDs.push(item.firstChild.innerText)
            item.className += ' master'
        } else {
            const headline = item.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild.children[1].innerText.toLowerCase()
            const itemID = item.firstChild.innerText.slice(9)
            const sectionName = item.children[1].innerText.slice(9)
            const publicationName = item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[3].children[0].innerText.replace(/ \(page [0-9]{1,2}\)/, '')
            const key = headline + ' ' + publicationName

            if (reclipObj[key]) {
                if (reclipObj[key][1] < itemID) {
                    if (reclipObj[key][2] && reclipObj[key][2].startsWith('Edition') && item.children[1] && !item.children[1].innerText.slice(9).startsWith('Edition')) {
                        item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.opacity = '0.5'
                        item.className += ' edited'
                    } else {
                        reclipObj[key][0].style.opacity = '0.5'
                        reclipObj[key] = [item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement, itemID]
                    }
                } else if (reclipObj[key][1] !== itemID) {
                    if ((reclipObj[key][2] && !reclipObj[key][2].startsWith('Edition') && item.children[1] && item.children[1].innerText.slice(9).startsWith('Edition'))) {
                        reclipObj[key][0].style.opacity = '0.5'
                        reclipObj[key] = [item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement, itemID]
                    } else {
                        item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.opacity = '0.5'
                        item.className += ' edited'
                    }
                }
            } else {
                reclipObj[key] = [item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement, itemID, sectionName]
            }
        }
    })
}

chrome.storage.local.get({ readmoreScroll: true }, function (data) {
    if (data.readmoreScroll) {
        document.addEventListener('mousedown', function (e) {
            if (e.target.outerText === ' Read More' && e.target.parentElement.parentElement.parentElement.className === 'media-item-body media-item-details clearfix ng-scope') {
                setTimeout(function () {
                    e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[0].scrollIntoView(true)
                    window.scrollTo(window.scrollX, window.scrollY - 150)
                }, 1000)
            }
        })
    }
})

function getPossibleSyndications() {
    let headlineObj = {}
    let bylineObj = {}
    let syndColors = ['red', 'gold', 'darkgreen', 'purple', 'blue', 'pink', 'black', 'brown', 'Aquamarine', 'Orange', 'LightBlue', 'Teal']
    let colorCount = 0
    document.getElementById('syndHighlightBtn').innerText = 'Tool running...'
    try {
        expandSectionHeadings()
        let bylines = [...document.getElementsByClassName('flex flex-1 author mp-page-ellipsis')].filter(item =>
            item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild &&
            item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-video' &&
            item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-volume-up')
        let headlines = [...document.getElementsByClassName('headline mp-page-ellipsis headerRow shown')].filter(item =>
            item.parentElement.children[1].children[1].children[2].firstElementChild &&
            item.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-video' &&
            item.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-volume-up')
        for (let i = 0; i < Math.max(bylines.length, headlines.length); i++) {
            console.log(bylines[i].innerText)
            let byline = bylines[i].innerText.split(' , ').filter(item => item.startsWith('By')).join('').replace(/<span style='background-color:#DAA520'>|<\/span>|p[0-9]{1,2}/g, '').slice(3)
                .replace(/[^A-Za-z ]/, '').toLowerCase().replace(/ and /gi, '').replace(/ /g, '')
            console.log(byline)
            let headline = headlines[i].firstElementChild.innerText.toLowerCase()
            if (byline !== '') {
                if (bylineObj[byline]) {
                    bylineObj[byline].push(bylines[i])
                } else {
                    bylineObj[byline] = [bylines[i]]
                }
            }

            if (headlineObj[headline]) {
                headlineObj[headline].push(headlines[i])
            } else {
                headlineObj[headline] = [headlines[i]]
            }
        }
        bylineObj = filterObj(bylineObj)
        headlineObj = filterObj(headlineObj)

        for (let key in bylineObj) {
            for (let i = 0; i < bylineObj[key].length; i++) {
                const bylineParent = bylineObj[key][i].parentElement.parentElement.parentElement.parentElement.parentElement
                bylineParent.setAttribute( 'style', `border-color: ${syndColors[colorCount]} !important; border-width: 2px;` )
                bylineParent.className += 'syndication-tagged'
            }
            if (colorCount + 1 === syndColors.length) colorCount = 0
            else colorCount++
        }
        for (let key in headlineObj) {
            for (let i = 0; i < headlineObj[key].length; i++) {
                const headlineParent = headlineObj[key][i].parentElement.parentElement.parentElement.parentElement

                if (headlineParent.className.search('syndication-tagged') > -1) {
                    let color = headlineParent.style.borderColor
                    for (let j = i; j < headlineObj[key].length; j++) {
                        const headlineParentAlt = headlineObj[key][i].parentElement.parentElement.parentElement.parentElement
                        headlineParentAlt.setAttribute( 'style', `border-color: ${color} !important; border-width: 2px;` )
                    }
                    if (colorCount - 1 < 0) colorCount = syndColors.length - 1
                    else colorCount--
                    break
                } else {
                    headlineParent.setAttribute( 'style', `border-color: ${syndColors[colorCount]} !important; border-width: 2px;` )
                    headlineParent.className += 'syndication-tagged'
                }
            }
            if (colorCount + 1 === syndColors.length) colorCount = 0
            else colorCount++
        }
        document.getElementById('syndHighlightBtn').innerText = 'Syndications highlighted!'
        setTimeout(() => document.getElementById('syndHighlightBtn').innerText = 'Highlight syndications', 2000)
    } catch (error) {
        console.log(error)
        document.getElementById('syndHighlightBtn').innerText = 'Error encountered running tool'
    }
}

function fixBylines() {
    document.getElementById('bylineFixBtn').innerText = 'Tool running...'
    try {

        expandSectionHeadings()

        let bylines = [...document.getElementsByClassName('flex flex-1 author mp-page-ellipsis')]
            .filter(item =>
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild &&
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-video' &&
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-volume-up')
            .filter(item => {
                let byline = item.innerText.split(' , ').filter(item => item.startsWith('By')).join('').slice(3)
                return byline.length > 0 && (byline === 'Alice Man' || byline.toUpperCase() === byline || /.* Mc[a-z]|.* Mac[a-z]/.test(byline) || byline === 'DANIEL McCULLOCH' ||
                 /^by |for daily mail| for MailOnline| political editor| Education editor| and /i.test(byline))
            })
        bylines.forEach(item => {
            item.click()
            let byline = item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].firstElementChild.firstElementChild.firstElementChild.children[1].firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild
            byline.value = byline.value.replace(/^by /i, '')
            byline.value = byline.value.replace(/ for daily mail australia| for daily mail| for MailOnline| political editor/i, '')

            if (byline.value === 'Alice Man') {
                byline.value = 'Alice Workman'
            } else if (byline.value === 'DANIEL McCULLOCH') {
                byline.value = 'Daniel McCulloch'
            } else if (/.* Mc[a-z]|.* Mac[a-z]/.test(byline.value)) {
                byline.value = byline.value.replace(/Mc([a-z])|Mac([a-z])/, function(match, p1, p2) {
                    if (p1) return 'Mc' + p1.toUpperCase()
                    else return 'Mac' + p2.toUpperCase()
                })
            } else {
                byline.value = byline.value.split(' ').map(word => toSentenceCase(word)).join(' ')
            }

            byline.value = byline.value.replace(/ and /ig, ' and ')

            var textfieldUpdated = new Event('input', {
                bubbles: true,
                cancelable: true,
            })

            byline.dispatchEvent(textfieldUpdated)
        })

        let openedItems = [...document.querySelectorAll('mat-expansion-panel')]
            .filter(item =>
                item.className.search('standardMode') > -1 &&
            item.className.search('mat-expanded') > -1)

        openedItems.forEach(item => {
            item.firstElementChild.firstElementChild.firstElementChild.firstElementChild.click()
            item.parentElement.parentElement.firstElementChild.children[1].click()
        })

        let bylinesForHighlighting = [...document.getElementsByClassName('flex flex-1 author mp-page-ellipsis')]
            .filter(item =>
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild &&
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-video' &&
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-volume-up')
            .filter(item => {
                let byline = item.innerText.split(' , ').filter(item => item.startsWith('By')).join('').replace(/^By By|^By/i, '').split(' ').filter(x => x.length > 0)
                return byline.length > 2 && !byline.includes('and') && !byline.includes('van') && !byline.includes('le')
            })
        bylinesForHighlighting.forEach(byline => {
            byline.innerHTML = byline.innerHTML.replace(/, By .*,/, function(match){
                let text = match.slice(2, match.length-2)
                return `<span style='background-color:#DAA520'>, ${text}, </span>`
            })
        })

        document.getElementById('bylineFixBtn').innerText = 'Bylines fixed!'
        setTimeout(() => document.getElementById('bylineFixBtn').innerText = 'Fix bylines', 2000)
    } catch (error) {
        console.log(error)
        document.getElementById('bylineFixBtn').innerText = 'Error encountered running tool'
    }

}

function filterObj(obj) {
    return Object.keys(obj)
        .filter(key => obj[key].length > 1)
        .reduce( (res, key) => (res[key] = obj[key], res), {} )
}

function fixPressSyndications() {
    document.getElementById('fixPressBtn').innerText = 'Tool running...'
    try {

        expandSectionHeadings()
        let items = [...document.querySelectorAll('mat-expansion-panel')]
            .filter(item => item.className.search('standardMode') > -1 &&
            item.firstElementChild.firstElementChild.firstElementChild.children[1].children[1].children[2].firstElementChild &&
            item.firstElementChild.firstElementChild.firstElementChild.children[1].children[1].children[2].firstElementChild
                .className === 'mat-icon fa fa-cloud mat-icon-no-color ng-star-inserted')

        items.forEach(item => {
            if (item.children[1].firstElementChild.innerText === '') {
                item.firstElementChild.firstElementChild.firstElementChild.firstElementChild.click()
            }
            if (item.children[1].firstElementChild.firstElementChild.firstElementChild.children[3].children[1].childElementCount !== 3) return
            const SyndList = item.children[1].firstElementChild.firstElementChild.firstElementChild.children[3].children[1].children[2].children[2]
            if (SyndList.childElementCount === 0) return
            else if ((/\(Online\)/).test(SyndList.firstElementChild.innerText)) return

            item.children[1].firstElementChild.firstElementChild.firstElementChild.children[3]
                .children[1].children[2].children[2].children[0].firstElementChild.children[2].firstElementChild.children[1].firstElementChild.click() // Make parent
        })

        let openedItems = [...document.querySelectorAll('mat-expansion-panel')]
            .filter(item =>
                item.className.search('standardMode') > -1 &&
                item.className.search('mat-expanded') > -1)

        openedItems.forEach(item => {
            item.firstElementChild.firstElementChild.firstElementChild.firstElementChild.click()
            item.parentElement.parentElement.firstElementChild.children[1].click()
        })

        document.getElementById('fixPressBtn').innerText = 'Press syndications fixed!'
        setTimeout(() => document.getElementById('fixPressBtn').innerText = 'Fix press syndications', 2000)
    } catch (error) {
        console.log(error)
        document.getElementById('fixPressBtn').innerText = 'Error encountered running tool'
    }

}

function expandSectionHeadings() {
    let sectionHeadings = [...document.querySelectorAll('mat-expansion-panel')].filter(item => item.parentElement.nodeName === 'FORM' && item.className.search('mat-expanded') === -1)
    sectionHeadings.forEach(item => item.firstElementChild.firstElementChild.firstElementChild.click())

    let openedItems = [...document.querySelectorAll('mat-expansion-panel')]
        .filter(item =>
            item.className.search('standardMode') > -1 &&
        item.className.search('mat-expanded') > -1)

    openedItems.forEach(item => {
        item.firstElementChild.firstElementChild.firstElementChild.firstElementChild.click()
    })
}


function highlightBroadcastItems() {
    document.getElementById('highlightBroadcastBtn').innerText = 'Tool running...'

    try {

        const headlines = document.body.getElementsByClassName('headline mp-page-ellipsis headerRow')
        for (let i = 0; i < headlines.length; i++) {
            if ((/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/).test(headlines[i].firstChild.innerText)
                && (headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === 'fa-volume-up' ||
                    headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === 'fa-video')) {
                headlines[i].firstChild.innerHTML = headlines[i].firstChild.innerHTML
                    .replace(/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/gi, function (match) {
                        return '<span style=\'background-color:#DAA520;\'>' + match + '</span>'
                    })
            }
        }

        document.getElementById('highlightBroadcastBtn').innerText = 'Broadcast highlighted!'
        setTimeout(() => document.getElementById('highlightBroadcastBtn').innerText = 'Highlight broadcast for recapping', 2000)
    } catch (error) {
        console.log(error)
        document.getElementById('highlightBroadcastBtn').innerText = 'Error encountered running tool'
    }

}


const datesForChecks = getLastThreeDates()
const metroPapers = ['Weekend Australian', 'Australian Financial Review', 'Sydney Morning Herald', 'Sun Herald',
    'Daily Telegraph', 'Sunday Telegraph', 'Age', 'Sunday Age', 'Herald Sun', 'Sunday Herald Sun', 'Canberra Times',
    'Sunday Canberra Times', 'Courier Mail', 'Sunday Mail Brisbane', 'Adelaide Advertiser', 'Sunday Mail Adelaide',
    'West Australian', 'Sunday Times', 'Hobart Mercury', 'Northern Territory News', 'Sunday Territorian', 'Sunday Tasmanian',
    'The Australian', 'AFR Weekend ', 'New Zealand Herald', 'The Dominion Post', 'The Press', 'Otago Daily Times', 'Herald on Sunday', 'Sunday News', 'Sunday Star-Times']

function cleanUpAuthorLines(byline, isIndustry) {

    if (isIndustry) {
        if (byline.length > 1 && byline[1] === 'Letters') {
            byline[1] = '<span style=\'background-color:#8A2BE2;\'>' + byline[1] + '</span>'
        }
        if (byline.length < 2) return byline
        byline[byline.length - 1] = checkContentDates(byline[byline.length - 1], byline[0], byline[1])
        if (byline.length < 3 || /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(byline[2])) return byline
        if (byline[3] && (/^[0-9]{2}\//).test(!byline[3]) && !byline[3].startsWith('Page')) {
            for (let i = 3; i < byline.length; i++) {
                if (byline[i].startsWith('Page') || (/^[0-9]{2}\//).test(!byline[i])) {
                    const remainder = byline.slice(i)
                    byline = byline.slice(0, 4)
                    byline.push(remainder)
                } else if (i + 1 === byline.length) {
                    byline[2] += `, ${byline[i]}`
                    byline = byline.slice(0, 4)
                } else {
                    byline[2] += `, ${byline[i]}`
                }
            }
        }

        if (byline[2].startsWith('Page ')) return byline
        let splitByline = byline[2].split(' ')
        if (byline[2].toUpperCase() === byline[2] && !/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(byline[2])) {
            byline[2] = '<span style=\'background-color:#FDFF47;\'>' + byline[2] + '</span>'
        } else if (splitByline.length === 1 && !/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(byline[2])) {
            byline[2] = '<span style=\'background-color:#00FF00;\'>' + byline[2] + '</span>'//Possible proper noun;
        } else if (splitByline.length > 2 && byline[2].search(/and/) === -1) {
            if (!/ van | le /i.test(byline[2])) {
                byline[2] = '<span style=\'background-color:#00FF00;\'>' + byline[2] + '</span>'//Possible proper noun
            }
            return byline
        } else if (byline[2].search(/Alice Man/) > -1) {
            byline[2] = '<span style=\'background-color:#00FF00;\'>' + byline[2] + '</span>'//Possible proper noun
        }
        return byline
    } else {
        if (byline.length > 1 && byline[1] === 'Letters') {
            byline[1] = '<span style=\'background-color:#8A2BE2;\'>' + byline[1] + '</span>'
        }
        if (byline.length < 3) return byline
        byline[2] = checkContentDates(byline[2], byline[0], byline[1])
        if (byline.length < 4 || /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(byline[3])) return byline
        if (byline[4] && !byline[4].startsWith('Page')) {
            for (let i = 4; i < byline.length; i++) {
                if (byline[i].startsWith('Page')) {
                    const remainder = byline.slice(i)
                    byline = byline.slice(0, 4)
                    byline.push(remainder)
                } else if (i + 1 === byline.length) {
                    byline[3] += `, ${byline[i]}`
                    byline = byline.slice(0, 4)
                } else {
                    byline[3] += `, ${byline[i]}`
                }
            }
        }

        if (byline[3].startsWith('Page ')) return byline
        let splitByline = byline[3].split(' ')
        if (byline[3].toUpperCase() === byline[3] && !/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(byline[3])) {
            byline[3] = '<span style=\'background-color:#FDFF47;\'>' + byline[3] + '</span>'
        } else if (splitByline.length === 1 && !/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(byline[3])) {
            byline[3] = '<span style=\'background-color:#00FF00;\'>' + byline[3] + '</span>'//Possible proper noun;
        } else if (splitByline.length > 2 && byline[3].search(/and/) === -1) {
            if (!/ van | le /i.test(byline[3])) {
                byline[3] = '<span style=\'background-color:#00FF00;\'>' + byline[3] + '</span>'//Possible proper noun
            }
            return byline
        } else if (byline[3].search(/Alice Man/) > -1) {
            byline[3] = '<span style=\'background-color:#00FF00;\'>' + byline[3] + '</span>'//Possible proper noun
        }
        return byline
    }
}


function checkContentDates(date, outlet, mediatype) {
    if (!date || date.length === 0) return date
    if (!/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/.test(date)) return date
    let contentDate = new Date(Date.parse(date.replace(/([0-9]{2})\/([0-9]{2})/, '$2/$1')))

    if (metroPapers.includes(outlet) && mediatype !== 'Other' && contentDate < datesForChecks[0]) {
        return '<span style=\'background-color:#8A2BE2;\'>' + date + '</span>'// possible old content
    } else if (contentDate < datesForChecks[2]) {
        return '<span style=\'background-color:#8A2BE2;\'>' + date + '</span>'// possible old content
    }
    return date
}

function getLastThreeDates() {
    let todaysDate = new Date(new Date().setHours(0, 0, 0, 0))
    let dayBefore = new Date().setDate(todaysDate.getDate() - 1)
    let dayBeforeYesterday = new Date().setDate(todaysDate.getDate() - 3)
    return [todaysDate, dayBefore, dayBeforeYesterday]
}


function highlightHeadlines(headline, headlinesChecked) {
    // if (headlineStyle.includes('font-size: 16px')) return cleanUpAuthorLines(headline.split(', ')).join(', ')
    let editedHeadline = headline
    if ((/(fuck|shit|cunt|dick|boob|bitch|fag|nigger|chink|gook)/i).test(headline)) {
        editedHeadline = '<span style=\'background-color:#FF0000;\'>' + headline + '</span>'
    } else if (headline.toUpperCase() === headline) {
        editedHeadline = '<span style=\'background-color:#FDFF47;\'>' + headline + '</span>'
    } else if (headlinesChecked.indexOf(headline.toLowerCase()) > -1) {
        editedHeadline = '<span style=\'background-color:#8A2BE2;\'>' + headline + '</span>'
    }
    headlinesChecked.push(headline.toLowerCase())
    return editedHeadline
}

async function checkingHighlights() {
    if (!window.location.toString().startsWith('https://briefing-api.mediaportal.com/api/download')) return
    let skipDecapping = await getCheckingCaps()
    let properNouns = await getCheckingPropers()
    let links = document.querySelectorAll('a')
    let headlinesChecked = []
    let isIndustry = false

    for (let i = 0; i < links.length; i++) {
        if (links[i].innerHTML === 'Read Plain Text' || links[i].innerHTML === 'Read More') break

        if (links[i].innerHTML.match(/MonitorReport-/)) {
            links[i].style.backgroundColor = '#00FF00'
        }
    }

    if (document.body.outerText.search('For any questions or feedback on this report contact the Department’s media team at mediateam@industry.gov.au') > -1) {
        isIndustry = true
    }

    let authorLines = document.getElementsByClassName('item-metadata-hook')
    let headlines = document.getElementsByClassName('item-headline-hook')
    let itemSummaries = document.getElementsByClassName('item-content-hook')

    for (let i = 0; i < itemSummaries.length; i++) {
        if (authorLines[i].innerText.length === 0) {
            let headline = headlines[i].firstElementChild.innerHTML.trimStart().replace(/ {2,}/g, '').replace('\n', '').split(', ')

            headlines[i].firstElementChild.innerHTML = cleanUpAuthorLines(headline, isIndustry).join(', ')
        } else {
            let authorLine = authorLines[i].firstElementChild.innerHTML.trimStart().replace(/ {2,}/g, '').replace('\n', '').split(', ')

            authorLines[i].firstElementChild.innerHTML = cleanUpAuthorLines(authorLine, isIndustry).join(', ')

            let headline = headlines[i].firstElementChild.innerHTML.trimStart().replace(/ {2,}/g, '').replace('\n', '')

            headlines[i].firstElementChild.innerHTML = highlightHeadlines(headline, headlinesChecked)

        }

        let itemContent = itemSummaries[i].firstElementChild.firstElementChild.innerHTML.trimStart().replace(/ {2,}/g, '').replace('\n', '')
        let itemContentWords = itemContent.split(' ')
        let finalCheck = false

        for (let j = 0; j < itemContentWords.length; j++) {

            let word = itemContentWords[j].replace(/[.!?,]["']{0,1}$/, '').replace(/[^A-Za-z0-9-/]/g, '')
            if (finalCheck) {
                if ((/(fuck|shit|cunt|dick|boob|bitch|fag|nigger|chink|gook)/i).test(word)) {
                    itemContentWords[j] = `<span style='background-color:#FF0000;'>${itemContentWords[j]}</span>` // Possible swear word
                }
                continue
            }

            if (j === 0 && (/Exclusive|Inside/i).test(word)) {
                itemContentWords[j] = `<span style='background-color:#8A2BE2;'>${itemContentWords[j]}</span>`// Possible subheading
            } else if ((/(fuck|shit|cunt|dick|boob|bitch|fag|nigger|chink|gook)/i).test(word)) {
                itemContentWords[j] = `<span style='background-color:#FF0000;'>${itemContentWords[j]}</span>` // Possible swear word
            } else if (word.toUpperCase() === word && (/[A-Z]/).test(word)) {
                if (skipDecapping.includes(word) || word === 'I' || word === 'A') console.log(word) // Bad matches, can end the loop for this word here
                else if (properNouns.includes(toSentenceCase(word)) && j < 4) {
                    itemContentWords[j] = `<span style='background-color:#00FF00;'>${itemContentWords[j]}</span>`
                } else {
                    itemContentWords[j] = `<span style='background-color:#FDFF47;'>${itemContentWords[j]}</span>`
                }
            } else if (j > 0 && j < 5 && (word === 'The' || word === 'A')) {
                itemContentWords[j] = `<span style='background-color:#8A2BE2;'>${itemContentWords[j]}</span>` // Possible subheading
            } else if (word === word.toLowerCase()) {
                if ((properNouns.includes(toSentenceCase(word)) || skipDecapping.includes(word.toUpperCase()) || word === 'scomo')  && j < 4) {
                    itemContentWords[j] = `<span style='background-color:#00FF00;'>${itemContentWords[j]}</span>`
                }
            }

            if ((/[.!?]["']{0,1}(?:\s|$)/).test(itemContentWords[j]) && j > 5) {
                finalCheck = true
            }
        }

        itemSummaries[i].firstElementChild.firstElementChild.innerHTML = itemContentWords.join(' ')
    }
}

const toSentenceCase = (word) => word.split('').map((letter, index) => {
    if (index === 0) return letter.toUpperCase()
    else if ((word[0] === '"' || word[0] === '\'') && index === 1) return letter.toUpperCase()
    else return letter.toLowerCase()
}).join('')

function getAllIDs() {
    return [...document.getElementsByClassName('list-unstyled media-item-meta-data-list')].map(item => item.firstChild.innerText.replace('Item ID: ', '')).join('\n')
}

function changeCase() {
    var textBox = document.activeElement

    if (textBox.selectionStart !== undefined) {
        var startPos = textBox.selectionStart
        var endPos = textBox.selectionEnd
        var text = changeSelectedText(window.getSelection().toString())
        if (startPos === endPos) {
            startPos = expandStartPos(textBox.value, startPos)
            endPos = expandEndPos(textBox.value, endPos)
            text = changeSelectedText(textBox.value.slice(startPos, endPos))
        }
        textBox.value = textBox.value.slice(0, startPos) + text + textBox.value.slice(endPos)
        textBox.setSelectionRange(startPos, endPos)
    }

    var textfieldUpdated = new Event('input', {
        bubbles: true,
        cancelable: true,
    })

    textBox.dispatchEvent(textfieldUpdated)
}

function expandStartPos(text, startPos) {
    if (startPos > 0) startPos--
    while (text[startPos] !== ' ' && startPos > 0) {
        startPos--
    }
    return startPos > 0 ? startPos + 1 : startPos
}

function expandEndPos(text, endPos) {
    while (text[endPos] !== ' ' && endPos < text.length) {
        endPos++
    }
    return endPos
}

function changeToSentenceCase() {

    var textBox = document.activeElement
    var text = window.getSelection().toString()

    if (textBox.selectionStart !== undefined) {
        var startPos = textBox.selectionStart
        var endPos = textBox.selectionEnd
        if (startPos === endPos) {
            startPos = expandStartPos(textBox.value, startPos)
            endPos = expandEndPos(textBox.value, endPos)
            text = textBox.value.slice(startPos, endPos)
        }
        text = text
            .split(' ')
            .map((word, index) => {
                if (index === 0) return toSentenceCase(word)
                else return word.toLowerCase()
            })
            .join(' ')
        textBox.value = textBox.value.slice(0, startPos) + text + textBox.value.slice(endPos)
        textBox.setSelectionRange(startPos, endPos)
    }

    var textfieldUpdated = new Event('input', {
        bubbles: true,
        cancelable: true,
    })

    textBox.dispatchEvent(textfieldUpdated)
}


function setFieldValue(data) {
    if (!lastHighlightedElement || !lastHighlightedElement.parentElement.parentElement.className === 'readmore shown' ||
    (!lastHighlightedElement.parentElement.nodeName === 'MARK' && !lastHighlightedElement.parentElement.parentElement.parentElement.className  === 'readmore shown')) return

    let textBox = document.getSelection().baseNode.parentElement.parentElement.parentElement.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild
    let textBoxData = textBox.value.split('[...]')
    if (textBoxData.length === 1) {
        textBox.value = data
    } else {
        if (!data.endsWith(' ')) data += ' '
        textBoxData[0] = data
        textBox.value = textBoxData.join('[...]')
    }

    var textfieldUpdated = new Event('input', {
        bubbles: true,
        cancelable: true,
    })

    textBox.dispatchEvent(textfieldUpdated)
}

function changeSelectedText(text) {
    const currentCapitalisation = getCapitalisation(text)
    switch (currentCapitalisation) {
    case 'AllCaps':
        if (text.length === 1) return text.toLowerCase()
        return text.split(' ').map(word => toSentenceCase(word)).join(' ')
    case 'Title Case':
        return text
            .split(' ')
            .map((word, index) => {
                if (index === 0) return toSentenceCase(word)
                else return word.toLowerCase()
            })
            .join(' ')
    case 'Sentence case':
        return text.toLowerCase()
    case 'lower case':
        return text.toUpperCase()
    default:
        return text
    }

}

function getCapitalisation(text) {
    if (text.toUpperCase() === text) return 'AllCaps'
    else if (text.split(' ').filter(x => x.length > 0).length > 1 && text.split(' ').map(word => toSentenceCase(word)).join(' ') === text) return 'Title Case'
    else if (text.split(' ').map((word, index) => {
        if (index === 0) return toSentenceCase(word)
        else return word.toLowerCase()
    }).join(' ') === text) return 'Sentence case'
    else if (text.toLowerCase() === text) return 'lower case'
    return 'lower case'
}

async function archiveSelectedContent() {
    const selectedItems = [...document.getElementsByClassName('media-item-checkbox')].filter(x => x.parentElement && x.checked).map(x => {
        const outletName = x.parentElement.children[3].firstElementChild.firstElementChild.firstElementChild.innerText.replace(/ \(page [0-9]{1,}\)/, '')
        let headline
        if (x.parentElement.parentElement.parentElement.parentElement.className.startsWith('media-item-syndication')) {
            headline = x.parentElement.parentElement.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)
        } else headline = x.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)

        return `${headline} | ${outletName}`
    })
    console.log(selectedItems.length)

    let selectedFolders = [...document.getElementsByClassName('checkbox-custom')].filter(x => /^Brands|Competitors|Personal|Release Coverage|Spokespeople/.test(x.id) && x.checked).map(x => x.parentElement.children[1].innerText.trimStart())
    if (selectedFolders.length === 0) return

    let archivedContent = await getArchivedContent()
    console.log(archivedContent)

    if (!archivedContent[currentPortal]) archivedContent[currentPortal] = []
    archivedContent[currentPortal].push(selectedItems.filter(x => !archivedContent[currentPortal].includes(x)))
    archivedContent[currentPortal] = archivedContent[currentPortal].flat()

    console.log(archivedContent)

    lastAddedContent = [window.location.href.toString(), selectedItems]

    chrome.storage.local.set({ archivedContent: archivedContent }, function() {
    })

}

async function removeArchivedContent() {
    let selectedItems = [...document.getElementsByClassName('media-item-checkbox')].filter(x => x.parentElement && x.checked).map(x => {
        const outletName = x.parentElement.children[3].firstElementChild.firstElementChild.firstElementChild.innerText.replace(/ \(page [0-9]{1,}\)/, '')
        let headline
        if (x.parentElement.parentElement.parentElement.parentElement.className.startsWith('media-item-syndication')) {
            headline = x.parentElement.parentElement.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)
        } else headline = x.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)

        return `${headline} | ${outletName}`
    })
    let archivedContent = await getArchivedContent()

    if (lastAddedContent[0] === window.location.href.toString()) {
        selectedItems = selectedItems.filter(x => !lastAddedContent[1].includes(x))
    }

    if (!archivedContent[currentPortal]) archivedContent[currentPortal] = []
    archivedContent[currentPortal] = archivedContent[currentPortal].filter(x => !selectedItems.includes(x))
    console.log(archivedContent)

    chrome.storage.local.set({ archivedContent: archivedContent }, function() {
    })
}

async function checkAddedContent() {
    let RPItems = [...document.getElementsByClassName('media-item media-item-compact')].map(x => {
        const outletName = x.children[1].firstElementChild.children[3].firstElementChild.innerText.replace(/ \(page [0-9]{1,}\)/, '')
        const headline = x.firstElementChild.children[1].innerText.slice(0, 90)
        return `${headline} | ${outletName}`
    })
    console.log(RPItems)
    console.log(currentPortal)
    let archivedContent = await getArchivedContent()
    console.log(archivedContent)

    if (archivedContent[currentPortal]) {
        let missingItems = [...new Set(archivedContent[currentPortal])].filter(x => RPItems.indexOf(x) === -1)
        console.log(missingItems)
        if (missingItems.length > 0) {
            chrome.runtime.sendMessage({
                action: 'createWindow',
                url: 'missingContent.html',
                missingItems: missingItems
            })
        } else {
            alert('No missing items detected!*\n\n\n*We hope anyway')
        }

    }
}

function createRPButton() {
    if (document.getElementsByClassName('AVeryLongClassNameNoOneWillEverUse').length > 0) return
    let button = document.createElement('BUTTON')
    button.innerText = 'Check for missing content'
    button.addEventListener('click', checkAddedContent)
    button.style.marginLeft = '19px'
    button.style.color = 'black'
    button.style.borderColor = 'black'
    button.className += 'AVeryLongClassNameNoOneWillEverUse'
    document.getElementsByClassName('dropdown-menu scroll-menu')[0].children[1].appendChild(button)
    let para = document.createElement('P')
    para.innerText = 'Instructions:\n1: Do selections normally.\n2: Add all selections to RP when done, switch to Excel template\n3: If RP is grouped by anything, make sure each grouping\
     is open. Scroll to the bottom to ensure all the content loads also.\n4: Click the above button, a new window will open if missing items are detected.\n\n NB: Some syndications may incorrectly appear\
      as missing, this is a known bug'
    para.style.marginLeft = '19px'
    para.style.marginTop = '10px'
    para.style.marginRight = '10px'
    document.getElementsByClassName('dropdown-menu scroll-menu')[0].children[1].appendChild(para)
}

function improveAccessibiltyOptions() {
    if (document.getElementsByClassName('AVeryLongClassNameNoOneWillEverUse').length > 0) return
    let parentEle = document.getElementsByClassName('flex flex1 flex-direction-row align-items-center justify-content-space-between heading')[0].firstElementChild
    let button = document.createElement('BUTTON')
    button.innerText = 'MERGE ITEMS'
    button.style.marginLeft = '15px'
    button.className = 'mat-stroked-button mat-primary _mat-animation-noopable AVeryLongClassNameNoOneWillEverUse'
    button.addEventListener('mousedown', () => {
        if (document.getElementsByClassName('mergeButton mat-button mat-primary _mat-animation-noopable ng-star-inserted').length > 0) {
            document.getElementsByClassName('mergeButton mat-button mat-primary _mat-animation-noopable ng-star-inserted')[0].firstElementChild.click()
        }
    })
    let secondButton = document.createElement('BUTTON')
    secondButton.innerText = 'DELETE ITEMS'
    secondButton.style.marginLeft = '15px'
    secondButton.className = 'mat-stroked-button mat-primary _mat-animation-noopable'
    secondButton.addEventListener('mousedown', () => {
        if (document.getElementsByClassName('deleteButton mat-button mat-primary _mat-animation-noopable').length > 0) {
            document.getElementsByClassName('deleteButton mat-button mat-primary _mat-animation-noopable')[0].firstElementChild.click()
        }
    })
    parentEle.appendChild(button)
    parentEle.appendChild(secondButton)
}

function createDBPlatformButtons() {
    let para = document.createElement('P')
    para.innerText = 'NB: Before using any of these, scroll to the bottom of the report and ensure all items have loaded in.'

    let label = document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[1].firstElementChild.cloneNode()
    label.innerText = 'PLUGIN'

    let div = document.createElement('DIV')
    div.className = 'flex flex-1 flex-direction-column mp-form-fieldset'
    div.style.padding = '10px'
    div.appendChild(label)
    div.appendChild(para)
    let buttons = [['Highlight syndications', getPossibleSyndications, 'syndHighlightBtn'],  ['Highlight broadcast for recapping', highlightBroadcastItems, 'highlightBroadcastBtn'],
        ['Fix bylines', fixBylines, 'bylineFixBtn'], ['Fix print syndications', fixPressSyndications, 'fixPressBtn']]

    for (let i = 0; i < buttons.length; i++) {
        div.appendChild(createButton(buttons[i][0], buttons[i][1], buttons[i][2]))
    }

    document.getElementsByClassName('mp-page-inner-tools mp-form')[0].appendChild(div)
}

function createButton(innerText, onClickFunc, id) {
    let btn = document.createElement('button')

    btn.setAttribute( 'style', 'font-size: 14px !important;' )
    btn.className = 'mp-page-thin-button addButton mat-stroked-button mat-primary _mat-animation-noopable'
    btn.id = id
    btn.style.marginTop = '10px'

    btn.innerText = innerText
    btn.addEventListener('click', onClickFunc)
    return btn
}

async function makeNumbersAccurate() {
    if (document.getElementsByClassName('cov-meta meta-data ng-binding').length === 0 || document.getElementsByClassName('cov-meta meta-data ng-binding')[0].childElementCount === 0) return

    let setting = await getNumberFix()
    if (!setting) return
    let personalFolders = [...document.getElementsByClassName('item-primary-panel')].filter(x => !/^Com­peti­tors|^Brands|^Per­sonal|^Spokes­peo­ple|^Re­lease Cov­er­age/.test(x.innerText))
    let unreadTally = 0
    let totalItemTally = 0
    personalFolders.forEach(item => {
        let correctChild = item.firstElementChild.children[2].childElementCount - 2

        let numbers = item.firstElementChild.children[2].children[correctChild].innerText.split('\n').map(x => Number(x.replace(/[^0-9]/g, '')))
        if (!isNaN(numbers[0])) unreadTally += numbers[0]
        if (!isNaN(numbers[1])) totalItemTally += numbers[1]
    })
    // console.log(`Unread items: ${unreadTally}, Total Items: ${totalItemTally}`)
    document.getElementsByClassName('cov-meta meta-data ng-binding')[0].children[1].firstElementChild.innerText = unreadTally
    document.getElementsByClassName('cov-meta meta-data ng-binding')[0].children[2].innerText = totalItemTally
}


chrome.storage.local.get({ listenerOptions: [true, true, true] }, function (data) {
    if (window.location.toString() !== 'https://app.mediaportal.com/dailybriefings/#/briefings' && window.location.toString() !== 'https://app.mediaportal.com/#/report-builder/view') {
        document.addEventListener('scroll', func)
        listenerOptions = data.listenerOptions
    }
})

function getCheckingCaps() {
    return new Promise(options => {
        chrome.storage.local.get({ copyCaps: defaultCheckCaps }, function (data) {
            options(data.copyCaps)
        })
    })
}
function getCheckingPropers() {
    return new Promise(options => {
        chrome.storage.local.get({ copyPropers: defaultCheckProperNouns }, function (data) {
            options(data.copyPropers)
        })
    })
}
function getAutoHighlightOption() {
    return new Promise(options => {
        chrome.storage.local.get({ autoHighlight: true }, function (data) {
            options(data.autoHighlight)
        })
    })
}
function getArchivedContent() {
    return new Promise(options => {
        chrome.storage.local.get({ archivedContent: {} }, function (data) {
            options(data.archivedContent)
        })
    })
}

function getCurrentPortal() {
    if (chrome.extension.inIncognitoContext) {
        return new Promise(options => {
            chrome.storage.local.get({ currentPortalIncog: {} }, function (data) {
                options(data.currentPortalIncog)
            })
        })
    } else {
        return new Promise(options => {
            chrome.storage.local.get({ currentPortalRegular: {} }, function (data) {
                options(data.currentPortalRegular)
            })
        })
    }
}

function getLastContentReset() {
    return new Promise(options => {
        chrome.storage.local.get({ contentReset: 'September 30, 2020' }, function (data) {
            options(data.contentReset)
        })
    })
}


function getNumberFix() {
    return new Promise(options => {
        chrome.storage.local.get({ numberFix: true }, function (data) {
            options(data.numberFix)
        })
    })
}