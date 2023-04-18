window.onload = async function () {
    const briefingData = await getBriefingData()
    console.log(briefingData)

    document.getElementById('briefing-logo').src = briefingData.briefingImage
    document.getElementById('briefing-title').innerText = briefingData.title
    document.getElementById('briefing-date').innerText = briefingData.date
    // briefingData.anchorLinks.forEach((link, ind) => {
    //     const linkEl = createElement('a', 'briefing-anchorlink briefing-link', link)
    //     linkEl.href = `#section-${ind}`
    //     document.getElementById('briefing-links-container').appendChild(linkEl)
    //     if (ind+1 !== briefingData.anchorLinks.length) document.getElementById('briefing-links-container').appendChild(createElement('span', 'anchor-divider', '  |  '))
    // })
    // if (briefingData.pdfLink) {
    //     briefingData.pdfLink.forEach(link => {
    //         const pdfLink = createElement('a', 'briefing-anchorlink briefing-link', link[0])
    //         pdfLink.href = link[1]
    //         pdfLink.style.marginTop = '10px'
    //         document.getElementById('header').appendChild(createElement('br'))
    //         document.getElementById('header').appendChild(pdfLink)
    //     })
    // }

    briefingData.anchorLinks.forEach((section, ind) => {
        const sectionDiv = createElement('div', 'section-div')
        sectionDiv.id = `section-${ind}`
        const header = createElement('h2', 'section-header', section)
        sectionDiv.appendChild(header)

        if (briefingData.sections[section.toUpperCase()]?.length === 0) {
            const emptySectionNote = createElement('div', 'section-emptynote', 'No relevant coverage')
            sectionDiv.appendChild(emptySectionNote)
        } else {
            const sectionItems = briefingData.sections[section.toUpperCase()]
            sectionItems.forEach(item => {
                const itemDiv = createElement('div', 'item-parent')
                if (item.metadata.length > 0) {
                    itemDiv.appendChild(createElement('h1', 'item-headline', `HEADING_CONTAINER${item.headline}HEADING_CONTAINER`))
                    const metadata = createElement('div', 'item-metadata', `METADATA_CONTAINER${item.metadata}METADATA_CONTAINER`)
                    const metadataParent = createElement('span')
                    metadataParent.appendChild(metadata)
                    // metadata.href = item.readMoreLink[1]
                    itemDiv.appendChild(metadataParent)
                } else {
                    // itemDiv.appendChild(createElement('h3', 'item-headline', item.headline))
                    const metadata = createElement('h4', 'item-metadata', `HEADING_CONTAINER${item.headline}HEADING_CONTAINER`)
                    const metadataParent = createElement('span')
                    metadataParent.appendChild(metadata)
                    metadata.href = item.readMoreLink[1]
                    itemDiv.appendChild(createElement('br'))
                    itemDiv.appendChild(metadataParent)
                }
                itemDiv.appendChild(createElement('p', 'item-paragraph', `BODY_CONTAINER${item.summary}BODY_CONTAINER`))
                if (item.syndicationLinks) {
                    const syndicationLinks = createElement('div', 'briefing-syndication')
                    // console.log(item.syndicationLinks)
                    syndicationLinks.innerHTML = `ALSO_CONTAINER${item.syndicationLinks.replace(/color: rgb\([\d]{1,3}, [\d]{1,3}, [\d]{1,3}\);|color:#[a-zA-Z0-9]*;/g, '')}ALSO_CONTAINER`
                    itemDiv.appendChild(syndicationLinks)
                }
                if (item.readMoreLink.length > 0) {
                    const readMoreParent = createElement('div', 'item-readmore')
                    const readMoreLink = createElement('a', 'item-readmore', `ALSO_CONTAINERRead more about ${item.headline}ALSO_CONTAINER`)
                    readMoreLink.href = item.readMoreLink[1]
                    readMoreParent.appendChild(readMoreLink)
                    itemDiv.appendChild(readMoreParent)
                }
                sectionDiv.appendChild(itemDiv)
            })
        }
        document.getElementById('sections-parent').appendChild(sectionDiv)
    })
}

function createElement(type = 'div', className = '', innerText = '') {
    // console.log(innerText)
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

const moveIDToEnd = (metadata) => {
    // console.log(metadata)
    const splitMetadata = metadata.split(',')
    const ID = splitMetadata.filter(x => x.startsWith(' ID:'))[0]
    return splitMetadata.filter(x => x !== ' ' && !x.startsWith(' ID:')).concat(ID).join(',')
}