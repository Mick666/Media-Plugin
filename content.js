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

chrome.storage.local.get({ listenerOptions: [true, true, true] }, function (data) {
    if (window.location.toString() !== 'https://app.mediaportal.com/dailybriefings/#/briefings' && window.location.toString() !== 'https://app.mediaportal.com/#/report-builder/view') {
        document.addEventListener('scroll', func)
        listenerOptions = data.listenerOptions
    }
})
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
        .filter(item => !item.className.includes('edited') &&
            item.firstChild && item.firstChild.innerText !== 'Item ID: {{::item.summary_id}}')

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
            const publicationName = item.parentElement.parentElement.parentElement.parentElement.parentElement.children[1].children[0].children[3].children[0].innerText.replace(/ \(page [0-9]{1,2}\)/, '')
            const key = headline + ' ' + publicationName


            if (reclipObj[key]) {
                if (reclipObj[key][1] < itemID) {
                    reclipObj[key][0].style.opacity = '0.5'
                    reclipObj[key] = [item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement, itemID]
                } else if (reclipObj[key][1] !== itemID) {
                    item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.opacity = '0.5'
                    item.className += ' edited'
                }
            } else {
                reclipObj[key] = [item.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement, itemID]
            }
        }
    })
}

chrome.storage.local.get({ readmoreScroll: true }, function (data) {
    if (data.readmoreScroll) {
        document.addEventListener('mousedown', function (e) {
            if (e.target.outerText === ' Read More') {
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

    let bylines = [...document.getElementsByClassName('flex flex-1 author mp-page-ellipsis')].filter(item =>
        item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-video' &&
        item.parentElement.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-volume-up')
    let headlines = [...document.getElementsByClassName('headline mp-page-ellipsis headerRow shown')].filter(item =>
        item.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-video' &&
        item.parentElement.children[1].children[1].children[2].firstElementChild.classList[2] !== 'fa-volume-up')

    for (let i = 0; i < Math.max(bylines.length, headlines.length); i++) {
        let byline = bylines[i].innerText.split(' , ').filter(item => item.startsWith('By')).join('').slice(3).replace(/[^A-Za-z ]/, '').toLowerCase()
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
}

function filterObj(obj) {
    return Object.keys(obj)
        .filter(key => obj[key].length > 1)
        .reduce( (res, key) => (res[key] = obj[key], res), {} )
}

document.addEventListener('mousedown', function (e) {
    if (e.button !== 0 || e.ctrlKey || !e.target) return
    if (((e.target.className && e.target.className === 'coverage-anchor') ||
        (e.target.parentElement && (e.target.parentElement.className === 'coverage-anchor' || e.target.parentElement.className === 'item-primary-panel')) ||
        (e.target.parentElement && e.target.parentElement.parentElement && e.target.parentElement.parentElement.className === 'item-primary-panel'))
        && / Brief| Folder/.test(e.target.parentElement.outerText)) {
        if (e.target.nodeName === 'DIV') document.title = e.target.parentElement.children[1].outerText.trimEnd()
        else document.title = e.target.outerText.trimEnd()
        setTimeout(function () {
            if (document.getElementsByClassName('sorting dropdown').length > 0) {
                addHeadlineSortOptions()
            }
        }, 2000)
    } else if (e.target.nodeName === 'SPAN' && e.target.outerText === ' BACK') {
        document.addEventListener('scroll', func)
        document.title = 'Mediaportal Coverage'
        seenIDs = []
    } else if (e.target.nodeName === 'A' && e.target.outerText === ' Coverage') {
        document.addEventListener('scroll', func)
        document.title = 'Mediaportal Coverage'
        seenIDs = []
    } else if (e.target.href === 'https://app.mediaportal.com/#/monitor/media-coverage' || (e.target.parentElement && e.target.parentElement.href === 'https://app.mediaportal.com/#/monitor/media-coverage')) {
        document.addEventListener('scroll', func)
        document.title = 'Mediaportal Coverage'
        seenIDs = []
    } else if (e.target.href === 'https://app.mediaportal.com/#/report-builder/view' || (e.target.parentElement && e.target.parentElement.href === 'https://app.mediaportal.com/#/report-builder/view')) {
        document.removeEventListener('scroll', func)
        document.title = 'Report Builder'
    }
})

window.onload = function () {
    if (document.getElementsByClassName('coverage-jump-trigger ng-binding').length > 0) {
        document.title = document.getElementsByClassName('coverage-jump-trigger ng-binding')[0].innerText.trimEnd()
        if (document.getElementsByClassName('sorting dropdown').length > 0) {
            addHeadlineSortOptions()
        }
    } else if (window.location.href === 'https://app.mediaportal.com/dailybriefings/#/briefings') {
        document.title = 'DB Platform'
    } else if (window.location.href === 'https://app.mediaportal.com/#/monitor/media-coverage') {
        document.title = 'Mediaportal Coverage'
    } else if (window.location.href === 'https://app.mediaportal.com/#/report-builder/view') {
        document.title = 'Report Builder'
    }
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.action === 'getHighlightedText') {
            sendResponse({ copy: window.getSelection().toString() })
            lastHighlightedElement = document.getSelection().baseNode
        } else if (request.action === 'highlight') {
            highlightBroadcastItems()
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

function fixPressSyndications() {
    let items = [...document.querySelectorAll('mat-expansion-panel')]
        .filter(item => item.className.search('standardMode') > -1 &&
        item.firstElementChild.firstElementChild.firstElementChild
            .children[1].children[1].children[2].firstElementChild
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
}


function highlightBroadcastItems() {
    const headlines = document.body.getElementsByClassName('headline mp-page-ellipsis headerRow')
    for (let i = 0; i < headlines.length; i++) {
        if ((/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/).test(headlines[i].firstChild.innerText)
            && (headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === 'fa-volume-up' ||
                headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === 'fa-video')) {
            headlines[i].firstChild.innerHTML = headlines[i].firstChild.innerHTML
                .replace(/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/gi, function (match) {
                    return '<span style=\'background-color:#FDFF47;\'>' + match + '</span>'
                })
        }
    }
    getPossibleSyndications()
}


const datesForChecks = getLastThreeDates()
const metroPapers = ['Weekend Australian', 'Australian Financial Review', 'Sydney Morning Herald', 'Sun Herald',
    'Daily Telegraph', 'Sunday Telegraph', 'Age', 'Sunday Age', 'Herald Sun', 'Sunday Herald Sun', 'Canberra Times',
    'Sunday Canberra Times', 'Courier Mail', 'Sunday Mail Brisbane', 'Adelaide Advertiser', 'Sunday Mail Adelaide',
    'West Australian', 'Sunday Times', 'Hobart Mercury', 'Northern Territory News', 'Sunday Territorian', 'Sunday Tasmanian',
    'The Australian', 'AFR Weekend ']

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

        for (let j = 0; j < itemContentWords.length; j++) {

            let word = itemContentWords[j].replace(/[.!?,]["']{0,1}$/, '').replace(/[^A-Za-z0-9-/]/g, '')

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
                break
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
    if (!lastHighlightedElement || !lastHighlightedElement.parentElement.parentElement.className === 'readmore shown') return
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
        return text.split(' ').map((word, index) => {
            if (index === 0) return toSentenceCase(word)
            else return word.toLowerCase()
        }).join(' ')
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



