
// To get and show all open tabs when the pop-up opens
var openTabs

chrome.tabs.query({}, tabs => {
    var tabList = document.getElementById('tabList')
    openTabs = tabs
    tabs.forEach(tab => {

        let tabDiv = document.createElement('div')
        tabDiv.id = tab.id
        tabDiv.classList.add('tab','openTab')
        
        let checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = tab.id
        checkbox.dataset.url = tab.url

        tabDiv.append(checkbox)

        let favIcon = document.createElement('img')
        favIcon.classList.add('favIcon')
        favIcon.src = tab.hasOwnProperty('favIconUrl')?(tab.favIconUrl!=''?tab.favIconUrl:'icons/chrome.png'):'icons/chrome.png'

        tabDiv.append(favIcon)

        let titleDiv = document.createElement('div')
        titleDiv.classList.add('title')
        titleDiv.innerText = tab.title
       
        tabDiv.append(titleDiv)

        tabList.append(tabDiv)
    })
    
    var selectAll = document.getElementById('selectAll')
    var tabDivs = document.getElementsByClassName('openTab')
    var tabCheckBoxes = Array.from(tabDivs).map(tab => {return tab.childNodes[0]})// Get checkboxes of tab divs
    tabCheckBoxes.forEach(checkBox => {
        checkBox.addEventListener('change', () => {
            if(!checkBox.checked){
                selectAll.checked = false
            }
        })
    })
})

// To get and show all saves when the pop-up opens
var saveNumber

getSaves = () => {
    
    chrome.storage.local.get(['savesOfTabs'], result => {

        if(!result.hasOwnProperty('savesOfTabs')){
            console.log("Buraya girdim")
            result.savesOfTabs = []
        }

        var nameInput = document.getElementById('saveName')
        
        saveNumber = result.savesOfTabs.length+1
        nameInput.placeholder = 'Tabs ' + (result.savesOfTabs.length+1)

        var saveList = document.getElementById('saveList')
        saveList.innerHTML = ''

        result.savesOfTabs.forEach(item => {

            let saveBox = document.createElement('div')
            saveBox.id = item.id
            saveBox.classList.add('saveBox')
            
            let saveTop = document.createElement('div')
            saveTop.classList.add('saveTop')
            
            let checkbox = document.createElement('input')
            checkbox.type = 'checkbox'

            saveTop.append(checkbox)

            let textDiv = document.createElement('div')
            textDiv.classList.add('textDiv')

            let titleDiv = document.createElement('div')
            titleDiv.classList.add('titleDiv')
            titleDiv.innerText = item.name
        
            textDiv.append(titleDiv)

            let dateDiv = document.createElement('div')
            dateDiv.classList.add('dateDiv')
            dateDiv.innerText = item.date

            textDiv.append(dateDiv)

            saveTop.append(textDiv)

            saveBox.append(saveTop)

            let urlList = document.createElement('div')
            urlList.id = 'urls' + item.id
            urlList.classList.add('urlList')
            urlList.style.display = 'none'

            item.links.forEach(link => {
                let saveTab = document.createElement('div')
                saveTab.classList.add('tab','saveTab')

                let checkbox = document.createElement('input')
                checkbox.type = 'checkbox'
                checkbox.dataset.url = link.url

                saveTab.append(checkbox)

                let favIcon = document.createElement('img')
                favIcon.classList.add('favIcon')
                favIcon.src = link.favIcon
                saveTab.append(favIcon)

                let titleDiv = document.createElement('div')
                titleDiv.classList.add('titleDiv')
                titleDiv.style.marginLeft = '10px'
                titleDiv.style.width = '100%'
                titleDiv.innerText = link.title
            
                saveTab.append(titleDiv)

                urlList.append(saveTab)
            })

            saveBox.append(urlList)

            saveList.append(saveBox)
        })
        addListenersToSaves()
    })
}

/* To add onclick functions to buttons. Because you can't add inline js
 code to popup.html when you're developing a Chrome extension*/
document.addEventListener('DOMContentLoaded', function() {
    // When all DOM content loaded get saves
    getSaves()

    var showTabsTab = document.getElementById('showTabsTab')
    var openSavesTab = document.getElementById('openSavesTab')

    var tabs = document.getElementById('tabsView')
    var saves = document.getElementById('savesView')

    showTabsTab.addEventListener('click', () => {
        showTabsTab.style.backgroundColor = '#2BA882'
        openSavesTab.style.backgroundColor = 'black'
        tabs.style.display = 'block'
        saves.style.display = 'none'
    })

    openSavesTab.addEventListener('click', () => {
        // Before show saves bring them again
        getSaves()
        openSavesTab.style.backgroundColor = '#2BA882'
        showTabsTab.style.backgroundColor = 'black'
        saves.style.display = 'block'
        tabs.style.display = 'none'
    })

    // To select all tabs
    var notSelectedTabs
    var selectAll = document.getElementById('selectAll')
    selectAll.addEventListener('change', () => {
        if(selectAll.checked){
            notSelectedTabs = document.querySelectorAll('.openTab input[type="checkbox"]:not(:checked)')
        }
         notSelectedTabs.forEach(element => {
            element.checked = selectAll.checked
        });
    })

    var saveButton = document.getElementById('saveButton')
    saveButton.addEventListener('click', () => {
        var savedDiv = document.getElementById('saved')
        var tabsDiv = document.getElementById('tabsView')
        // Tell the user that the process is completed
        
        save().then(() => {
            processAnimation(tabsDiv,savedDiv)
            
            var nameInput = document.getElementById('saveName')
            saveNumber++
            nameInput.placeholder = 'Tabs ' + (saveNumber)
            nameInput.value = ''
            selectAll.checked = false
        }).catch(()=>{console.log('Nothing selected!')})

    })

    var deleteButton = document.getElementById('deleteButton')
    deleteButton.addEventListener('click', () => {
        var deletedDiv = document.getElementById('deleted')
        var savesDiv = document.getElementById('savesView')
        // Tell the user that the process is completed
        processAnimation(savesDiv,deletedDiv)

        // Bring saves again after some saves are deleted
        deleteSaves().then(()=>{getSaves()})
    })

    var deleteAllButton = document.getElementById('deleteAllButton')
    deleteAllButton.addEventListener('click', () => {
        var deletedDiv = document.getElementById('deleted')
        var savesDiv = document.getElementById('savesView')
        // Tell the user that the process is completed
        processAnimation(savesDiv,deletedDiv)
        chrome.storage.local.set({'savesOfTabs':  []}, function() {
            getSaves()
        })
    })

    var openButton = document.getElementById('openButton')
    openButton.addEventListener('click', () => {
        openLinks()
    })
})

addListenersToSaves = () => {
    // To add listeners to checkboxes of saves
    var saveBoxes = document.getElementsByClassName('saveBox')
    Array.from(saveBoxes).forEach(saveBox => {
        let saveTextDiv = saveBox.childNodes[0].childNodes[1]
        
        // To show/hide the link list of the save
        saveTextDiv.addEventListener('click', () => {
            if(saveBox.childNodes[1].style.display === 'none'){
                saveBox.childNodes[1].style.display = 'block'
            }else{
                saveBox.childNodes[1].style.display = 'none'
            }
        })
        // To select all links with checkbox
        let saveCheckBox =  saveBox.childNodes[0].childNodes[0]
        saveCheckBox.addEventListener('change', () => {
            let linksCheckBoxes = saveBox.childNodes[1].childNodes
            Array.from(linksCheckBoxes).forEach(element => {
                element.childNodes[0].checked = saveCheckBox.checked
            })
        })
    })
    var saveTabs = document.getElementsByClassName('saveTab')
    var saveTabsCheckBoxes = Array.from(saveTabs).map(rt => {return rt.childNodes[0]})
    saveTabsCheckBoxes.forEach(checkBox => {
        checkBox.addEventListener('change', () => {
            if(!checkBox.checked){
                let selectAllCheckBox = checkBox.parentNode.parentNode.previousElementSibling.childNodes[0]
                selectAllCheckBox.checked = false
            }
        })
    })
}

save = () => {
    

    return new Promise((resolve,reject) => {
        var selectedTabs = document.querySelectorAll('.openTab input[type="checkbox"]:checked')
        if(!selectedTabs.length){
            return reject()
        }
        
        const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"]

        function addZero(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }    

        var date = new Date()

        var nameInput = document.getElementById('saveName')

        var dataToBeSaved = {
            name: nameInput.value==''?nameInput.placeholder:nameInput.value,
            id: saveNumber,
            date: date.getDate()+ ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear() +
            ' ' + addZero(date.getHours()) + ':' +  addZero(date.getMinutes()),
            links: Array.prototype.slice.call(selectedTabs).map(
                item => {
                    let theTab = openTabs.find(tab => {
                        return tab.id == item.id
                    })
                    return {
                        url: item.dataset.url,
                        title: theTab.title,
                        favIcon: theTab.hasOwnProperty('favIconUrl')?(theTab.favIconUrl!=''?theTab.favIconUrl:'icons/chrome.png'):'icons/chrome.png'
                    }
                }
            )
        }

        var oldSaves

        chrome.storage.local.get(['savesOfTabs'], result => {
            if(result.hasOwnProperty('savesOfTabs')){
                oldSaves = result.savesOfTabs
            }else{
                oldSaves = []
            }
            

            oldSaves.push(dataToBeSaved)

            chrome.storage.local.set({'savesOfTabs':  oldSaves}, function() {
                console.log('Value is set to ' + oldSaves);
            })
        })

        selectedTabs.forEach(checkbox => {
            checkbox.checked = false
        })

        resolve()
    })
   
}

openLinks = () => {
    var saveboxes = document.getElementsByClassName('saveBox')
    Array.from(saveboxes).forEach(recordBox => {
        let saveName = recordBox.childNodes[0].childNodes[1].childNodes[0].textContent
        let urlList = recordBox.childNodes[1]
        let urlCheckBoxes = urlList.querySelectorAll('input[type="checkbox"]:checked' )
        let urls = Array.from(urlCheckBoxes).map(item => {return item.getAttribute('data-url')})
            
        if(urls.length > 0){
            var ourTabIds = []
            for(const url of urls) {
                chrome.tabs.create({active: false, url : url},tab => {
                    ourTabIds.push(tab.id)
                    if(ourTabIds.length == urls.length){
                        chrome.tabs.group({tabIds : ourTabIds}, 
                            groupId => {
                                chrome.tabGroups.update(groupId,{
                                    collapsed : true,
                                    title : saveName,
                                    color : 'green'
                                })
                            })
                    }
                })
            }
        }
    })
}

deleteSaves = () => {
    return new Promise((resolve,reject) => {
        chrome.storage.local.get(['savesOfTabs'], saves => {
            let linksCheckBoxes = document.querySelectorAll('.urlList input[type="checkbox"]:checked' )
            let links = Array.from(linksCheckBoxes).map(
                item => {
                    return {
                        grandpa: item.parentNode.parentNode.parentNode,
                        url: item.getAttribute('data-url')
                    }
            })
            links.forEach(link => {
                var i = Array.from(link.grandpa.parentNode.childNodes).indexOf(link.grandpa)
                saves.savesOfTabs[i].links.splice(saves.savesOfTabs[i].links.findIndex(e => e.url === link.url),1)
            })
            saves.savesOfTabs = saves.savesOfTabs.filter(
                save => {return save.links.length > 0}
            )
            chrome.storage.local.set({'savesOfTabs':  saves.savesOfTabs}, function() {})
            resolve()
        })
    })
}

processAnimation = (background, process) => {
    var blur = 0
    process.style.display = 'flex'
    
    var interval = setInterval(()=>{
        blur+=0.5
        background.style.filter = 'blur('+blur+'px)'
        process.style.opacity = blur/5
    }, 50)
    
    setTimeout(()=>{
        clearInterval(interval)
        var interval2 = setInterval(()=>{
            blur-=0.5
            background.style.filter = 'blur('+blur+'px)'
            process.style.opacity = blur/5
        }, 50)
        setTimeout(()=>{
            clearInterval(interval2)
            process.style.display = 'none'
        
        }, 500)
    }, 500)
}
