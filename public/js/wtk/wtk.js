class wtk {
  constructor(args) {
    this.base = "/js/wtk"
    this.contents = []
    this.api = "/wtk/auth"
    this.apiOpen = "/wtk"
    this.user = this.getCookie('userForWeb') || false;  // <=PREPSAT !!!!!
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
  getCookie(cname) {
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
    if (!response.ok) return this.toast(response.statusText)
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
  _fetchWtkDep(path, elem, target, attr) {
    if (path == undefined || path == null || path == "") { return }

    let loadedScripts = document.querySelectorAll(`*[src="${path}"]`)
    if (loadedScripts.length == 0) {
      let wtkScriptJS = document.createElement('script')
      wtkScriptJS.src = path;
      document.body.appendChild(wtkScriptJS);
    }
    // create and append element like wtk-content
    if (elem == undefined || elem == null || elem == "") { return }

    let wtkElem = document.createElement(elem)
    target.appendChild(wtkElem)
  }
  _getTinyMCEJS() {
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
      let opt = document.createElement('option')
      opt.innerText = val.name
      opt.value = val.value
      opt.selected = val.selected
      elem.appendChild(opt)
    })
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
  addContentItem(path, target, inserWhere, type, imgSize, metaData){
    let wtkContItem
    if (type == "text") {
      wtkContItem = document.createElement('wtk-content-textItem')
    }
    if (type == "img") {
      wtkContItem = document.createElement('wtk-content-imgItem')
      console.log(imgSize)
      console.log(metaData)
      console.log(wtkContItem)
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
        // this.wtkClass.__fetchWtkDep(null, 'wtk-aloc-new-group', document.body)



      })
      .catch((err) => {
        console.log(err)
        this.toast(err)
      })
  }
  addContentToGroup(location, path) {
    let myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    // return 
    // console.log(location)
    // let conf=confirm("send?")
    // if (!conf) { return }
    fetch(`${this.api}/groups/${path}/contents`, { method: 'POST', body: JSON.stringify({ location: location }), headers: myHeaders })
      .then((data) => {
        return data.text()
      })
      .then((location) => {
        console.log(location)
        // this._closeAlocNewGroupClick()
        this.updateGroup(path)
        // this.updateContent(location)

        this.toast("meta groupy ulozeny.")
        // this.wtkClass.__fetchWtkDep(null, 'wtk-aloc-new-group', document.body)



      })
      .catch((err) => {
        console.log(err)
        this.toast(err)
      })
  }
  moveContentItem(location, target, moveWhere) {
    target.insertBefore(wtkContItem, target.lastChild)
  }

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
  followPath(items, path) {
    let metaData = items.find((data) => {
      return data.href == path + '/'
    })
    if (metaData == undefined) { return "" }
    return metaData.data.find((data) => {
      return data.name == "wtkMetaValue"
    }).value

    // return path.split(".").reduce(function(prev, curr) {
    //   return prev && prev[curr];
    // }, data);
  }
  /**
   * sets value of an element based on it's data-value attribute
   * 
   * @param  {Object}  data     the data source
   * @param  {Element} element  the element
   */
  bindSingleElementHref(data, element) {
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
  bindSingleElement(data, element) {
    var path = element.getAttribute("wtk-data");
    if (element.nodeName == 'IMG') {
      element.src = this.followPath(data, path);
    }
    else {
      element.innerText = this.followPath(data, path);
    }
  }
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
  bindDataToTemplate(data, element) {
    var holders = element.querySelectorAll("[wtk-data]");
    [].forEach.call(holders, this.bindSingleElement.bind(this, data));

    var holdersHref = element.querySelectorAll("[wtk-href]");
    [].forEach.call(holdersHref, this.bindSingleElementHref.bind(this, data));
  }
  // methods
}
export default wtk