/*
    ========================
    |   Global variables   |
    ========================
*/

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
let coverageOptions = { contactLinks: true, automatedBroadcast: true, repeatedItems: true, largerAddToFolder: true, outletsToIgnore: true }
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
const outletsToIgnore = ['The National Tribune', 'Morningstar', 'Mirage News', 'Listcorp', 'Australian Online News', 'industry.gov.au', 'WEB MSN Australia', 'Commercial Real Estate', 'Premier of Tasmania', 'Media Releases']

/*
    ===============================
    |   Chrome runtime listener   |
    ===============================
*/

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

/*
    ===================================================================
    |                     Mastermind functions                        |
    |                                                                 |
    |   These event listeners set up the other functions to run       |
    |   either when the page loads or when the user left clicks       |
    |                                                                 |
    |   The entire plugin effectively runs from these two functions   |
    |                                                                 |
    ===================================================================
*/

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

    if (coverageOptions.largerAddToFolder) {
        document.addEventListener('click', () => {
            if (document.getElementsByClassName('modal-body standard-height-with-scroll ng-scope').length === 1) {
                const addToFolderPopUp = document.getElementsByClassName('modal-body standard-height-with-scroll ng-scope')[0]
                addToFolderPopUp.style.maxHeight = '75vh'
                addToFolderPopUp.style.minHeight = '445px'
                addToFolderPopUp.style.overflow = 'scroll'
                addToFolderPopUp.className = addToFolderPopUp.className.replace('standard-height-with-scroll', '')
            }
        })
    }

    console.log(currentPortal)

    if (window.location.toString() !== 'https://app.mediaportal.com/dailybriefings/#/briefings' && window.location.toString() !== 'https://app.mediaportal.com/#/report-builder/view') {
        document.addEventListener('scroll', improveMPCoveragePage)
        document.addEventListener('keydown', (e) => {
            const addButton = [...document.getElementsByClassName('btn btn-primary')].filter(btn => btn.innerText === 'Add' && btn.className === 'btn btn-primary' && btn?.parentElement.className === 'modal-footer ng-scope')[0]
            const cancelButton = [...document.getElementsByClassName('btn btn-default')].filter(btn => btn.innerText === 'Cancel' && btn.className === 'btn btn-default' && btn?.parentElement.className === 'modal-footer ng-scope')[0]
            const deselectButton = document.getElementsByClassName('btn-close')[0]
            if (addButton && cancelButton && (e.key === 'Enter' || e.key === '`' && !e.altKey)) {
                archiveSelectedContent()
                addButton.click()
                cancelButton.click()
            } else if (deselectButton && e.key === '`' && e.altKey || e.key === '/') deselectButton.click()
        })
    }

    if (document.getElementsByClassName('coverage-jump-trigger ng-binding').length > 0) {
        document.title = document.getElementsByClassName('coverage-jump-trigger ng-binding')[0].innerText.trimEnd()
        waitForMP('sorting dropdown', addHeadlineSortOptions)
        waitForMP('media-item-header', improveMPCoveragePage)
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
        document.addEventListener('scroll', improveMPCoveragePage)
        document.title = 'Mediaportal Coverage'
        seenIDs = []
    } else if (e.target.href === 'https://app.mediaportal.com/#/report-builder/view' || (e.target.parentElement && e.target.parentElement.href === 'https://app.mediaportal.com/#/report-builder/view')) {
        document.removeEventListener('scroll', improveMPCoveragePage)
        document.title = 'Report Builder'
        setTimeout(() => {
            if (document.getElementsByClassName('dropdown-display').length > 0 && document.getElementsByClassName('dropdown-display')[0].innerText === ' Excel') {
                createRPButton()
            }
        }, 2000)
    } else if (e.target.id === 'btnLogin' || e.target.className === 'css-17cjdhj' || e.target.className === 'css-1uaqxbn') {
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
        const userName = document.getElementById('formField-0') ? document.getElementById('formField-0') : document.getElementById('txtUsername')
        if (chrome.extension.inIncognitoContext) {
            chrome.storage.local.set({ currentPortalIncog: userName.value.toLowerCase() }, function () {
            })
        } else {
            chrome.storage.local.set({ currentPortalRegular: userName.value.toLowerCase() }, function () {
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
    if (e.target?.className === 'mp-page-thin-button mat-stroked-button mat-primary _mat-animation-noopable ng-star-inserted' && e.target?.parentElement?.className === 'flex flex-direction-row links') {
        const readMoreOption = await getReadMoreCopyOption()
        if (readMoreOption) createRPCopyButtons(e.target.parentElement)
    } else if (e.target?.className === 'mat-button-wrapper' && e.target?.parentElement?.parentElement?.className === 'flex flex-direction-row links') {
        const readMoreOption = await getReadMoreCopyOption()
        if (readMoreOption) createRPCopyButtons(e.target.parentElement.parentElement)
    } else if (e.target?.className === 'mp-icon fas fa-eye' && e.target?.parentElement?.parentElement?.parentElement?.className === 'flex flex-direction-row links') {
        const readMoreOption = await getReadMoreCopyOption()
        if (readMoreOption) createRPCopyButtons(e.target.parentElement.parentElement.parentElement)
    } else if (e.target.innerText === 'Email' || e.target.className === 'mp-icon fas fa-envelope') {
        try { closeOpenedItems(true) }
        catch (error) { console.error(error) }
        checkBriefing()
    } else if (e.target.innerText === 'Send Report' || e.target.id) {
        remindSua
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

if (window.location.href.toString() === 'https://www.mediaportal.com/' ||
    window.location.href.toString() === 'https://www.mediaportal.com' ||
    window.location.href.toString().startsWith('https://www.mediaportal.com/login.aspx') ||
    window.location.href.toString().startsWith('https://app.mediaportal.com/isentia/#/login')) {
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
            const userName = document.getElementById('formField-0') ? document.getElementById('formField-0') : document.getElementById('txtUsername')
            if (chrome.extension.inIncognitoContext) {
                chrome.storage.local.set({ currentPortalIncog: userName.value.toLowerCase() }, function () {
                })
            } else {
                chrome.storage.local.set({ currentPortalRegular: userName.value.toLowerCase() }, function () {
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

/*
    =======================================
    |   Coverage productivity functions   |
    =======================================
*/

function improveMPCoveragePage() {
    removeOutletContactLinks()
    greyOutAutomatedBroadcast()
}

// function getCoverageItems() {
//     const metadataElements = [...document.getElementsByClassName('media-item-data-block')]
//         .filter(item => {
//             const isSynd = item?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement.className.includes('syndication-group')
//             const rootElement = isSynd ? item.parentElement.parentElement.parentElement.parentElement.parentElement.className.includes('edited') : item.parentElement.parentElement.parentElement.className.includes('edited')
//         })
//         .map(item => {
//             const isSynd = item?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement.className.includes('syndication-group')
//             return {
//                 headline: isSynd ? item.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild.children[1].innerText : item.parentElement.parentElement.parentElement.firstElementChild.children[1].innerText
//             }
//         })
// }

function greyOutAutomatedBroadcast() {
    let items = [...document.getElementsByClassName('list-unstyled media-item-meta-data-list')]
        .filter(item => {
            const isSynd = item.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement.className.includes('media-item-syndication')
            const rootElement = isSynd ? item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement : item.parentElement.parentElement.parentElement.parentElement.parentElement
            return !rootElement.className.includes('edited')
                && item.firstChild && item.firstChild.innerText !== 'Item ID: {{::item.summary_id}}'
        }
        )
    items.forEach(item => {
        const isSynd = item.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement.className.includes('media-item-syndication')
        const rootElement = isSynd ? item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement : item.parentElement.parentElement.parentElement.parentElement.parentElement
        if (rootElement.className.includes('unopened')) {
            item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[4].children[0].click()
            rootElement.className = rootElement.className.replace('unopened', 'edited')
        } else if (coverageOptions.automatedBroadcast && item.firstChild.innerText.startsWith('Item ID: R')) {
            rootElement.style.opacity = '0.5'
            rootElement.className += ' edited'
        } else if (rootElement.firstElementChild.children[1].innerText.startsWith('Program Preview') || rootElement.firstElementChild.children[1].innerText.startsWith('Newspaper Headlines')) {
            rootElement.style.opacity = '0.5'
            rootElement.className += ' edited'
        } else if (coverageOptions.automatedBroadcast && seenIDs.includes(item.firstChild.innerText) && !item.className.includes('master')) {
            rootElement.style.opacity = '0.5'
            rootElement.className += ' edited'
        } else if (coverageOptions.repeatedItems && !item.className.includes('master')) {
            seenIDs.push(item.firstChild.innerText)
            item.className += ' master'
        } else if (!isSynd) {
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
                        item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[4].children[0].className += ' edited'
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
                        item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[4].children[0].className += ' edited'
                    }
                }
            } else {
                reclipObj[key] = [item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement, itemID, sectionName]
            }
        }
        const itemOutlet = item.parentElement?.parentElement?.parentElement?.parentElement?.children[0]?.children[3]?.firstElementChild?.firstElementChild?.firstElementChild.innerText.replace(/ \(page .*\) | \(page .*\)/, '')
        if (coverageOptions.outletsToIgnore && outletsToIgnore.includes(itemOutlet)) {
            rootElement.style.opacity = '0.5'
            rootElement.className += ' edited'
            item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[4].children[0].click()
        } else if (itemOutlet === 'theguardian.com' || itemOutlet === 'The Guardian') {
            const headline = item?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.children[0]?.children[1]?.firstElementChild
            if (headline?.href && (/\/live\//.test(headline.href) || headline.innerText.startsWith('Morning mail'))) {
                rootElement.style.opacity = '0.5'
                rootElement.className += ' edited'
                item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[4].children[0].click()
            }
        }
    })

    if ([...document.getElementsByClassName('mp-icon icon-compact-view')][0]?.parentElement?.className.includes('active')) {
        const items = [...document.getElementsByClassName('media-outlet ng-scope')]
            .filter(item => {
                const isSynd = item?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement.className.includes('media-item-syndication')
                return isSynd ? !item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.className.includes('edited') : !item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.className.includes('edited')
            })
        items.forEach(item => {
            const isSynd = item?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.parentElement.className.includes('media-item-syndication')
            const outletName = item.innerText.replace(/ \(page .*\) | \(page .*\)/, '')
            const headline = isSynd ?
                item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild.children[1].firstElementChild :
                item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.firstElementChild.children[1].firstElementChild
            // console.log(outletName, headline?.href)
            if (outletName === 'theguardian.com' || outletName === 'The Guardian') {
                if (headline?.href && (/\/live\//.test(headline.href) || headline.innerText.startsWith('Morning mail'))) {
                    headline.parentElement.parentElement.parentElement.className += ' unopened'
                    headline.parentElement.parentElement.parentElement.style.opacity = '0.5'
                }
            } else if (outletsToIgnore.includes(outletName)) {
                headline.parentElement.parentElement.parentElement.className += ' unopened'
                headline.parentElement.parentElement.parentElement.style.opacity = '0.5'
            }
        })
        // const items = [...document.getElementsByClassName('btn-view-toggle')].filter(item => !item.className.includes('edited'))
        // items.forEach(item => {
        //     const outletName = item.parentElement.parentElement.children[3].firstElementChild.children[0].innerText
        //     if (outletName === 'theguardian.com') {
        //         const headline = item?.parentElement?.parentElement?.parentElement?.parentElement?.children[0]?.children[1]?.firstElementChild
        //         if (headline && (headline.href.includes('/live/') || headline.innerText.startsWith('Morning mail'))) {
        //             item.parentElement.parentElement.parentElement.parentElement.style.opacity = '0.5'
        //             item.className += ' edited'
        //         }
        //     } else if (outletsToIgnore.includes(outletName)) {
        //         item.parentElement.parentElement.parentElement.parentElement.style.opacity = '0.5'
        //         item.className += ' edited'
        //     }
        // })
    }
}

const removeOutletContactLinks = () => {
    if (coverageOptions.contactLinks) {
        let links = [...document.querySelectorAll('a')].filter(link => /app\.mediaportal\.com\/#\/connect\/media-contact/.test(link.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(link.href))
        links.map(link => link.href = '')
    }
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

/*
    ===================================================
    |   DB Platform Briefing productivity functions   |
    ===================================================
*/

function getPossibleSyndications() {
    let headlineObj = {}
    let bylineObj = {}
    let syndColors = ['red', 'yellow', 'darkgreen', 'purple', 'blue', 'pink', 'black', 'brown', 'Aquamarine', 'Orange', 'LightBlue', 'Teal', '#DAA520', 'seagreen', 'mediumspringgreen', 'lime', 'indigo', 'tan']
    let colorCount = 0
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
                    /^by /i.test(byline) || byline.endsWith(' '))
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
            } else if (byline.value.endsWith(' ')) {
                byline.value = byline.value.trimEnd()
            } else {
                byline.value = byline.value.split(' ').map(word => toSentenceCase(word)).join(' ')
            }

            byline.value = byline.value.replace(/ and /ig, ' and ').trimEnd()

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

        closeOpenedItems()

        updatePlatformButtonText('bylineFixBtn', 'Bylines fixed!')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('bylineFixBtn', 'Error encountered running tool')
    }

}

function highlightBylineErrors() {
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


function fixPressSyndications() {
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

        closeOpenedItems()

        updatePlatformButtonText('fixPressBtn', 'Press syndications fixed!')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('fixPressBtn', 'Error encountered running tool')
    }

}

function expandSectionHeadingsBtn() {
    try {
        expandSectionHeadings()
        updatePlatformButtonText('closeItemsBtn', 'Sections opened/Items closed')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('closeItemsBtn', 'Error encountered running tool')
    }
}


function highlightBroadcastItems() {

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

/*
    ==============================================
    |   DB Platform Briefing helper functions    |
    ==============================================
*/


function expandSectionHeadings() {
    let sectionHeadings = [...document.querySelectorAll('mat-expansion-panel')].filter(item => item.parentElement.nodeName === 'FORM' && item.className.search('mat-expanded') === -1)
    sectionHeadings.forEach(item => item.firstElementChild.firstElementChild.firstElementChild.click())

    closeOpenedItems(true)
}

function closeOpenedItems(skipMarkAsUnread) {
    const briefingSections = [...document.querySelectorAll('mp-report-section')]
        .filter(section => !section.firstElementChild.firstElementChild.className.includes('mat-expanded'))

    briefingSections.forEach(section => section.firstElementChild.firstElementChild.firstElementChild.click())

    let openedItems = [...document.querySelectorAll('mp-mediaitem-card')]
        .filter(item => item.firstElementChild.className.includes('mat-expanded'))
    console.log(openedItems)

    openedItems.forEach(item => {
        item.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.click()
        if (!skipMarkAsUnread) item.parentElement.firstElementChild.children[1].click()
    })
}


function updatePlatformButtonText(id, newText) {
    if (!document.getElementById(id)) {
        console.log(id, newText, document.getElementById(id))
        return
    }
    const originalText = document.getElementById(id).innerText

    document.getElementById(id).innerText = newText

    setTimeout(() => document.getElementById(id).innerText = originalText, 2000)
}

/*
    ==============================================
    |   DB Platform Briefing specific features   |
    ==============================================
*/

function getIndustrySyndNotesGrouped() {
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
                let pageNumber = metadata[metadata.length - 1]
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
            combinedSyndNotes = `${syndNotes.slice(0, syndNotes.length - 1).join(', ')} and ${syndNotes[syndNotes.length - 1]}`
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
    try {
        expandSectionHeadings()

        const selectedItems = [...document.getElementsByClassName('isSelected')]
        let syndNotes = []
        selectedItems.forEach(item => {
            let metadata = item.children[1].children[0].children[0].children[0].children[0].children[1].innerText.split('\n\n')[0].split(' , ')
            if (metadata[1] === 'Other') syndNotes.push(`${metadata[0].toUpperCase()}, Online, ${metadata[metadata.length - 1]}`)
            else syndNotes.push(`${metadata[0].toUpperCase()}, ${metadata[1]}, ${metadata[metadata.length - 1]}`)
        })
        if (syndNotes.length === 0) return
        let combinedSyndNotes
        if (syndNotes.length === 1) {
            combinedSyndNotes = syndNotes[0]
        } else if (syndNotes.length === 2) {
            combinedSyndNotes = syndNotes.join(', ')
        } else {
            combinedSyndNotes = `${syndNotes.slice(0, syndNotes.length - 1).join(', ')} and ${syndNotes[syndNotes.length - 1]}`
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

function fixDHSAFRItems() {
    try {
        expandSectionHeadings()
        const headlines = [...document.body.getElementsByClassName('headline mp-page-ellipsis headerRow')]
            .filter(headline => (headline.parentElement.children[1].children[0].innerText.startsWith('Australian Financial Review') || headline.parentElement.children[1].children[0].innerText.startsWith('AFR Weekend'))
                && (/p[0-9]{1,2}$/).test(headline.parentElement.children[1].children[0].innerText))
        console.log(headlines)
        headlines.forEach(headline => {
            headline.click()
            const headlineField = headline?.parentElement?.parentElement?.parentElement?.parentElement?.children[1]?.firstElementChild?.firstElementChild?.firstElementChild?.children[0]?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild
            if (!headlineField) return
            headlineField.value = headlineField.value += ' (Subscription only)'
            console.log(headlineField.value)
            var textfieldUpdated = new Event('input', {
                bubbles: true,
                cancelable: true,
            })

            headlineField.dispatchEvent(textfieldUpdated)
        })

        closeOpenedItems()
        updatePlatformButtonText('dhsAFR', 'AFR headlines fixed')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('dhsAFR', 'Error encounteredrunning tool')
    }
}

function appendColesIDs() {
    try {
        expandSectionHeadings()

        const headlines = [...document.body.getElementsByClassName('headline mp-page-ellipsis headerRow')]
        headlines.forEach(headline => {
            console.log(headline.innerText)
            const mediaType = headline.parentElement.children[1].children[1].children[2].firstElementChild
            const childrenCount = (mediaType.classList[2] === ('fa-video') || mediaType.classList[2] === ('fa-volume-up')) ? 0 : 1
            headline.click()
            const bylineField = headline?.parentElement?.parentElement?.parentElement?.parentElement?.children[1]?.firstElementChild?.firstElementChild?.firstElementChild?.children[0 + childrenCount]?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild
            const itemID = headline?.parentElement?.parentElement?.parentElement?.parentElement?.children[1]?.firstElementChild?.firstElementChild?.firstElementChild?.children[2 + childrenCount]?.children[1]?.children[0]?.children[1]?.innerText?.slice(11)
            if (!bylineField || !itemID) return

            if (!bylineField.value.includes(' ID:')) bylineField.value += `, ID: ${itemID}`
            var textfieldUpdated = new Event('input', {
                bubbles: true,
                cancelable: true,
            })

            bylineField.dispatchEvent(textfieldUpdated)
        })
        closeOpenedItems()
        updatePlatformButtonText('colesIDs', 'IDs appended')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('colesIDs', 'Error encounteredrunning tool')
    }
}

function appendHAOnlineItems() {
    try {
        expandSectionHeadings()
        const headlines = [...document.body.getElementsByClassName('headline mp-page-ellipsis headerRow')]
            .filter(headline => headline?.parentElement?.children[1]?.children[1]?.children[2]?.firstElementChild?.className.includes('fa-cloud'))
        console.log(headlines)
        headlines.forEach(headline => {
            try {
                headline.click()
                const headlineField = headline?.parentElement?.parentElement?.parentElement?.parentElement?.children[1]?.firstElementChild?.firstElementChild?.firstElementChild?.children[0]?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild
                if (!headlineField) return
                headlineField.value = headlineField.value += ' - ONLINE ONLY'
                console.log(headlineField.value)
                var textfieldUpdated = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                })
                headlineField.dispatchEvent(textfieldUpdated)
            } catch (error) {
                return
            }

        })

        closeOpenedItems()
        updatePlatformButtonText('haOnline', 'Online headlines adjusted')
    } catch (error) {
        console.error(error)
        updatePlatformButtonText('haOnline', 'Error encountered running tool')
    }
}

/*
    ====================================
    |   DB Platform Preview checking   |
    ====================================
*/

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
        let splitByline = byline[3].split(' ').filter(byline => byline.length > 0)
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
    if (document.getElementsByClassName('hide-on-mobile').length > 0) {
        createPlainTextButton()
        createWordDocButton()
    }
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

/*
    ====================================
    |   Plain Text Preview generator   |
    ===================================
*/

function createPlainTextButton() {
    const button = document.createElement('button')
    button.innerText = 'Create Plain Text version'
    button.style.position = 'absolute'
    button.style.top = '0'
    button.style.left = '0'
    button.addEventListener('click', () => createPlainTextPreview('plainText.html'))
    document.querySelector('body').appendChild(button)
}

function createWordDocButton() {
    const button = document.createElement('button')
    button.innerText = 'Create Word Doc version'
    button.style.position = 'absolute'
    button.style.top = '20px'
    button.style.left = '0'
    button.addEventListener('click', () => createPlainTextPreview('wordDoc.html'))
    document.querySelector('body').appendChild(button)
}

function createPlainTextPreview(url) {
    const briefingData = {
        briefingImage: document.querySelectorAll('img')[1].src,
        title: document.getElementsByClassName('mj-hero-content')[0] ? document.getElementsByClassName('mj-hero-content')[0].innerText.slice(4) : document.getElementsByClassName('mj-column-per-100')[3]?.firstElementChild?.firstElementChild.children[1].innerText,
        date: document.getElementsByClassName('mj-column-per-50 outlook-group-fix')[0].innerText,
        pdfLink: document.getElementsByClassName('mj-column-per-100 outlook-group-fix')[6].innerText === 'LINKS' ? getPDFLinks() : null,
        anchorLinks: document.getElementsByClassName('hide-on-mobile')[0].innerText.split('   |   '),
        sections: getSectionItems(document.getElementsByClassName('hide-on-mobile')[0].innerText.split('   |   '))
    }
    chrome.runtime.sendMessage({
        action: 'plainTextEmail',
        url: url,
        briefingData: briefingData
    })
}

function getSectionItems(sectionNames) {
    const sections = sectionNames.reduce((acc, curr) => (acc[curr.toUpperCase()] = [], acc), {})
    const items = [...document.getElementsByClassName('item-headline-hook')]

    items.forEach(item => {
        const section = item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].innerText
        const completeItem = {
            headline: item.innerText,
            metadata: item.parentElement.parentElement.children[1].firstElementChild.innerText,
            summary: item.parentElement.parentElement.children[2].innerText,
            readMoreLink: [
                item.parentElement.parentElement.children[item.parentElement.parentElement.childElementCount - 1].firstElementChild.firstElementChild.firstElementChild.innerText,
                item.parentElement.parentElement.children[item.parentElement.parentElement.childElementCount - 1].firstElementChild.firstElementChild.firstElementChild.href
            ],
            syndicationLinks: item.parentElement.parentElement.childElementCount === 5 ? item.parentElement.parentElement.children[3].firstElementChild.firstElementChild.firstElementChild.innerHTML : null
        }
        sections[section].push(completeItem)
    })
    return sections
}

function getPDFLinks() {
    const links = [...document.getElementsByClassName('large-block-of-text')]
        .filter(link => link?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild
            ?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.nodeName === 'A')
        .map(link => {
            const linkEl = link.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild
                .firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild.firstElementChild
            return [linkEl.innerText, linkEl.href]
        })
    return links
}

/*
    =============================
    |   Change Case functions   |
    =============================
*/

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

/*
    ===============================================
    |     Unadded content checking                |
    ===============================================
*/


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

/*
    ===============================================
    |     DB Platform productivity functions       |
    ===============================================
*/

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

function copyWithoutLineBreaks() {
    chrome.runtime.sendMessage({
        action: '1_paste',
        copy: window.getSelection().toString()
    })
    lastHighlightedElement = document.getSelection().baseNode
}

function copywithoutSubheadings() {
    chrome.runtime.sendMessage({
        action: '2_abc',
        copy: window.getSelection().toString()
    })
    lastHighlightedElement = document.getSelection().baseNode
}

/*
    ================================
    |     DB Platform checks       |
    ================================
*/

async function checkBriefing() {
    const checkData = await getBriefingCheck(currentPortal)

    let errors = []
    const items = getItems()
    const attachments = getAttachments()
    const unlinkedText = [...document.querySelectorAll('strong')].filter(text => text.parentElement.nodeName !== 'A').map(text => text.innerText)
    const hasSummary = [...document.getElementsByClassName('ql-blank')].filter(editor => editor.parentElement.parentElement.parentElement.parentElement.className.includes('executiveSummaryRichText')).length === 0
    const links = [...document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[1].children]
        .slice(1, document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[1].childElementCount - 1)
        .filter(link => link?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.firstElementChild?.checked)
        .map(link => link.firstElementChild.children[1].firstElementChild.value.replace('’', '\'').trimStart().trimEnd())
    const filteredLinks = links.filter(link => link.startsWith('MonitorReport-'))
    const headerLinks = [...document.getElementsByClassName('ql-editor')[0].children].filter(para => !para.firstElementChild || para.firstElementChild.nodeName === 'SPAN').map(p => p.innerText.trimEnd().trimStart())

    if (document.getElementsByClassName('mp-form-fieldset ng-star-inserted')[0]?.firstElementChild?.innerText === 'SEND TIME' &&
        !document.getElementsByClassName('mat-checkbox-input cdk-visually-hidden')[0].checked) {
        errors.push('Send time not checked')
    }
    if (filteredLinks.length > 0) {
        errors.push('One or more PDF Links need renaming')
    }

    if (checkData) {
        if (checkData.subjectLineCantInclude) {
            if (document.getElementsByClassName('emailSubjectInput')[0].firstElementChild.firstElementChild.firstElementChild.firstElementChild.value.includes(checkData.subjectLineCantInclude)) {
                errors.push('Subject line needs updating')
            }
        }
        if (checkData.briefingNameCantInclude) {
            if (document.getElementsByClassName('titleFormField')[0].firstElementChild.firstElementChild.firstElementChild.firstElementChild.value.includes(checkData.briefingNameCantInclude)) {
                errors.push('Report title needs updating')
            }
        }
        if (checkData.multipleBriefings) {
            const relevantBriefings = checkData.multipleBriefings.filter(briefing => document.getElementsByClassName('emailSubjectInput')[0].firstElementChild.firstElementChild.firstElementChild.firstElementChild.value.startsWith(briefing.subjectLine))
            if (relevantBriefings.length > 0) checkForErrors(relevantBriefings[0])
        } else if (checkData.multipleSends) {
            const possibleErrors = checkData.multipleSends.map(send => { return { name: send.name, errors: [], checks: send } })
            possibleErrors.forEach(send => checkForErrors(send.checks, send.errors))
            console.log(possibleErrors)
            if (possibleErrors.every(send => send.errors.length > 0)) {
                possibleErrors.forEach(send => errors.push([`If this is the ${send.name} send:`, ...send.errors]))
            }
        } else checkForErrors(checkData)
    }

    if (errors.length === 0) return
    setTimeout(() => showErrors(errors), 250)

    function checkForErrors(checkData, errorsArray = errors) {
        if (checkData.headlineAppend) {
            if (checkData.headlineAppend.outlets) {
                const relevantOutlets = items.filter(item => checkData.headlineAppend.outlets.includes(item.mediaOutlet))
                if (relevantOutlets.filter(item => item.headline.includes(checkData.headlineAppend.appendedText)).length !== relevantOutlets.length) {
                    errorsArray.push(`One or more headlines for the ${checkData.headlineAppend.outlets.join(' / ')} is missing ${checkData.headlineAppend.appendedText}`)
                }
            } else if (checkData.headlineAppend.mediaTypes) {
                const relevantOutlets = items.filter(item => checkData.headlineAppend.mediaTypes.includes(item.mediaType))
                if (relevantOutlets.filter(item => item.headline.includes(checkData.headlineAppend.appendedText)).length !== relevantOutlets.length) {
                    errorsArray.push(`One or more ${checkData.headlineAppend.mediaTypes.join(' / ')} headlines is missing '${checkData.headlineAppend.appendedText}'`)
                }
            }
        }

        if (checkData.excludeOutlets && items.filter(item => checkData.excludeOutlets.includes(item.mediaOutlet)).length > 0) {
            const badOutlets = new Set()
            const badItems = items.filter(item => checkData.excludeOutlets.includes(item.mediaOutlet))
            badItems.forEach(item => badOutlets.add(item.mediaOutlet))
            errorsArray.push(`${[...badOutlets].join(', ')} cannot be included in this briefing, but have been`)
        }

        if (checkData.pdfs || checkData.links) {
            const missingPDFs = checkData.pdfs ? checkData.pdfs.filter(pdf => !links.includes(pdf[0])) : null
            const missingLinks = checkData.links ? checkData.links.filter(link => unlinkedText.includes(link[0])) : null
            if (missingPDFs && missingPDFs.length > 0 && missingLinks && missingLinks.length > 0) {
                errorsArray.push(['Missing the following links:', ...missingPDFs.map(pdf => `${pdf[0]} (${pdf[1]})`), ...missingLinks.map(pdf => `${pdf[0]} (${pdf[1]})`)])
            } else if (missingPDFs && missingPDFs.length > 0) {
                errorsArray.push(['Missing the following links:', ...missingPDFs.map(pdf => `${pdf[0]} (${pdf[1]})`)])
            } else if (missingLinks && missingLinks.length > 0) {
                errorsArray.push(['Missing the following links:', ...missingLinks.map(pdf => `${pdf[0]} (${pdf[1]})`)])
            }
        } else if (links.length > 0 && !checkData.pdfs) {
            errorsArray.push('This briefing does not normally take linked attachments')
        }

        if (checkData.headerLinks) {
            const missingHeaderLinks = checkData.headerLinks.filter(link => headerLinks.includes(link[0]))
            if (missingHeaderLinks.length > 0) {
                errorsArray.push(['Missing the following links in the header:', ...missingHeaderLinks.map(link => `${link[0]} (${link[1]})`)])
            }
        }

        if (checkData.excludePDFs) {
            const missingPDFs = checkData.excludePDFs.filter(pdf => links.includes(pdf[0]))
            if (missingPDFs.length > 0) {
                errorsArray.push(['The following links shouldn\'t be included:', ...missingPDFs.map(pdf => `${pdf[0]} (${pdf[1]})`)])
            }
        }

        if (checkData.attachments) {
            const missingAttachments = checkData.attachments.filter(attachment => !attachments.some(briefingAttachment => briefingAttachment.startsWith(attachment[0])))
            if (missingAttachments.length > 0) {
                errorsArray.push(['Missing the following attachments:', ...missingAttachments.map(attachment => `${attachment[0]} (${attachment[1]})`)])
            }
        } else if (checkData.attachmentTypes) {
            checkData.attachmentTypes.forEach(fileType => {
                if (!attachments.some(attachment => attachment.endsWith(fileType[0]))) errorsArray.push(`Missing the ${fileType[1]} attachment`)
            })
        } else if (attachments.length > 0) errorsArray.push('This briefing does not normally take attachments')

        if (checkData.summary && !hasSummary) {
            errorsArray.push('No executive summary detected')
        }
    }
}

function showErrors(errors) {
    const parentDiv = document.createElement('div')
    const headerDiv = document.createElement('div')
    const title = document.createElement('b')
    title.innerText = 'Several possible errors detected'
    title.style.color = 'red'
    const button = document.createElement('button')
    button.innerText = 'more'
    button.addEventListener('click', ((e) => {
        e.target.parentElement.parentElement.children[1].style.display = e.target.parentElement.parentElement.children[1].style.display === 'block' ? 'none' : 'block'
        e.target.innerText = e.target.innerText === 'more' ? 'less' : 'more'
    }))
    button.style.marginLeft = '10px'
    headerDiv.style.display = 'flex'
    headerDiv.appendChild(title)
    headerDiv.appendChild(button)
    parentDiv.appendChild(headerDiv)
    parentDiv.style.marginTop = '20px'

    const errorContainer = document.createElement('ul')
    errorContainer.style.display = 'none'
    errors.forEach(error => {
        if (typeof error === 'string') appendError(error, errorContainer)
        else {
            appendError(error[0], errorContainer)
            const errorParent = document.createElement('ul')
            error.forEach((subError, ind) => {
                if (typeof subError === 'string') {
                    if (ind === 0) return
                    appendError(subError, errorParent)
                } else {
                    appendError(subError[0], errorParent)
                    const subErrorParent = document.createElement('ul')
                    subError.forEach((subSubError, i) => {
                        if (i === 0) return
                        appendError(subSubError, subErrorParent)
                    })
                    errorParent.appendChild(subErrorParent)
                }
            })
            errorContainer.appendChild(errorParent)
        }
    })
    parentDiv.appendChild(errorContainer)
    if (!document.getElementsByClassName('mat-dialog-content ng-star-inserted')[0]) {
        setTimeout(() => document.getElementsByClassName('mat-dialog-content ng-star-inserted')[0].firstElementChild.appendChild(parentDiv), 250)
    } else {
        document.getElementsByClassName('mat-dialog-content ng-star-inserted')[0].firstElementChild.appendChild(parentDiv)
    }
}

function appendError(errorMessage, errorParent) {
    const error = document.createElement('li')
    error.innerText = errorMessage
    errorParent.appendChild(error)
}

/*
    ================================
    |  DB Platform UI functions    |
    ================================
*/

async function createDBPlatformButtons() {

    fixSidebarProperties()

    let sidebarSettings = await getSidebarSetting()
    const checkData = await getBriefingCheck(currentPortal)

    let briefingText = await createBriefingText(checkData)
    if (briefingText) document.getElementsByClassName('mp-page-inner-tools mp-form')[0].appendChild(briefingText)

    let buttonDiv = createSidebarHeaders('NB: Before using any of these, scroll to the bottom of the report and ensure all items have loaded in.', 'PLUGIN', 'PluginButtons')

    let buttons = [['Open all sections/Close all items', expandSectionHeadingsBtn, 'closeItemsBtn'], ['Highlight syndications', getPossibleSyndications, 'syndHighlightBtn'], ['Highlight broadcast for recapping', highlightBroadcastItems, 'highlightBroadcastBtn'],
        ['Highlight byline errors', highlightBylineErrors, 'bylineHighlightBtn'], ['Fix bylines', fixBylines, 'bylineFixBtn'], ['Fix print syndications', fixPressSyndications, 'fixPressBtn']]

    for (let i = 0; i < buttons.length; i++) {
        buttonDiv.appendChild(createFeatureButton(buttons[i][0], buttons[i][1], buttons[i][2]))
    }
    if (currentPortal === 'dailybriefings_innovation' || currentPortal === 'training_innovation2') {
        let indSpecificButtons = [['Create synd note - grouped', getIndustrySyndNotesGrouped, 'groupedIndSynd'], ['Create synd note - ungrouped', getIndustrySyndNotesUngrouped, 'ungroupedIndSynd']]

        for (let i = 0; i < indSpecificButtons.length; i++) {
            buttonDiv.appendChild(createFeatureButton(indSpecificButtons[i][0], indSpecificButtons[i][1], indSpecificButtons[i][2]))
        }
        const indResetButton = document.getElementsByClassName('resetButton')[0]
        indResetButton.style.marginRight = '75px'
        indResetButton.firstElementChild.innerHTML = indResetButton.firstElementChild.innerHTML.replace('Reset', 'Stupid sexy Flanders')
    } else if (currentPortal === 'training_centre' || currentPortal === 'db_centre') {
        buttonDiv.appendChild(createFeatureButton('Append AFR headlines', fixDHSAFRItems, 'dhsAFR'))
    } else if (currentPortal.startsWith('db_colestraining') || currentPortal === 'db_coles') {
        buttonDiv.appendChild(createFeatureButton('Append IDs to bylines', appendColesIDs, 'appendColesIDs'))
    } else if (currentPortal === 'dailybriefings_homeaffairs' || currentPortal === 'training_homeaffairs') {
        buttonDiv.appendChild(createFeatureButton('Append online headlines', appendHAOnlineItems, 'haOnline'))
    }

    [...buttonDiv.children].forEach((el, ind) => {
        if (ind === 0) return
        el.style.display = sidebarSettings['PluginButtons'] ? '' : 'none'
    })

    document.getElementsByClassName('mp-page-inner-tools mp-form')[0].appendChild(buttonDiv)

    let staticDiv = createSidebarHeaders('Copy preset text to your clipboard by clicking the icon next to relevant field.\
    \nYou can set the text that appears here in the extension options or by clicking save below.\
    \n You can also set hotkeys in the options for these as well. ', 'PRESET TEXT', 'PresetText')

    let staticText = await getStaticText()
    staticText.forEach(item => createStaticTextField(item, staticDiv))
    let staticSaveBtn = createFeatureButton('Save', saveStaticText, 'saveStaticTextBtn')
    staticSaveBtn.style.marginTop = '5px'
    staticDiv.appendChild(staticSaveBtn)

    let staticChildren = [...staticDiv.children]

    staticChildren.forEach((el, ind) => {
        if (ind === 0) return
        el.style.display = sidebarSettings['PresetText'] ? '' : 'none'
    })

    document.getElementsByClassName('mp-page-inner-tools mp-form')[0].appendChild(staticDiv)
}

function createSidebarHeaders(introText, name, arrowLabel) {
    let para = document.createElement('P')
    para.innerText = introText

    let label = document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[1].firstElementChild.cloneNode()
    label.innerText = name
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

    arrow.addEventListener('click', () => toggleSidebar(arrow, div, arrowLabel))
    label.appendChild(arrow)

    return div
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

function createStaticTextField(text, parentDiv, header, enteredText) {
    if (enteredText && enteredText.includes(text)) return
    let div = document.createElement('DIV')
    div.className = 'flex flex-1 flex-direction-row ng-pristine ng-valid ng-touched'
    div.style.paddingBottom = '7px'
    if (header) {
        let headerEl = document.createElement('i')
        headerEl.innerText = header
        headerEl.style.marginTop = '5px'
        headerEl.style.marginBottom = '2px'
        parentDiv.appendChild(headerEl)
        if (enteredText) enteredText.push(text)
    }
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

async function createBriefingText(checkData) {
    function createBriefingTextFields(briefingData, enteredText) {
        if (briefingData.staticLink) briefingData.staticLink.forEach(link => createStaticTextField(link[0], briefingDiv, 'Link:', enteredText))
        if (briefingData.pdfs) {
            briefingDiv.appendChild(createElement('p', 'Create and link the following PDFs:\n'))
            briefingData.pdfs.forEach(pdf => createStaticTextField(pdf[0], briefingDiv, `A ${pdf[1]}. The link text is:`, enteredText))
        }
        if (briefingData.links) {
            briefingDiv.appendChild(createElement('p', 'The following lines of text should be linked before sending the briefing:\n'))
            briefingData.links.forEach(link => createStaticTextField(link[0], briefingDiv, `A ${link[1]}. The link text is:`, enteredText))
        }
        if (briefingData.headerLinks) {
            briefingDiv.appendChild(createElement('p', 'Ensure the Intro Text field has the following PDFs linked with the prescribed text:\n'))
            briefingData.headerLinks.forEach(link => createStaticTextField(link[0], briefingDiv, `A ${link[1]}. The link text is:`, enteredText))
        }
        if (briefingData.attachments) {
            briefingDiv.appendChild(createElement('p', 'Create and attach the following PDFs to the briefing:\n'))
            briefingData.attachments.forEach(attachment => createStaticTextField(attachment[0], briefingDiv, `A ${attachment[1]}. The file name is:`, enteredText))
        }
        if (briefingData.attachmentTypes) briefingData.attachments.forEach(attachment => createStaticTextField(attachment[0], briefingDiv, `${attachment[1]}. The file type is:`, enteredText))
    }

    if (!checkData) return null
    let briefingDiv = createSidebarHeaders('The details for this briefing\'s attachments & links can be found here (if any)', 'BRIEFING DETAILS', 'BriefingDetails')

    if (checkData.multipleBriefings) {
        const relevantBriefings = checkData.multipleBriefings.filter(briefing => document.getElementsByClassName('emailSubjectInput')[0].firstElementChild.firstElementChild.firstElementChild.firstElementChild.value.startsWith(briefing.subjectLine))
        if (relevantBriefings.length > 0) createBriefingTextFields(relevantBriefings[0])
    } else if (checkData.multipleSends) {
        const enteredText = []
        checkData.multipleSends.forEach(send => createBriefingTextFields(send, enteredText))
    }
    else createBriefingTextFields(checkData)

    return briefingDiv.childElementCount === 2 ? null : briefingDiv
}

function createRPCopyButtons(buttonDiv) {
    try {
        if (buttonDiv.children[buttonDiv.children.length - 1].innerText === 'Copy without subheadings') return
        const linebreakButton = buttonDiv.children[1].cloneNode(true)
        linebreakButton.innerText = 'Copy without linebreaks'
        linebreakButton.addEventListener('click', copyWithoutLineBreaks)
        buttonDiv.appendChild(linebreakButton)
        const subheadingButton = buttonDiv.children[1].cloneNode(true)
        subheadingButton.innerText = 'Copy without subheadings'
        subheadingButton.addEventListener('click', copywithoutSubheadings)
        buttonDiv.appendChild(subheadingButton)
    } catch (error) {
        console.error(error)
    }

}

/*
    =================================
    |  Report Builder UI functions  |
    =================================
*/

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

/*
    =================================
    |  Coverage UI functions  |
    =================================
*/


function appendSearchButton() {
    document.getElementsByClassName('control-area clearfix')[0].appendChild(createSearchButton())
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


/*
    ==============================
    |  Global helper functions   |
    ==============================
*/

const toSentenceCase = (word) => word.split('').map((letter, index) => {
    if (index === 0) return letter.toUpperCase()
    else if ((word[0] === '"' || word[0] === '\'') && index === 1) return letter.toUpperCase()
    else return letter.toLowerCase()
}).join('')


function filterObj(obj) {
    return Object.keys(obj)
        .filter(key => obj[key].length > 1)
        .reduce((res, key) => (res[key] = obj[key], res), {})
}


function waitForMP(classToCheck, fnc, maxRecursion = 15) {
    if (maxRecursion < 1) return
    if (document.getElementsByClassName(classToCheck).length === 0) {
        setTimeout(() => waitForMP(classToCheck, fnc, maxRecursion - 1), 1000)
        return
    }
    fnc()
}

function getLastThreeDates() {
    let todaysDate = new Date(new Date().setHours(0, 0, 0, 0))
    let dayBefore = new Date().setDate(todaysDate.getDate() - 1)
    let dayBeforeYesterday = new Date().setDate(todaysDate.getDate() - 3)
    return [todaysDate, dayBefore, dayBeforeYesterday]
}

const createElement = (type, innerText) => {
    const el = document.createElement(type)
    el.innerText = innerText
    return el
}

/*
    ====================================
    |  DB Platform helper functions  |
    ====================================
*/

const getAttachments = () => {
    return [...[...document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[0].children]
        .slice(1, document.getElementsByClassName('flex flex-1 flex-direction-column mp-form-fieldset')[0].childElementCount - 1)[0].children]
        .filter(attachment => attachment.innerText !== '' && !/Briefing PDF\n2MB/.test(attachment.innerText))
        .map(attachment => attachment?.firstElementChild?.innerText ? attachment?.firstElementChild?.innerText : attachment.innerText)
}

const getItems = () => {
    const rawItems = [...document.getElementsByClassName('mat-content')].filter(item => item.firstElementChild.className === 'flex flex-1 flex-direction-column')

    return rawItems.map(item => {
        return {
            headline: item.firstElementChild.firstElementChild.innerText,
            mediaType: getMediaType(item?.firstElementChild?.children[1]?.children[1]?.children[2]?.firstElementChild?.className),
            mediaOutlet: item?.firstElementChild?.children[1]?.firstElementChild?.innerText && item?.firstElementChild?.children[1]?.firstElementChild?.innerText.length > 0 ? item?.firstElementChild?.children[1]?.firstElementChild?.innerText.split(' ,')[0] : null
        }
    })
}

const getMediaType = (className) => {
    if (!className) return null

    if (className.includes('fa-file-alt')) return 'print'
    else if (className.includes('fa-cloud')) return 'online'
    else if (className.includes('fa-volume-up')) return 'radio'
    else if (className.includes('fa-video')) return 'television'
    else return 'other'
}

/*
    ====================================
    |  Chrome storage helper functions  |
    ====================================
*/

chrome.storage.local.get({ coverageOptions: coverageOptions }, function (data) {
    if (window.location.toString() !== 'https://app.mediaportal.com/dailybriefings/#/briefings' && window.location.toString() !== 'https://app.mediaportal.com/#/report-builder/view') {
        coverageOptions = data.coverageOptions
    }
})

function getBriefingCheck(briefingLogin) {
    return new Promise(response => {
        chrome.runtime.sendMessage({
            action: 'getBriefingCheck',
            data: briefingLogin
        }, function (check) {
            response(check?.briefingChecks)
        })
    })
}

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
function getReadMoreCopyOption() {
    return new Promise(options => {
        chrome.storage.local.get({ readMoreCopy: true }, function (data) {
            options(data.readMoreCopy)
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
        chrome.storage.local.get({ sidebarSetting: { 'PluginButtons': true, 'PresetText': true, 'BriefingDetails': true } }, function (data) {
            options(data.sidebarSetting)
        })
    })
}


