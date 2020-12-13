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
const defaultStaticTextArr = ['Similar coverage reported by: ', 'Also in other publications', '', '', '', '', '', '', '', '']
let seenIDs = []
let listenerOptions = [true, true, true]
let lastHighlightedElement = null
let reclipObj = {}
let currentPortal = null
let lastAddedContent = []
const datesForChecks = getLastThreeDates()
const metroPapers = ['Weekend Australian', 'Australian Financial Review', 'Sydney Morning Herald', 'Sun Herald',
    'Daily Telegraph', 'Sunday Telegraph', 'Age', 'Sunday Age', 'Herald Sun', 'Sunday Herald Sun', 'Canberra Times',
    'Sunday Canberra Times', 'Courier Mail', 'Sunday Mail Brisbane', 'Adelaide Advertiser', 'Sunday Mail Adelaide',
    'West Australian', 'Sunday Times', 'Hobart Mercury', 'Northern Territory News', 'Sunday Territorian', 'Sunday Tasmanian',
    'The Australian', 'AFR Weekend ', 'New Zealand Herald', 'The Dominion Post', 'The Press', 'Otago Daily Times', 'Herald on Sunday', 'Sunday News', 'Sunday Star-Times']

function getLastThreeDates() {
    let todaysDate = new Date(new Date().setHours(0, 0, 0, 0))
    let dayBefore = new Date().setDate(todaysDate.getDate() - 1)
    let dayBeforeYesterday = new Date().setDate(todaysDate.getDate() - 3)
    return [todaysDate, dayBefore, dayBeforeYesterday]
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'getHighlightedText') {
            sendResponse({ copy: window.getSelection().toString() })
            lastHighlightedElement = document.getSelection().baseNode
        } else if (request.action === 'changeCase') {
            changeCase()
        } else if (request.action === 'changeToSentenceCase') {
            changeToSentenceCase()
        } else if (request.action === 'setFieldValue') {
            setFieldValue(request.data)
        } else if (request.action === 'merge') {
            clickMerge()
        } else if (request.action === 'delete') {
            clickDelete()
        }
    }
)

window.onload = async function () {
    const browserURL = window.location.href.toString()
    let lastReset = await getLastContentReset()
    console.log(`Tracked items last reset at: ${lastReset}`)
    let currentDate = new Date()
    let timeDif = (currentDate.getTime() - new Date(lastReset).getTime()) / 1000 / 3600
    if (timeDif > 15) {
        chrome.storage.local.set({ contentReset: currentDate.toString() }, function () {
        })
        chrome.storage.local.set({ archivedContent: {} }, function () {
        })
        chrome.storage.local.set({ detailedArchiveContent: {} }, function () {
        })
    }

    if (browserURL.startsWith('https://app.mediaportal.com/')) currentPortal = await getCurrentPortal()

    console.log(currentPortal)

    if (document.getElementsByClassName('coverage-jump-trigger ng-binding').length > 0) {
        document.title = document.getElementsByClassName('coverage-jump-trigger ng-binding')[0].innerText.trimEnd()
        waitForMP('sorting dropdown', addHeadlineSortOptions)
        waitForMP('media-item-header', removeOutletContactLinks)
    } else if (browserURL === 'https://app.mediaportal.com/dailybriefings/#/briefings') {
        document.title = 'DB Platform'
    } else if (browserURL === 'https://app.mediaportal.com/#/monitor/media-coverage') {
        document.title = 'Mediaportal Coverage'
    } else if (browserURL === 'https://app.mediaportal.com/#/report-builder/view') {
        document.title = 'Report Builder'
        if (document.getElementsByClassName('dropdown-display').length > 0 && document.getElementsByClassName('dropdown-display')[0].innerText === ' Excel') createRPButton()
        else {
            setTimeout((() => {
                if (document.getElementsByClassName('dropdown-display').length > 0 && document.getElementsByClassName('dropdown-display')[0].innerText === ' Excel') createRPButton()
            }), 500)
        }
    } else if (browserURL.startsWith('https://briefing-api.mediaportal.com/api/download')) {
        const highlightOption = await getAutoHighlightOption()
        if (highlightOption) setTimeout(checkingHighlights, 1000)
    } else if (browserURL.startsWith('https://app.mediaportal.com/dailybriefings/#/report')) {
        waitForMP('flex flex-1 flex-direction-column mp-form-fieldset', createDBPlatformButtons)
        setTimeout(() => document.getElementsByClassName('mat-slide-toggle-label')[0].addEventListener('mousedown', improveAccessibiltyOptions), 500)
    } else if (browserURL.startsWith('https://app.mediaportal.com/#/monitor/search-coverage/')) {
        document.getElementsByClassName('control-area clearfix')[0].appendChild(createSearchButton())
    }

    if (!browserURL.startsWith('https://app.mediaportal.com/dailybriefings/#/briefings')) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.id === 'searchNavbarText') {
                waitForMP('control-area clearfix', appendSearchButton)
            }
        })
    }
}

document.addEventListener('mousedown', async function (e) {
    if (e.button !== 0 || e.ctrlKey || !e.target) return

    if ((e.target.className === 'coverage-anchor' ||
        (e.target?.parentElement?.className === 'coverage-anchor' || e.target?.parentElement?.className === 'item-primary-panel') ||
        (e.target?.parentElement?.parentElement?.className === 'item-primary-panel'))
        && / Brief| Folder/.test(e.target.parentElement.outerText) ||
        e.target.parentElement && (e.target.parentElement.className === 'item-unread-count' || e.target.parentElement.parentElement.className === 'item-unread-count')) {

        if (e.target.nodeName === 'DIV') document.title = e.target.parentElement.children[1].outerText.trimEnd()
        else if (e.target.nodeName === 'A' && e.target.children[1]) document.title = e.target.children[1].innerText
        else if (e.target.nodeName === 'SPAN' && (e.target.className === 'unread ng-scope' || e.target.className === 'item-type ng-binding' || e.target.className === 'total' || e.target.className === 'unread ng-scope has-unread')) {
            document.title = e.target.parentElement.parentElement.parentElement.children[1].innerText
        }
        else document.title = e.target.outerText.trimEnd()

        waitForMP('sorting dropdown', addHeadlineSortOptions)
        waitForMP('media-item-header', removeOutletContactLinks)
    } else if (e.target.nodeName === 'SPAN' && e.target.outerText === ' BACK' || e.target.nodeName === 'A' && e.target.outerText === ' Coverage' ||
        e.target.href === 'https://app.mediaportal.com/#/monitor/media-coverage' || (e.target.parentElement && e.target.parentElement.href === 'https://app.mediaportal.com/#/monitor/media-coverage')) {
        document.addEventListener('scroll', func)
        document.title = 'Mediaportal Coverage'
        seenIDs = []
    } else if (e.target.href === 'https://app.mediaportal.com/#/report-builder/view' || (e.target.parentElement && e.target.parentElement.href === 'https://app.mediaportal.com/#/report-builder/view')) {
        document.removeEventListener('scroll', func)
        document.title = 'Report Builder'
        setTimeout(() => {
            if (document.getElementsByClassName('dropdown-display').length > 0 && document.getElementsByClassName('dropdown-display')[0].innerText === ' Excel') {
                createRPButton()
            }
        }, 2000)
    } else if (e.target.id === 'btnLogin') {
        let lastReset = await getLastContentReset()
        let currentDate = new Date()
        let timeDif = (currentDate.getTime() - new Date(lastReset).getTime()) / 1000 / 3600
        if (timeDif > 15) {
            chrome.storage.local.set({ contentReset: currentDate.toString() }, function () {
            })
            chrome.storage.local.set({ archivedContent: {} }, function () {
            })
            chrome.storage.local.set({ detailedArchiveContent: {} }, function () {
            })
        }
        if (chrome.extension.inIncognitoContext) {
            chrome.storage.local.set({ currentPortalIncog: document.getElementById('txtUsername').value.toLowerCase() }, function () {
            })
        } else {
            chrome.storage.local.set({ currentPortalRegular: document.getElementById('txtUsername').value.toLowerCase() }, function () {
            })
        }
    } else if (e.target?.parentElement?.className === 'modal-footer ng-scope' && e.target.innerText === 'Add') {
        archiveSelectedContent()
    } else if (e.target?.parentElement?.className === 'modal-footer ng-scope' && e.target.innerText === 'Remove') {
        removeArchivedContent()
    } else if (window.location.href.toString() === 'https://app.mediaportal.com/#/report-builder/view' && document.getElementsByClassName('dropdown-display').length > 0
        && e.target?.parentElement?.parentElement === document.getElementsByClassName('dropdown-list')[0].firstElementChild.children[4]) {
        setTimeout(createRPButton, 500)
    } else if (e.target.innerText === 'Search Now' && window.location.href.toString().startsWith('https://app.mediaportal.com/#/monitor/search-coverage/')) {
        waitForMP('sorting dropdown', addHeadlineSortOptions)
    }

    if (e.target?.parentElement?.parentElement?.className === 'dropdown-menu search-dropdown-menu') {
        waitForMP('control-area clearfix', appendSearchButton)
    }

    if (e.target.className === 'mp-icon fas fa-play' || e.target.className === 'runButton mat-icon-button mat-primary _mat-animation-noopable' ||
        (e.target.className === 'mat-button-wrapper' && e.target?.firstElementChild?.className === 'mp-icon fas fa-play')) {
        waitForMP('flex flex-1 flex-direction-column mp-form-fieldset', createDBPlatformButtons)
        setTimeout(() => document.getElementsByClassName('mat-slide-toggle-label')[0].addEventListener('mousedown', improveAccessibiltyOptions), 1000)
    }
})

if (window.location.href.toString() === 'https://www.mediaportal.com/' || window.location.href.toString() === 'https://www.mediaportal.com' || window.location.href.toString().startsWith('https://www.mediaportal.com/login.aspx')) {
    document.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            let lastReset = await getLastContentReset()
            let currentDate = new Date()
            let timeDif = (currentDate.getTime() - new Date(lastReset).getTime()) / 1000 / 3600
            if (timeDif > 15) {
                chrome.storage.local.set({ contentReset: currentDate.toString() }, function () {
                })
                chrome.storage.local.set({ archivedContent: {} }, function () {
                })
                chrome.storage.local.set({ detailedArchiveContent: {} }, function () {
                })
            }
            if (chrome.extension.inIncognitoContext) {
                chrome.storage.local.set({ currentPortalIncog: document.getElementById('txtUsername').value.toLowerCase() }, function () {
                })
            } else {
                chrome.storage.local.set({ currentPortalRegular: document.getElementById('txtUsername').value.toLowerCase() }, function () {
                })
            }
        }
    })
}


chrome.storage.local.get({ heroSentenceOption: true }, function (data) {
    if (data.heroSentenceOption && window.location.toString() !== 'https://app.mediaportal.com/dailybriefings/#/briefings') {
        document.addEventListener('scroll', function () {
            const readMores = [...document.getElementsByClassName('btn-read-more ng-scope')].filter(item => item.firstElementChild && item.firstElementChild.innerText === 'Read more...')
            readMores.forEach(item => item.firstElementChild.click())
        })
    }
})


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

function waitForMP(classToCheck, fnc, maxRecursion = 15) {
    if (maxRecursion < 1) return
    if (document.getElementsByClassName(classToCheck).length === 0) {
        setTimeout(() => waitForMP(classToCheck, fnc, maxRecursion - 1), 1000)
        return
    }
    fnc()
}

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
    if (window.location.href.toString().startsWith('https://app.mediaportal.com/#/monitor/search-coverage/')) {
        let parent = document.getElementsByClassName('list-wrap ng-scope')[0]
        let children = [...parent.children]
        children.sort((a, b) => {
            let aText = a.firstElementChild.firstElementChild.children[1].innerText.toLowerCase()
            if (/^'|^"/.test(aText)) aText = aText.slice(1)
            let bText = b.firstElementChild.firstElementChild.children[1].innerText.toLowerCase()
            if (/^'|^"/.test(aText)) aText = aText.slice(2)
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
    } else {
        let groups = document.getElementsByClassName('folder-details-wrap ng-scope')
        for (let i = 0; i < groups.length; i++) {
            let parent = groups[i].firstElementChild.firstElementChild
            let children = [...parent.children]
            children.sort((a, b) => {
                let aText = a.firstElementChild.firstElementChild.children[1].innerText.toLowerCase()
                if (/^'|^"/.test(aText)) aText = aText.slice(1)
                let bText = b.firstElementChild.firstElementChild.children[1].innerText.toLowerCase()
                if (/^'|^"/.test(aText)) aText = aText.slice(2)
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
}

function expandSearchResults() {
    [...document.getElementsByClassName('btn-view-toggle')].filter(x => {
        if (x.parentElement && x.parentElement.parentElement && x.parentElement.parentElement.parentElement &&
            x.parentElement.parentElement.parentElement.parentElement &&
            x.parentElement.parentElement.parentElement.parentElement.parentElement &&
            /media-item-syndication/.test(x.parentElement.parentElement.parentElement.parentElement.parentElement.className)) {
            return x.parentElement.parentElement.parentElement.parentElement.children[0] === x.parentElement.parentElement.parentElement &&
                x.firstElementChild && x.firstElementChild.className === 'fa fa-chevron-down'
        }
        return x.firstElementChild && x.firstElementChild.className === 'fa fa-chevron-down'
    }).forEach(x => x.click())
}

function createSearchButton() {
    const div = document.createElement('div')
    div.style.paddingTop = '10px'
    const input = document.createElement('input')
    input.className = 'checkbox-custom'
    input.type = 'checkbox'
    div.appendChild(input)
    const label = document.createElement('label')
    label.className = 'checkbox-custom-label'
    label.innerText = 'Expand results'

    label.addEventListener('mousedown', (e) => {
        if (e.target.parentElement.firstElementChild.checked) {
            e.target.parentElement.firstElementChild.checked = false
            document.removeEventListener('scroll', expandSearchResults)
        } else {
            e.target.parentElement.firstElementChild.checked = true
            document.addEventListener('scroll', expandSearchResults)
        }
    })
    div.appendChild(label)
    return div
}

function appendSearchButton() {
    document.getElementsByClassName('control-area clearfix')[0].appendChild(createSearchButton())
}

const removeOutletContactLinks = () => {
    if (listenerOptions[0]) {
        let links = [...document.querySelectorAll('a')].filter(link => /app\.mediaportal\.com\/#\/connect\/media-contact/.test(link.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(link.href))
        links.map(link => link.href = '')
    }
}

function func() {
    removeOutletContactLinks()
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

function updatePlatformButtonText(id, newText) {
    if (!document.getElementById(id)) {
        console.log(id, newText, document.getElementById(id))
        return
    }
    const originalText = document.getElementById(id).innerText

    !newText ? document.getElementById(id).innerText = 'Tool running...' :
        document.getElementById(id).innerText = newText

    setTimeout(() => document.getElementById(id).innerText = originalText, 2000)
}

function getPossibleSyndications() {
    let headlineObj = {}
    let bylineObj = {}
    let syndColors = ['red', 'yellow', 'darkgreen', 'purple', 'blue', 'pink', 'black', 'brown', 'Aquamarine', 'Orange', 'LightBlue', 'Teal', '#DAA520', 'seagreen', 'mediumspringgreen', 'lime', 'indigo', 'tan']
    let colorCount = 0
    updatePlatformButtonText('syndHighlightBtn')
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
            let byline = bylines[i].innerText.split(' , ').filter(item => item.startsWith('By')).join('').replace(/<span style='background-color:#DAA520'>|<\/span>|p[0-9]{1,2}/g, '').slice(3)
                .replace(/[^A-Za-z ]/, '').toLowerCase().replace(/ and /gi, '').replace(/ /g, '')
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
                bylineParent.setAttribute('style', `border-color: ${syndColors[colorCount]} !important; border-width: 3px;`)
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
                        headlineParentAlt.setAttribute('style', `border-color: ${color} !important; border-width: 3px;`)
                    }
                    if (colorCount - 1 < 0) colorCount = syndColors.length - 1
                    else colorCount--
                    break
                } else {
                    headlineParent.setAttribute('style', `border-color: ${syndColors[colorCount]} !important; border-width: 3px;`)
                    headlineParent.className += 'syndication-tagged'
                }
            }
            if (colorCount + 1 === syndColors.length) colorCount = 0
            else colorCount++
        }
        updatePlatformButtonText('syndHighlightBtn', 'Syndications highlighted!')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('syndHighlightBtn', 'Error encountered running tool')
    }
}

function fixBylines() {
    const bylineValues = ['for daily mail', 'for mailonline', 'political editor', 'education editor', 'and', 'editorial', 'alice man', 'editorial', 'aged care guru']
    updatePlatformButtonText('bylineFixBtn')
    try {

        expandSectionHeadings()

        let bylines = [...document.getElementsByClassName('flex flex-1 author mp-page-ellipsis')]
            .filter(item =>
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild &&
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-video' &&
                item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-volume-up')
            .filter(item => {
                let byline = item.innerText.split(' , ').filter(item => item.startsWith('By')).join('').slice(3)
                return byline.length > 0 && (bylineValues.includes(byline.toLowerCase()) || byline.toUpperCase() === byline || /.* Mc[a-z]|.* Mac[a-z]/.test(byline) || byline === 'DANIEL McCULLOCH' ||
                    /^by /i.test(byline))
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
                byline.value = byline.value.replace(/Mc([a-z])|Mac([a-z])/, function (match, p1, p2) {
                    if (p1) return 'Mc' + p1.toUpperCase()
                    else return 'Mac' + p2.toUpperCase()
                }).trimEnd()
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

        expandSectionHeadings()

        let headlines = [...document.querySelectorAll('mat-expansion-panel')]
            .filter(item => item.className.search('standardMode') > -1 &&
            item.firstElementChild.firstElementChild.firstElementChild.children[1].children[1].children[2].firstElementChild &&
            (item.firstElementChild.firstElementChild.firstElementChild.children[1].children[1].children[2].firstElementChild.className === 'mat-icon fa fa-cloud mat-icon-no-color ng-star-inserted') &&
            /&#x27;/.test(item.children[0].children[0].children[0].children[0].innerText))

        headlines.forEach(item => {
            item.firstElementChild.click()
            let headline = item.children[1].firstElementChild.firstElementChild.firstElementChild.children[0].firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild
            headline.value = headline.value.replace(/&#x27;/g, '\'')

            var textfieldUpdated = new Event('input', {
                bubbles: true,
                cancelable: true,
            })

            headline.dispatchEvent(textfieldUpdated)
        })

        let openedItems = [...document.querySelectorAll('mat-expansion-panel')]
            .filter(item =>
                item.className.search('standardMode') > -1 &&
                item.className.search('mat-expanded') > -1)

        openedItems.forEach(item => {
            item.firstElementChild.firstElementChild.firstElementChild.firstElementChild.click()
            item.parentElement.parentElement.firstElementChild.children[1].click()
        })

        updatePlatformButtonText('bylineFixBtn', 'Bylines fixed!')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('bylineFixBtn', 'Error encountered running tool')
    }

}

function highlightBylineErrors() {
    updatePlatformButtonText('bylineHighlightBtn')
    expandSectionHeadings()
    try {
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
            let p = document.createElement('p')
            p.style.textAlign = 'right'
            p.style.paddingRight = '10px'
            p.style.paddingTop = '5px'
            p.style.fontSize = '13px'
            p.style.color = 'white'
            p.innerHTML = '<span style=\'background-color:#DAA520;\'>' + 'Possible byline error' + '</span>'

            byline.appendChild(p)
        })
        updatePlatformButtonText('bylineHighlightBtn', 'Bylines highlighted!')
    } catch (error) {
        console.error(error)

        updatePlatformButtonText('bylineHighlightBtn', 'Error encountered running tool')
    }

}

function filterObj(obj) {
    return Object.keys(obj)
        .filter(key => obj[key].length > 1)
        .reduce((res, key) => (res[key] = obj[key], res), {})
}

function fixPressSyndications() {
    updatePlatformButtonText('fixPressBtn')
    try {

        expandSectionHeadings()
        let items = [...document.querySelectorAll('mat-expansion-panel')]
            .filter(item => item.className.search('standardMode') > -1 &&
                item.firstElementChild.firstElementChild.firstElementChild.children[1].children[1].children[2].firstElementChild &&
                (item.firstElementChild.firstElementChild.firstElementChild.children[1].children[1].children[2].firstElementChild.className === 'mat-icon fa fa-cloud mat-icon-no-color ng-star-inserted' ||
                    (/^Age|^The Saturday Age|^Sunday Age/).test(item.firstElementChild.firstElementChild.firstElementChild.children[1].innerText)))

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

        updatePlatformButtonText('fixPressBtn', 'Press syndications fixed!')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('fixPressBtn', 'Error encountered running tool')
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

    updatePlatformButtonText('highlightBroadcastBtn')

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

        updatePlatformButtonText('highlightBroadcastBtn', 'Broadcast highlighted!')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('highlightBroadcastBtn', 'Error encountered running tool')
    }

}

function getIndustrySyndNotesGrouped () {
    updatePlatformButtonText('groupedIndSynd')
    const selectedItems = document.getElementsByClassName('isSelected')
    if (selectedItems.length !== 1) {
        updatePlatformButtonText('groupedIndSynd', 'Too many items selected')
        return
    }

    try {
        let childrenCount = selectedItems[0].children[1].children[0].children[1].children[0].children[0].children[0].children[3].children[1].children[2].children[2].childElementCount
        let syndNotes = []
        for (let i = 0; i < childrenCount; i++) {
            [...document.getElementsByClassName('showLessMore ng-star-inserted')].forEach(x => x.click())

            document.getElementsByClassName('isSelected')[0].children[1].children[0].children[1].children[0].children[0].children[0].children[3]
                .children[1].children[2].children[2].children[i].children[0].children[2].children[0].children[1].firstElementChild.click()
            let currentSelectedItem = document.getElementsByClassName('isSelected')[0].children[1].children[0].children[1].children[0].children[0].children[0]
            let headline = currentSelectedItem?.children[2].innerText.split('\n')[0].toUpperCase()
            let sectionName = currentSelectedItem.children[3].children[1].children[0].innerText.split('\n').filter(row => row.startsWith('Program:'))[0].slice(8)
            if (sectionName === 'Other') {
                syndNotes.push(`${headline}, ${sectionName}`)
            } else {
                document.getElementsByClassName('isSelected')[0].children[1].children[0].children[0].click()
                let metadata = document.getElementsByClassName('isSelected')[0].children[1].children[0].children[0].children[0].children[0].children[1].children[0].innerText.split(', ')
                let pageNumber = metadata[metadata.length -1]
                document.getElementsByClassName('isSelected')[0].children[1].children[0].children[0].click()
                syndNotes.push(`${headline}, ${sectionName}, ${pageNumber}`)
            }
            document.getElementsByClassName('isSelected')[0].children[1].children[0].children[1].children[0].children[0].children[0].children[3]
                .children[1].children[2].children[2].children[i].children[0].children[2].children[0].children[1].firstElementChild.click()
        }
        if (syndNotes.length === 0) return
        let combinedSyndNotes
        if (syndNotes.length === 1) {
            combinedSyndNotes = syndNotes[0]
        } else if (syndNotes.length === 2) {
            combinedSyndNotes = syndNotes.join(', ')
        } else {
            combinedSyndNotes = `${syndNotes.slice(0, syndNotes.length-1).join(', ')} and ${syndNotes[syndNotes.length-1]}`
        }
        chrome.runtime.sendMessage({
            action: 'copyIndSyndNote',
            syndNotes: combinedSyndNotes,
        })
        updatePlatformButtonText('groupedIndSynd', 'Synd note copied')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('groupedIndSynd', 'Error encountered running tool')
    }

}

function getIndustrySyndNotesUngrouped() {
    updatePlatformButtonText('ungroupedIndSynd')
    try {
        expandSectionHeadings()

        const selectedItems = [...document.getElementsByClassName('isSelected')]
        let syndNotes = []
        selectedItems.forEach(item => {
            let metadata = item.children[1].children[0].children[0].children[0].children[0].children[1].innerText.split('\n\n')[0].split(' , ')
            if (metadata[1] === 'Other') syndNotes.push(`${metadata[0].toUpperCase()}, Online, ${metadata[metadata.length -1]}`)
            else syndNotes.push(`${metadata[0].toUpperCase()}, ${metadata[1]}, ${metadata[metadata.length -1]}`)
        })
        if (syndNotes.length === 0) return
        let combinedSyndNotes
        if (syndNotes.length === 1) {
            combinedSyndNotes = syndNotes[0]
        } else if (syndNotes.length === 2) {
            combinedSyndNotes = syndNotes.join(', ')
        } else {
            combinedSyndNotes = `${syndNotes.slice(0, syndNotes.length-1).join(', ')} and ${syndNotes[syndNotes.length-1]}`
        }
        chrome.runtime.sendMessage({
            action: 'copyIndSyndNote',
            syndNotes: combinedSyndNotes,
        })
        updatePlatformButtonText('ungroupedIndSynd', 'Synd note copied')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('ungroupedIndSynd', 'Error encountered running tool')
    }

}

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
        let checkLength = itemContentWords.length

        innerLoop: for (let j = 0; j < itemContentWords.length; j++) {

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
                if (skipDecapping.includes(word) || word === 'I' || word === 'A') continue innerLoop // Bad matches, can end the loop for this word here
                else if (properNouns.includes(toSentenceCase(word)) && j < 4) {
                    itemContentWords[j] = `<span style='background-color:#00FF00;'>${itemContentWords[j]}</span>`
                } else {
                    itemContentWords[j] = `<span style='background-color:#FDFF47;'>${itemContentWords[j]}</span>`
                }
            } else if (j > 0 && j < 5 && (word === 'The' || word === 'A')) {
                itemContentWords[j] = `<span style='background-color:#8A2BE2;'>${itemContentWords[j]}</span>` // Possible subheading
            } else if (word === word.toLowerCase()) {
                if ((properNouns.includes(toSentenceCase(word)) || skipDecapping.includes(word.toUpperCase()) || word === 'scomo') && j < 4) {
                    itemContentWords[j] = `<span style='background-color:#00FF00;'>${itemContentWords[j]}</span>`
                }
            }

            if ((/[.!?]["']{0,1}(?:\s|$)/).test(itemContentWords[j]) && j > 5) {
                checkLength = Math.min(j + 4, checkLength)
            } else if (j === checkLength) finalCheck = true
        }

        itemSummaries[i].firstElementChild.firstElementChild.innerHTML = itemContentWords.join(' ')
    }
}

const toSentenceCase = (word) => word.split('').map((letter, index) => {
    if (index === 0) return letter.toUpperCase()
    else if ((word[0] === '"' || word[0] === '\'') && index === 1) return letter.toUpperCase()
    else return letter.toLowerCase()
}).join('')


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
        (!lastHighlightedElement.parentElement.nodeName === 'MARK' && !lastHighlightedElement.parentElement.parentElement.parentElement.className === 'readmore shown')) return

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

    let archivedContent = await getArchivedContent()
    if (!archivedContent[currentPortal]) archivedContent[currentPortal] = []

    let itemIDs = [...document.getElementsByClassName('media-item-checkbox')].filter(x => x.parentElement && x.checked).map(x => {
        try {
            if (x.parentElement.parentElement.childElementCount > 1) {
                let itemBlock = [...x.parentElement.parentElement.children[1].children].filter(x => x.className === 'media-item-data-block')
                return itemBlock[0].firstElementChild.children[1].children[0].innerText.slice(9)
            } else return 'N/A'
        } catch (error) {
            return 'N/A'
        }
    })
    const selectedItems = [...document.getElementsByClassName('media-item-checkbox')].filter(x => x.parentElement && x.checked).map((x, ind) => {
        const outletName = x.parentElement.children[3].firstElementChild.firstElementChild.firstElementChild
            .innerText.trimEnd().replace(/ \(page [0-9]{1,}\)/, '').replace(/at [0-9]{2}:[0-9]{2}$/, 'at')
        let headline
        if (x.parentElement.parentElement.parentElement.parentElement.className.startsWith('media-item-syndication')) {
            headline = x.parentElement.parentElement.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)
        } else headline = x.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)
        headline = headline.replace(/’|‘/g, '\'')
        if (archivedContent[currentPortal].includes(`${headline} ||| ${outletName}`)) itemIDs[ind] = null

        return `${headline} ||| ${outletName}`
    }).filter(x => !archivedContent[currentPortal].includes(x))
    itemIDs = itemIDs.filter(x => x)
    const archiveDate = new Date().toString()
    const groupOption = document.getElementsByClassName('content-options').length > 1 ? document.getElementsByClassName('content-options')[0].innerText.trimEnd() : 'N/A'
    const sortOption = document.getElementsByClassName('content-options').length > 1 ?
        document.getElementsByClassName('content-options')[1].innerText.trimEnd() :
        document.getElementsByClassName('content-options')[0].innerText.trimEnd()
    const groupings = [...document.getElementsByClassName('media-group ng-scope')].map(x => x.innerText.split('\n').slice(0, 2).join(' with ').trimStart().trimEnd()).join(', ')
    const tabs = await getMPTabs()

    let selectedFolders = [...document.getElementsByClassName('checkbox-custom')]
        .filter(x => /^Brands|^Competitors|^Personal|^Release Coverage|^Spokespeople/
            .test(x.id) && x.checked).map(x => x.parentElement.children[1].innerText.trimStart()
        )
    if (selectedFolders.length === 0) return
    selectedFolders = selectedFolders.join(', ')

    let detailedArchiveContent = await getDetailedArchivedContent()
    if (!detailedArchiveContent[currentPortal]) detailedArchiveContent[currentPortal] = {}

    archivedContent[currentPortal].push(selectedItems)
    archivedContent[currentPortal] = archivedContent[currentPortal].flat()

    selectedItems.forEach((item, ind) => {
        let detailedInfo = [archiveDate, groupOption, sortOption, groupings, tabs, itemIDs[ind], selectedFolders]
        if (!detailedArchiveContent[currentPortal][item]) detailedArchiveContent[currentPortal][item] = detailedInfo
    })
    lastAddedContent = [window.location.href.toString(), selectedItems]

    chrome.storage.local.set({ archivedContent: archivedContent }, function () {
    })

    chrome.storage.local.set({ detailedArchiveContent: detailedArchiveContent }, function () {
    })

}

async function removeArchivedContent() {
    let selectedItems = [...document.getElementsByClassName('media-item-checkbox')].filter(x => x.parentElement && x.checked).map(x => {
        const outletName = x.parentElement.children[3].firstElementChild.firstElementChild.firstElementChild
            .innerText.trimEnd().replace(/ \(page [0-9]{1,}\)/, '').replace(/at [0-9]{2}:[0-9]{2}$/, 'at')
        let headline
        if (x.parentElement.parentElement.parentElement.parentElement.className.startsWith('media-item-syndication')) {
            headline = x.parentElement.parentElement.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)
        } else headline = x.parentElement.parentElement.parentElement.children[0].children[1].innerText.slice(0, 90)
        headline = headline.replace(/’|‘/g, '\'')
        return `${headline} ||| ${outletName}`
    })
    let archivedContent = await getArchivedContent()

    if (lastAddedContent[0] === window.location.href.toString()) {
        selectedItems = selectedItems.filter(x => !lastAddedContent[1].includes(x))
    }

    if (!archivedContent[currentPortal]) archivedContent[currentPortal] = []
    archivedContent[currentPortal] = archivedContent[currentPortal].filter(x => !selectedItems.includes(x))

    chrome.storage.local.set({ archivedContent: archivedContent }, function () {
    })
}

async function checkAddedContent() {
    let RPItems = [...document.getElementsByClassName('media-item media-item-compact')].map(x => {
        const outletName = x.children[1].firstElementChild.children[3].firstElementChild.innerText.trimEnd().replace(/ \(page [0-9]{1,}\)/, '').replace(/at [0-9]{2}:[0-9]{2}$/, 'at')
        const headline = x.firstElementChild.children[1].innerText.slice(0, 90).replace(/’|‘/g, '\'')
        return `${headline} ||| ${outletName}`
    })
    console.log(RPItems)
    let archivedContent = await getArchivedContent()
    console.log(archivedContent)

    if (archivedContent[currentPortal]) {
        let missingItems = [...new Set(archivedContent[currentPortal])].filter(x => RPItems.indexOf(x) === -1)
        if (missingItems.length > 0) {
            chrome.runtime.sendMessage({
                action: 'createWindow',
                url: 'missingContent.html',
                missingItems: missingItems,
                currentPortal: currentPortal
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
    button.addEventListener('mousedown', clickMerge)
    let secondButton = document.createElement('BUTTON')
    secondButton.innerText = 'DELETE ITEMS'
    secondButton.style.marginLeft = '15px'
    secondButton.className = 'mat-stroked-button mat-primary _mat-animation-noopable'
    secondButton.addEventListener('mousedown', clickDelete)
    parentEle.appendChild(button)
    parentEle.appendChild(secondButton)
}

function clickMerge() {
    if (document.getElementsByClassName('mergeButton mat-button mat-primary _mat-animation-noopable ng-star-inserted').length > 0) {
        document.getElementsByClassName('mergeButton mat-button mat-primary _mat-animation-noopable ng-star-inserted')[0].firstElementChild.click()
    }
}

function clickDelete() {
    if (document.getElementsByClassName('deleteButton mat-button mat-primary _mat-animation-noopable').length > 0) {
        document.getElementsByClassName('deleteButton mat-button mat-primary _mat-animation-noopable')[0].firstElementChild.click()
    }
}

async function createDBPlatformButtons() {

    fixSidebarProperties()

    let sidebarSettings = await getSidebarSetting()

    let para = document.createElement('P')
    para.innerText = 'NB: Before using any of these, scroll to the bottom of the report and ensure all items have loaded in.'

    let label = document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[1].firstElementChild.cloneNode()
    label.innerText = 'PLUGIN'
    label.style.display = 'flex'
    label.style.justifyContent = 'space-between'

    let arrow = document.createElement('SPAN')
    arrow.className = 'mat-expansion-indicator'
    arrow.style.transform = 'rotate(0deg)'

    let div = document.createElement('DIV')
    div.className = 'flex flex-1 flex-direction-column mp-form-fieldset'
    div.style.padding = '10px'
    div.appendChild(label)
    div.appendChild(para)

    arrow.addEventListener('click', () => toggleSidebar(arrow, div, 'PluginButtons'))
    label.appendChild(arrow)
    let buttons = [['Highlight syndications', getPossibleSyndications, 'syndHighlightBtn'], ['Highlight broadcast for recapping', highlightBroadcastItems, 'highlightBroadcastBtn'],
        ['Highlight byline errors', highlightBylineErrors, 'bylineHighlightBtn'], ['Fix bylines', fixBylines, 'bylineFixBtn'], ['Fix print syndications', fixPressSyndications, 'fixPressBtn']]

    for (let i = 0; i < buttons.length; i++) {
        div.appendChild(createFeatureButton(buttons[i][0], buttons[i][1], buttons[i][2]))
    }

    if (currentPortal === 'dailybriefings_innovation' || currentPortal === 'training_innovation2') {
        let indSpecificButtons = [['Create synd note - grouped', getIndustrySyndNotesGrouped, 'groupedIndSynd'], ['Create synd note - ungrouped', getIndustrySyndNotesUngrouped, 'ungroupedIndSynd']]

        for (let i = 0; i < indSpecificButtons.length; i++) {
            div.appendChild(createFeatureButton(indSpecificButtons[i][0], indSpecificButtons[i][1], indSpecificButtons[i][2]))
        }
    }

    [...div.children].forEach((el, ind) => {
        if (ind === 0) return
        el.style.display = sidebarSettings['PluginButtons'] ? '' : 'none'
    })

    document.getElementsByClassName('mp-page-inner-tools mp-form')[0].appendChild(div)

    let paraStatic = document.createElement('P')
    paraStatic.innerText = 'Copy preset text to your clipboard by clicking the icon next to relevant field.\
    \nYou can set the text that appears here in the extension options or by clicking save below.\
    \n You can also set hotkeys in the options for these as well. '

    let labelStatic = document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[1].firstElementChild.cloneNode()
    labelStatic.innerText = 'PRESET TEXT'
    labelStatic.style.display = 'flex'
    labelStatic.style.justifyContent = 'space-between'


    let divStatic = document.createElement('DIV')
    divStatic.className = 'flex flex-1 flex-direction-column mp-form-fieldset'
    divStatic.style.padding = '10px'
    divStatic.appendChild(labelStatic)
    divStatic.appendChild(paraStatic)

    let staticText = await getStaticText()
    staticText.forEach(item => createStaticTextField(item, divStatic))
    let staticSaveBtn = createFeatureButton('Save', saveStaticText, 'saveStaticTextBtn')
    staticSaveBtn.style.marginTop = '5px'
    divStatic.appendChild(staticSaveBtn)

    let arrowStatic = document.createElement('SPAN')
    arrowStatic.className = 'mat-expansion-indicator'
    arrowStatic.style.transform = 'rotate(0deg)'
    arrowStatic.addEventListener('click', () => toggleSidebar(arrowStatic, divStatic, 'PresetText'))
    labelStatic.appendChild(arrowStatic)

    let staticChildren = [...divStatic.children]

    staticChildren.forEach((el, ind) => {
        if (ind === 0) return
        el.style.display = sidebarSettings['PresetText'] ? '' : 'none'
    })

    document.getElementsByClassName('mp-page-inner-tools mp-form')[0].appendChild(divStatic)
}

function fixSidebarProperties() {

    const sidebarParent = document.getElementsByClassName('side-tools ng-star-inserted')[0]

    sidebarParent.style.width = '100%'
    sidebarParent.style.height = '100%'
    sidebarParent.style.overflow = 'hidden'

    const sidebarChild = document.getElementsByClassName('mp-page-inner-tools mp-form')[0]

    sidebarChild.style.overflowX = 'hidden'
    sidebarChild.style.overflowY = 'scroll'
    sidebarChild.style.position = 'absolute'
    sidebarChild.style.width = '94%'
    sidebarChild.style.height = '100%'
    sidebarChild.style.paddingRight = '17px'
    sidebarChild.style.boxSizing = 'content-box'
}

async function toggleSidebar(source, element, label) {
    let setting = await getSidebarSetting()

    source.style.transform = source.style.transform === 'rotate(0deg)' ? 'rotate(180deg)' : 'rotate(0deg)'

    let visibilitySetting = setting[label] ? 'none' : ''

    let children = [...element.children]
    children.forEach((el, ind) => {
        if (ind === 0) return

        el.style.display = visibilitySetting
    })

    setting[label] = !setting[label]

    chrome.storage.local.set({ sidebarSetting: setting }, function () {
    })
}

function createFeatureButton(innerText, onClickFunc, id) {
    let btn = document.createElement('button')

    btn.setAttribute('style', 'font-size: 14px !important;')
    btn.className = 'mp-page-thin-button addButton mat-stroked-button mat-primary _mat-animation-noopable'
    btn.id = id
    btn.style.marginTop = '10px'

    btn.innerText = innerText
    btn.addEventListener('click', onClickFunc)
    return btn
}

function createStaticTextField(text, parentDiv) {
    let div = document.createElement('DIV')
    div.className = 'flex flex-1 flex-direction-row ng-pristine ng-valid ng-touched'
    div.style.paddingBottom = '7px'
    let input = document.createElement('input')
    input.className = 'link-name mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-pristine ng-valid ng-touched static-text-field'
    input.value = text
    input.setAttribute('style', 'padding: 5px !important;')
    div.appendChild(input)

    let span = document.createElement('SPAN')
    span.className = 'copy-icon mat-icon fa fa-clipboard mat-icon-no-color'
    span.setAttribute('style', 'color: rgb(47, 164, 250) !important; line-height: 25px !important; padding-left: 10px')
    span.addEventListener('mousedown', copyStaticText)
    div.appendChild(span)
    parentDiv.appendChild(div)
}

function saveStaticText() {
    const staticTextVals = [...document.getElementsByClassName('static-text-field')].map(item => item.value)
    chrome.storage.local.set({ staticText: staticTextVals }, function () {
    })
    document.getElementById('saveStaticTextBtn').innerText = 'Saved!'
    setTimeout(() => document.getElementById('saveStaticTextBtn').innerText = 'Save', 1000)
}

function copyStaticText(event) {
    let value = event.target.parentElement.firstElementChild.value
    if (event.button !== 0 || value === '') return

    chrome.runtime.sendMessage({
        action: 'copyStaticText',
        text: value
    })
    let text = value
    event.target.parentElement.firstElementChild.value = 'Copied!'
    setTimeout(() => event.target.parentElement.firstElementChild.value = text, 1000)
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
            chrome.storage.local.get({ currentPortalIncog: null }, function (data) {
                options(data.currentPortalIncog)
            })
        })
    } else {
        return new Promise(options => {
            chrome.storage.local.get({ currentPortalRegular: null }, function (data) {
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

function getMPTabs() {
    return new Promise(response => {
        chrome.runtime.sendMessage({
            action: 'logTabs',
            incog: chrome.extension.inIncognitoContext
        }, function (tabs) {
            response(tabs.tabs)
        })
    })
}

function getDetailedArchivedContent() {
    return new Promise(options => {
        chrome.storage.local.get({ detailedArchiveContent: {} }, function (data) {
            options(data.detailedArchiveContent)
        })
    })
}

function getStaticText() {
    return new Promise(options => {
        chrome.storage.local.get({ staticText: defaultStaticTextArr }, function (data) {
            options(data.staticText)
        })
    })
}

function getSidebarSetting() {
    return new Promise(options => {
        chrome.storage.local.get({ sidebarSetting: { 'PluginButtons': true, 'PresetText': true } }, function (data) {
            options(data.sidebarSetting)
        })
    })
}
