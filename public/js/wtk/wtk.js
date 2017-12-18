class wtk {
  constructor(args) {
    this.base = "/js/wtk"
    this.contents = []
    this.api = "/wtk/auth"
    this.apiOpen = "/wtk"
    this.user = this._getCookie('userForWeb') || false;  // <=PREPSAT !!!!!
    this._initAdmin()
  }
  _initAdmin(){
    if (!this.user) return
    this.fetchWtkDep(
      `${this.base}/js/wtk-admin.js`, 
    )
  }
  toast(msg, mainErr) {
    console.log(msg)
    // let mainErr=errMsg.querySelector('.mad-main-errMsg')
    //     mainErr.innerText=msg
    //     mainErr.classList.add(err?'colE':'colC')
    let toastElm = document.createElement('div')
    toastElm.innerText = msg
    toastElm.style.position = 'fixed'
    toastElm.style.zIndex = 9999
    toastElm.style.top = '8px'
    toastElm.style.right = '8px'
    toastElm.style.backgroundColor = '#212121'
    toastElm.style.color = '#fff'
    toastElm.style.borderRadius = '3px'
    toastElm.style.padding = '4px 16px'
    document.body.appendChild(toastElm)
    setTimeout(function () {
      toastElm.parentNode.removeChild(toastElm)
      // mainErr.classList.remove('colE')
      // mainErr.classList.remove('colC')
      // mainErr.innerText=""
    }, 5000);
  }
  _getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return false;
  }
  async getGeneralMetadata() {
    const path = `${this.base}/wtkSettings.json`
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) { this.toast(response.statusText); return false }  
    return await response.json()
  }
  fireEvent(customEvt, element) {
    let event; // The custom event that will be created
    if (document.createEvent) {
      event = document.createEvent("HTMLEvents");
      event.initEvent(customEvt, true, true);
    } else {
      event = document.createEventObject();
      event.eventType = customEvt;
    }

    event.eventName = customEvt;

    if (document.createEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent("on" + event.eventType, event);
    }
  }
  fetchWtkDep(path, elem, target, attr) {
    if (path == undefined || path == null || path == "") return 

    const loadedScripts = document.querySelectorAll(`*[src="${path}"]`)

    console.log(`${/^(https)?$/.test(path)}`);
    if (loadedScripts.length == 0) {
      const wtkScriptJS = document.createElement('script')
      wtkScriptJS.type = /^(https)+.+$/.test(path)? "":"module" //TODO: babel 
            wtkScriptJS.src = path;
      document.body.appendChild(wtkScriptJS);
    }
    // create and append element like wtk-content
    if (elem == undefined || elem == null || elem == "") return 

    const wtkElem = document.createElement(elem)
    target.appendChild(wtkElem)
  }
  getTinyMCEJS() {
    return new Promise((resolve, reject) => {
      let tinymceJS = document.createElement('script')
      // tinymceJS.src='http://cloud.tinymce.com/stable/tinymce.min.js?apiKey=4moevcayfzxxm4vucvd9dz88sxhdf7jfwc2cevej082ieb6z'
      tinymceJS.src = `${this.base}/tinymce_4.5.5/tinymce/js/tinymce/tinymce.min.js`
      tinymceJS.addEventListener('load', (ev) => {
        resolve()
      })
      document.body.appendChild(tinymceJS)
    });
  }
  addOptionsToSelect(elem, data) {
    data.forEach((val, key) => {
      const opt = document.createElement('option')
            opt.innerText = val.name
            opt.value = val.value
            opt.selected = val.selected
      elem.appendChild(opt)
    })
  }
  appendWtkContentItemsData(cj, name, target) {
    const items = cj._embedded.items
    Object.keys(items)
    .sort((valA, valB) => {
      return items[valA].wtkPosition < items[valB].wtkPosition
    })
    .forEach((val, key) => {
      let wtkWidth = items[key].wtkWidth
      let wtkHeight = items[key].wtkHeight
      let imgSize
      if (wtkWidth != undefined && wtkHeight != undefined) {
        imgSize = { wtkWidth: wtkWidth, wtkHeight: wtkHeight }
      }
      let wtkType = items[key].wtkType

      this.addContentItem(
        items[key]._links.self.href,
        target,
        null,
        wtkType,
        imgSize,
        items[key]
      )
    })
    console.log(this.user);
    if (this.user) {
      this.fetchWtkDep(
        `${this.base}/js/wtk-content-controls.js`,
        'wtk-content-ctrl',
        target)
    }
  }
  appendWtkGroupItemsData(cj, name, target, contentType, metaTemplate) {
    const items = cj._embedded.items
    Object.keys(items)
    .forEach((val, key) => {
      const wtkContElem = document.createElement(`wtk-${contentType}`)
            wtkContElem.setAttribute('wtk-name', items[val]._links.self.href)
            wtkContElem.setAttribute('wtk-ingroup', name)
      if (contentType == "content-meta") {
        wtkContElem.innerHTML = metaTemplate.innerHTML 
      }
      target.appendChild(wtkContElem)
    })
    if (this.user) {
      const wtkContElem = document.createElement(`wtk-${contentType}`)
            wtkContElem.setAttribute('wtk-name', "")
            wtkContElem.setAttribute('wtk-ingroup', name)
      target.appendChild(wtkContElem)

      this.fetchWtkDep(`${this.base}/js/wtk-content-controls.js`)

      const wtkGroupCtrlElem = document.createElement('wtk-group-ctrl')
      target.insertBefore(wtkGroupCtrlElem, target.firstChild)
    }
  }
  async getContentData(name, groupName, target, targetType) {
    // get new content if name is not set and user is logged in
    if (!name && this.user) {
      this.fetchWtkDep(
        `${this.base}/js/wtk-new-${targetType}.js`,
        `wtk-new-${targetType}`,
        target)
      return false
    }
    // get ${targetType} data
    const path = groupName == null ?
      `/wtk/${targetType}s/${name}` :
      `/wtk/groups/${name}`
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) return false

    if (response.status == 204 && this.user) {
      this.fetchWtkDep(
        `${this.base}/js/wtk-new-${targetType}.js`,
        `wtk-new-${targetType}`,
        target)
      return false
    }
    if (response.status == 204) return false //TODO: set function to show empty 

    const cj = await response.json()
    target.setCJ(cj)
    return cj
  }
  async updateCJ(groupPath, name, target) {
    const path = `/wtk/${groupPath}/${name}`
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) return false
    target.setCJ(await response.json())
    return await response.json()
  }
  async visibleItems(content, wtkGroupName) {
    return new Promise(async (resolve, reject) => {
      return resolve(content)
      // TODO: visit this
      if (!wtkGroupName) { return resolve(content) }
      const path = `${this.apiOpen}/groups/${wtkGroupName}`
      const response = await fetch(path).catch(_ => {})
      if (!response.ok) return this.toast(response.statusText)
      const cj = await response.json()
      const visibleItems = cj.groupAttributes
      .map(val => {
        return content.groupAttributes[val.wtkAttrName]
        console.log(val);
        // items
      })

      return
      fetch()
        .then((data) => {
          return data.json()
        })
        .then((cj) => {
          let itemsToSend = []
          let formMetaData = [
            "wtkMetaName/",
            "wtkVisible/",

            "wtkMetaTitle/",
            "wtkMetaDescription/",
            "wtkMetaAuthor/",

            "wtkMetaOgUrl/",
            "wtkMetaOgType/",
            "wtkMetaOgLocale/",
            "wtkMetaOgImage/",
            "wtkMetaOgTitle/",
            "wtkMetaOgSiteName/",
            "wtkMetaOgDescription/",

            "wtkMetaTwitterCard/",
            "wtkMetaTwitterSite/",
            "wtkMetaTwitterTitle/",
            "wtkMetaTwitterDescription/",
            "wtkMetaTwitterImage/",
            "wtkMetaTwitterUrl/",

          ]
          items.forEach((val, key) => {
            if (formMetaData[key] != undefined) {
              return itemsToSend.push(val)
            }
            let item = cj._embedded.items.find((data) => {
              return data.href == val.href
            })
            if (item != undefined) {
              return itemsToSend.push(val)
            }
          })
          return resolve(itemsToSend)
        })
        .catch((err) => {
          return reject(err)
        })
    });
  }
  updateGroup(location) {
    const groupElem = 
      document.querySelectorAll(`wtk-group[wtk-name="${location}"]`)

    groupElem.forEach((val, key) => {
      val.innerHTML = ""
      val._getGroupData(location)
    })

    const groupMetaElem = 
      document.querySelectorAll(`wtk-group-meta[wtk-name="${location}"]`)

    groupMetaElem.forEach((val, key) => {
      val.innerHTML = ""
      val._getGroupData(location)
    })
  }
  updateContent(location) {
    const contElem = 
      document.querySelectorAll(`wtk-content[wtk-name="${location}"]`)

    contElem.forEach((val, key) => {
      val.innerHTML = ""
      val._getContentData(location)
    })

    let contMetaElem = 
      document.querySelectorAll(`wtk-content-meta[wtk-name="${location}"]`)

    contMetaElem.forEach((val, key) => {
      val.innerHTML = val.wtkMetaTemplate
      val._getContentData(location)
    })
  }
  addContentItem(path, target, inserWhere, type, imgSize, metaData) {
    let wtkContItem
    if (type == "text") {
      wtkContItem = document.createElement('wtk-content-textItem')
    }
    if (type == "img") {
      wtkContItem = document.createElement('wtk-content-imgItem')
      wtkContItem.setMetaData(metaData)
      wtkContItem.setSize(imgSize)
      wtkContItem.addEventListener('connectCE', (evt) => {
        wtkContItem.setSize(imgSize)
        wtkContItem.setMetaData(metaData)
      })
    }
    wtkContItem.setAttribute('wtk-item-href', path)

    if (inserWhere == null) {
      target.appendChild(wtkContItem)
    }
    if (inserWhere != null) {
      target.insertBefore(wtkContItem, inserWhere)
    }
  }
  async dropContentInGroup(location) {
    const groupHeaders = new Headers();
          groupHeaders.append('Content-Type', 'application/json');
          
    let conf = confirm("send?")
    if (!conf) { return }

    const path = `${this.api}/${location}`
    const response = await fetch(path, { 
      method: 'DELETE', 
      headers: groupHeaders 
    }).catch(_ => {})
    if (!response.ok) return this.toast(response.statusText)

    this.toast("meta groupy ulozeny.")
  }
  async addContentToGroup(location, groupName) {
    const groupHeaders = new Headers();
          groupHeaders.append('Content-Type', 'application/json');
    const path = `${this.api}/groups/${groupName}/contents`
    const response = await fetch(path, { 
      method: 'POST', 
      body: JSON.stringify({ location: location }),
      headers: groupHeaders 
    }).catch(_ => {})
    if (!response.ok) return this.toast(response.statusText)
    const { contentLocation } = await response.json()
    this.updateGroup(groupName)
    return this.toast("Content saved")
  }
  followPath(cj, path) {
    if (cj[path].wtkMetaValue) {
      return cj[path].wtkMetaValue
    }
    else{
      return cj[path]
    }
  }
  bindSingleElementHref(cj, element) {
    var path = element.getAttribute("wtk-href");
    var pathA = path.match(/(\[\()(.*?)(\)\])/g)
    if (pathA == null) { return }
    pathA = pathA.map((val, key) => {
      return val.replace('[', '')
        .replace('(', '')
        .replace(')', '')
        .replace(']', '')
    })
    if (element.nodeName == 'A') {
      let o = path
      pathA.forEach((val, key) => {
        let value = this.followPath(cj, val);
        o = o.replace('[(' + val + ')]', value)
      })
      element.href = o
    }
  }
  bindSingleElement(cj, element) {
    var path = element.getAttribute("wtk-data");
    if (element.nodeName == 'IMG') {
      element.src = this.followPath(cj, path);
    }
    else {
      element.innerText = this.followPath(cj, path);
    }
  }
  bindDataToTemplate(cj, element) {
    var holders = element.querySelectorAll("[wtk-data]");
    [].forEach.call(holders, this.bindSingleElement.bind(this, cj));

    var holdersHref = element.querySelectorAll("[wtk-href]");
    [].forEach.call(holdersHref, this.bindSingleElementHref.bind(this, cj));
  }
}
export default wtk