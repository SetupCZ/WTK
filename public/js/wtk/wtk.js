class wtk {
  constructor(args) {
    this.base = "/js/wtk"
    this.contents = []
    this.api = "/wtk/auth"
    this.apiOpen = "/wtk"
    this.user = this._getCookie('userForWeb') || false;  // <=PREPSAT !!!!!
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
    if (loadedScripts.length == 0) {
      const wtkScriptJS = document.createElement('script')
            wtkScriptJS.type = "module" //TODO: babel 
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
    console.log(cj);
    const items = cj._embedded.items
    console.log(name);
    Object.keys(items)
    .forEach((val, key) => {
      const wtkContElem = document.createElement(`wtk-${contentType}`)
            wtkContElem.setAttribute('wtk-name', items[val]._links.self.href)
            wtkContElem.setAttribute('wtk-ingroup', name)
      if (contentType == "content-meta") {
        console.log(metaTemplate);
        wtkContElem.innerHTML = metaTemplate.innerHTML 
      }
      target.appendChild(wtkContElem)
      console.log(wtkContElem);
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

    console.log(response);
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
      console.log(content);
        // TODO: visit this
        return resolve(content)
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
  updateContentTextItem(location, target, type, groupPath) {
    // let path=group ? 'groups' : 'contents'
    fetch(`/wtk/${groupPath}/${location}/content`)
      .then((data) => {
        return data.text()
      })
      .then((contData) => {
        // console.log(contData)
        let wtkCont = target.querySelector('wtk-tinymce')
        wtkCont.innerHTML = contData
      })
      .catch((err) => {
        this.wtkClass._toast(err)
        console.log(err)
      })
  }
  updateContentImgItem(location, target, type, groupPath) {
    // let path=group ? 'groups' : 'contents'

    fetch(`/wtk/${groupPath}/${location}`)
      .then((data) => {
        return data.json()
      })
      .then((metaData) => {
        console.log(metaData)
        target.setMetaData(metaData.collection.items[0])
      })
      .catch((err) => {
        this.toast(err)
      });
    fetch(`/wtk/${groupPath}/${location}/content`)
      .then((data) => {
        return data.blob()
      })
      .then((contBlob) => {
        let imgElm = target.querySelector('wtk-imgFile img')

        let objectURL = window.URL.createObjectURL(contBlob);
        imgElm.src = objectURL;
        imgElm.onload = () => {
          // window.URL.revokeObjectURL(imgElm.src);
        }
        // wtkCont.appendChild(imgElm)
        // this.appendChild(wtkCont)

        // let wtkItemCtrlElem=document.createElement('wtk-item-ctrl')
        // this.appendChild(wtkItemCtrlElem)
      })
      .catch((err) => {
        this.toast(err)
        console.log(err)
      })
  }
  updateGroup(location) {
    console.log(location)
    let groupElem = document.querySelectorAll(`wtk-group[wtk-name="${location}"]`)
    groupElem.forEach((val, key) => {
      val.innerHTML = ""
      val._getGroupData(location)
    })

    let groupMetaElem = document.querySelectorAll(`wtk-group-meta[wtk-name="${location}"]`)
    groupMetaElem.forEach((val, key) => {
      val.innerHTML = ""
      val._getGroupData(location)
    })
  }
  updateContent(location) {
    let contElem = document.querySelectorAll(`wtk-content[wtk-name="${location}"]`)
    console.log(contElem)
    contElem.forEach((val, key) => {
      val.innerHTML = ""
      val._getContentData(location)
    })

    let contMetaElem = document.querySelectorAll(`wtk-content-meta[wtk-name="${location}"]`)
    console.log(contMetaElem)
    contMetaElem.forEach((val, key) => {
      val.innerHTML = val.wtkMetaTemplate
      val._getContentData(location)
    })
  }
  editContentData(location, target) {
    console.log(lcoation)

  }
  addContentItem(path, target, inserWhere, type, imgSize, metaData) {
    let wtkContItem
    if (type == "text") {
      wtkContItem = document.createElement('wtk-content-textItem')
    }
    if (type == "img") {
      wtkContItem = document.createElement('wtk-content-imgItem')
      console.log(imgSize)
      console.log(metaData)
      console.log(wtkContItem)
      wtkContItem.setMetaData(metaData)
      wtkContItem.setSize(imgSize)
      wtkContItem.addEventListener('connectCE', (evt) => {
        console.log(evt)
        console.log('---------------------------------')
        wtkContItem.setSize(imgSize)
        wtkContItem.setMetaData(metaData)

      })
    }
    wtkContItem.setAttribute('wtk-item-href', path)
    // wtkContItem.setAttribute('wtk-content-name', name)
    // console.log(wtkContItem)
    // console.log(target)
    // console.log(inserWhere)
    // console.log('------------------->',wtkContItem)
    if (inserWhere == null) {
      target.appendChild(wtkContItem)
    }
    if (inserWhere != null) {
      target.insertBefore(wtkContItem, inserWhere)
    }

    // target.appendChild(wtkContItem)
  }
  dropContentInGroup(location) {
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    // return 
    // console.log(location)
    let conf = confirm("send?")
    if (!conf) { return }
    fetch(`${this.api}/${location}`, { method: 'DELETE', headers: myHeaders })
      .then((data) => {
        return data.text()
      })
      .then((data) => {
        // console.log(data)
        // this._closeAlocNewGroupClick()

        this.toast("meta groupy ulozeny.")
        // this.wtkClass._fetchWtkDep(null, 'wtk-aloc-new-group', document.body)



      })
      .catch((err) => {
        console.log(err)
        this.toast(err)
      })
  }
  async addContentToGroup(location, groupName) {
    console.log('in addContentToGroup');
    const groupHeaders = new Headers();
          groupHeaders.append('Content-Type', 'application/json');
    const path = `${this.api}/groups/${groupName}/contents`
    const response = fetch(path, { 
      method: 'POST', 
      body: JSON.stringify({ location: location }),
      headers: groupHeaders 
    }).catch(_ => {})
    if (!response.ok) return this.toast(response.statusText)
    const { contentLocation } = await response.json()
    console.log('ok');
    this.updateGroup(groupName)
    return this.toast("Content saved")
  }
  moveContentItem(location, target, moveWhere) {
    target.insertBefore(wtkContItem, target.lastChild)
  }

  followPath(cj, path) {
    /**
     * follows a path on the given data to retrieve a value
     *
     * @example
     * var data = { foo : { bar : "abc" } };
     * followPath(data, "foo.bar"); // "abc"
     * 
     * @param  {Object} data the object to get a value from
     * @param  {String} path a path to a value on the data object
     * @return the value of following the path on the data object
     */
    console.log('-----------------------------------------');
    console.log(cj);
    if (cj[path].wtkMetaValue) {
      return cj[path].wtkMetaValue
    }
    else{
      return cj[path]
    }
  }
  bindSingleElementHref(data, element) {
    /**
     * sets value of an element based on it's data-value attribute
     * 
     * @param  {Object}  data     the data source
     * @param  {Element} element  the element
     */
    var path = element.getAttribute("wtk-href");
    // var pathA=path.split('((')
    // var pathA=pathA.split('))')
    // var pathA=str.substring(str.lastIndexOf("((")+1,str.lastIndexOf("))"));
    // var pathA=path.split(/[(())]/);
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
        let value = this.followPath(data, val);
        o = o.replace('[(' + val + ')]', value)
      })
      element.href = o
    }
  }
  bindSingleElement(cj, element) {
    console.log(cj);
    var path = element.getAttribute("wtk-data");
    if (element.nodeName == 'IMG') {
      element.src = this.followPath(cj, path);
    }
    else {
      element.innerText = this.followPath(cj, path);
    }
  }
  bindDataToTemplate(cj, element) {
    /**
     * Binds data object to an element. Allows arbitrary nesting of fields
     *
     * @example
     * <div class="user">
     *   <p data-value="name"></p>
     * </div>
     * 
     * var element = document.querySelector(".user");
     * bind({ name : "Nick" }, element);
     * 
     * @param  {Object}  data     the data to bind to an element
     * @param  {Element} element  the element to bind data to
     */
    console.log(element);
    var holders = element.querySelectorAll("[wtk-data]");
    [].forEach.call(holders, this.bindSingleElement.bind(this, cj));

    var holdersHref = element.querySelectorAll("[wtk-href]");
    [].forEach.call(holdersHref, this.bindSingleElementHref.bind(this, cj));
  }
  // methods
}
export default wtk