window.onload = async function () {
    const briefingData = await getBriefingData()

    document.getElementById('briefing-logo').src = briefingData.briefingImage
    document.getElementById('briefing-title').innerText = briefingData.title
    document.getElementById('briefing-date').innerText = briefingData.date
    briefingData.anchorLinks.forEach((link, ind) => {
        const linkEl = createElement('a', 'briefing-anchorlink briefing-link', link)
        linkEl.href = `#section-${ind}`
        document.getElementById('briefing-links-container').appendChild(linkEl)
        document.getElementById('briefing-links-container').appendChild(createElement('span', '', '   '))
    })
    if (briefingData.pdfLink) {
        briefingData.pdfLink.forEach(link => {
            const pdfLink = createElement('a', 'briefing-anchorlink briefing-link', link[0])
            pdfLink.href = link[1]
            pdfLink.style.marginTop = '10px'
            document.getElementById('header').appendChild(createElement('br'))
            document.getElementById('header').appendChild(pdfLink)
        })
    }

    briefingData.anchorLinks.forEach((section, ind) => {
        const sectionDiv = createElement('div', 'section-div')
        sectionDiv.id = `section-${ind}`
        const header = createElement('h3', 'section-header', section.toUpperCase())
        sectionDiv.appendChild(header)

        if (briefingData.sections[section.toUpperCase()]?.length === 0) {
            const emptySectionNote = createElement('div', 'section-emptynote', 'No relevant coverage')
            sectionDiv.appendChild(emptySectionNote)
        } else {
            const sectionItems = briefingData.sections[section.toUpperCase()]
            sectionItems.forEach(item => {
                const itemDiv = createElement('div', 'item-parent')
                itemDiv.appendChild(createElement('br'))
                itemDiv.appendChild(createElement('br'))
                itemDiv.appendChild(createElement('div', 'item-headline', item.headline))
                if (item.metadata.length > 0) itemDiv.appendChild(createElement('div', 'item-metadata', item.metadata))
                itemDiv.appendChild(createElement('div', 'item-paragraph', item.summary))
                if (item.syndicationLinks) {
                    const syndicationLinks = createElement('i', 'briefing-syndication')
                    syndicationLinks.innerHTML = item.syndicationLinks
                    itemDiv.appendChild(syndicationLinks)
                }

                const itemLink = createElement('a', 'briefing-link', item.readMoreLink[0])
                itemLink.href = item.readMoreLink[1]
                itemDiv.appendChild(createElement('br'))
                itemDiv.appendChild(itemLink)
                sectionDiv.appendChild(itemDiv)
            })
        }
        sectionDiv.appendChild(createElement('br'))
        sectionDiv.appendChild(createElement('br'))
        const backToTopLink = createElement('a', 'briefing-link top-link', 'Back to Top')
        backToTopLink.href = '#header'
        sectionDiv.appendChild(backToTopLink)
        document.getElementById('sections-parent').appendChild(sectionDiv)
    })
}

function createElement(type = 'div', className = '', innerText = '') {
    const element = document.createElement(type)
    element.className = className
    element.innerText = innerText
    return element
}

function getBriefingData() {
    return new Promise(options => {
        chrome.storage.local.get({ briefingData: {} }, function (data) {
            options(data.briefingData)
        })
    })
}