'use strict';
window.URL = window.URL || window.webkitURL;
if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = 
    function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i,
            el = this;
        do {
            i = matches.length;
            while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement)); 
        return el;
    };
}
class wtk {
  constructor(args) {
    this.base = "/js/wtk"
    this.contents=[]
    this.api="/wtk/auth"
    this.apiOpen="/wtk"
  }
  toast(msg, mainErr){
    console.log(msg)
    // let mainErr=errMsg.querySelector('.mad-main-errMsg')
    //     mainErr.innerText=msg
    //     mainErr.classList.add(err?'colE':'colC')
    let toastElm=document.createElement('div')
        toastElm.innerText=msg
          toastElm.style.position='fixed'
          toastElm.style.zIndex = 9999
          toastElm.style.top = '8px'
          toastElm.style.right = '8px'
          toastElm.style.backgroundColor = '#212121'
          toastElm.style.color = '#fff'
          toastElm.style.borderRadius = '3px'
          toastElm.style.padding = '4px 16px'
        document.body.appendChild(toastElm)
    setTimeout(function() {
      toastElm.parentNode.removeChild(toastElm)
      // mainErr.classList.remove('colE')
      // mainErr.classList.remove('colC')
      // mainErr.innerText=""
    }, 5000);
  }
  getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
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
  getGeneralMetadata(){
    return new Promise((resolve, reject) => {
      fetch(`${this.base}/wtkSettings.json`)
      .then((data) => {
        return data.json()
      })
      .then((settings) => {
        console.log(settings)
        return resolve(settings)
      })
      .catch((err) => {
        return reject(err)
      })
    });
  }
  fireEvent(customEvt, element){
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
  _fetchWtkDep(path, elem, target, attr){
    if (path==undefined || path==null || path=="") { return }

    let loadedScripts=document.querySelectorAll(`*[src="${path}"]`)
    if (loadedScripts.length == 0) { 
      let wtkScriptJS=document.createElement('script')
          wtkScriptJS.src=path;
          document.body.appendChild(wtkScriptJS);
    }
    // create and append element like wtk-content
    if (elem==undefined || elem==null || elem=="") { return }

    let wtkElem=document.createElement(elem)
    target.appendChild(wtkElem)
  }
  _getTinyMCEJS(){
    return new Promise((resolve, reject) => {
      let tinymceJS=document.createElement('script')
          // tinymceJS.src='http://cloud.tinymce.com/stable/tinymce.min.js?apiKey=4moevcayfzxxm4vucvd9dz88sxhdf7jfwc2cevej082ieb6z'
          tinymceJS.src=`${this.base}/tinymce_4.5.5/tinymce/js/tinymce/tinymce.min.js`
          tinymceJS.addEventListener('load', (ev) => {
            resolve()
          })
      document.body.appendChild(tinymceJS)
    });
  }
  addOptionsToSelect(elem, data){
    data.forEach((val, key) => {
      let opt = document.createElement('option')
          opt.innerText=val.name
          opt.value=val.value
          opt.selected=val.selected
      elem.appendChild(opt)
    })  
  }
  updateContentTextItem(location, target, type, groupPath){
    // let path=group ? 'groups' : 'contents'
    fetch(`/wtk/${groupPath}/${location}/content`)
    .then((data) => {
      return data.text()
    })
    .then((contData) => {
      // console.log(contData)
      let wtkCont=target.querySelector('wtk-tinymce')
          wtkCont.innerHTML=contData
    })
    .catch((err) => {
      this.wtkClass._toast(err)
      console.log(err)
    })
  }
  updateContentImgItem(location, target, type, groupPath){
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
      let imgElm=target.querySelector('wtk-imgFile img')

      let objectURL = window.URL.createObjectURL(contBlob);
      imgElm.src = objectURL;
      imgElm.onload = ()=> {
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
  updateGroup(location){
    console.log(location)
    let groupElem=document.querySelectorAll(`wtk-group[wtk-name="${location}"]`)
        groupElem.forEach((val, key) => {
          val.innerHTML=""
          val._getGroupData(location)  
        })

    let groupMetaElem=document.querySelectorAll(`wtk-group-meta[wtk-name="${location}"]`)
        groupMetaElem.forEach((val, key) => {
          val.innerHTML=""
          val._getGroupData(location)  
        })
  }
  updateContent(location){
    let contElem=document.querySelectorAll(`wtk-content[wtk-name="${location}"]`)
    console.log(contElem)
        contElem.forEach((val, key) => {
          val.innerHTML=""
          val._getContentData(location)  
        })

    let contMetaElem=document.querySelectorAll(`wtk-content-meta[wtk-name="${location}"]`)
    console.log(contMetaElem)
        contMetaElem.forEach((val, key) => {
          val.innerHTML=val.wtkMetaTemplate
          val._getContentData(location)  
        })
  }
  editContentData(location, target){
    console.log(lcoation)

  }
  addContentItem(path, target, inserWhere, type, imgSize, metaData){
    let wtkContItem
    if (type=="text") {
      wtkContItem=document.createElement('wtk-content-textItem')
    }
    if (type=="img") {
      wtkContItem=document.createElement('wtk-content-imgItem')
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
      if (inserWhere==null) {
        target.appendChild(wtkContItem)
      }
      if (inserWhere!=null) {
        target.insertBefore( wtkContItem, inserWhere )
      }

    // target.appendChild(wtkContItem)
  }
  dropContentInGroup(location){
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
    // return 
    // console.log(location)
    let conf=confirm("send?")
    if (!conf) { return }
    fetch(`${this.api}/${location}`, {method:'DELETE', headers:myHeaders})
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
  addContentToGroup(location, path){
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
    // return 
    // console.log(location)
    // let conf=confirm("send?")
    // if (!conf) { return }
    fetch(`${this.api}/groups/${path}/contents`, {method:'POST', body:JSON.stringify({location:location}), headers:myHeaders})
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
  moveContentItem(location, target, moveWhere){
    target.insertBefore( wtkContItem, target.lastChild )
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
    let metaData=items.find((data) => {
      return data.href==path+'/'
    })
    if (metaData==undefined) { return "" }
    return metaData.data.find((data) => {
      return data.name=="wtkMetaValue"
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
    var pathA=path.match(/(\[\()(.*?)(\)\])/g)
    if (pathA==null) { return }
    pathA=pathA.map((val, key) => {
      return val.replace('[','')
          .replace('(','')
          .replace(')','')
          .replace(']','')
    })
    if (element.nodeName=='A') {
      let o=path
      pathA.forEach((val, key) => {
        let value = this.followPath(data, val);
        o=o.replace('[('+val+')]',value)
      })
      element.href = o 
    }
  }
  bindSingleElement(data, element) {
    var path = element.getAttribute("wtk-data");
    if (element.nodeName=='IMG') {
      element.src = this.followPath(data, path);
    }
    else{
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
class validateInput{
  _validateInput(target){
    let required=target.getAttribute('required');
    let pattern=target.getAttribute('pattern');
    let patternReg=new RegExp(pattern);
    let requiredMsg=target.parentNode.querySelector('.errMsg.required');
    let patternMsg=target.parentNode.querySelector('.errMsg.pattern');
    //check required
    console.log(target)
    //if "" pattern must be opacity:0 too
    if (target.value=="") { 
      requiredMsg.style.opacity=1; 
      patternMsg.style.opacity=0; 
      target.style.borderColor='red';
      return false; 
    }
    else{ 
      requiredMsg.style.opacity=0; 
      target.style.borderColor='rgba(0,0,0,0.1)';
    }
    if (pattern!=null && !patternReg.test(target.value)) { 
      patternMsg.style.opacity=1; 
      return false;
    }
    else{ 
      patternMsg.style.opacity=0; 
      target.style.borderColor='rgba(0,0,0,0.1)';
      return true;
    }
  }
  _onKeyDown(evt){
    const target = evt.target;
    //if TAB validate input
    if (evt.keyCode==9) { this._validateInput(target); }
    else{ clearTimeout(this.validTimeout); }
  }
  _onKeyUp(evt){
    const target = evt.target;
    clearTimeout(this.validTimeout);
    this.validTimeout=setTimeout(()=>{
      this._validateInput(target);
    }, 500);
  }
}
// CONTENT
class wtkContentElem extends HTMLElement{
  constructor(args){
    super()
    this.wtkClass=new wtk();
  }
  connectedCallback(){
    this.wtkName=this.getAttribute('wtk-name')
    this.wtkGroupName=this.getAttribute('wtk-ingroup')
    this.user=this._getCookie('userForWeb') || false;  // <=PREPSAT !!!!!
    this.cj={}
    this.target=this
    this.setAttribute('id', 'wtk_'+this.wtkName.replace('/','_'))
    this._getContentData(this.wtkName)
    console.log(this.user)
  }
  getWtkName(){
    return this.wtkName
  }
  getShadow(){
    return this.target
  }
  getCJ(){
    return this.cj
  }
  setCJ(cj){
    this.cj=cj
  }
  updateCJ(groupPath, name){
    fetch(`/wtk/${groupPath}/${this.wtkName}/items`)
    .then((data) => {
      // console.log(data)
      return data.json()
    })
    .then((cj) => {
      this.setCJ(cj)
      // console.log(cj)
    })
    .catch((err) => {
      console.log(err)
    });
  }
  getItemByID(id){
    return this.cj.collection.items.find((val) => {
      return val.href==id
    })
  }
  _appendWtkContentItemsData(cj, name){
    cj.collection.items.forEach((val, key) => {

      let wtkWidth=val.data.find((data) => {
        return data.name=="wtkWidth"
      })
      let wtkHeight=val.data.find((data) => {
        return data.name=="wtkHeight"
      })
      let imgSize=undefined
      if (wtkWidth!=undefined && wtkHeight!=undefined) {
        imgSize={wtkWidth:wtkWidth.value, wtkHeight:wtkHeight.value}
      }
      let wtkType=val.data.find((data) => {
        return data.name=="wtkType"
      })
      // console.log(wtkType)
      this.wtkClass.addContentItem(val.href, this.target, null, wtkType.value, imgSize, val)
      // let wtkContItem=document.createElement('wtk-content-item')
      //     wtkContItem.setAttribute('wtk-item-href', val.href)
      //     wtkContItem.setAttribute('wtk-content-name', name)
      //     console.log(wtkContItem)
      // this.target.appendChild(wtkContItem)
    })
  }
  _getContentData(name){
    if (name=="") {
      this.wtkClass._fetchWtkDep(
          `${this.wtkClass.base}/js/wtk-new-content.js`, 
          'wtk-new-content', 
          this.target) 
      return
    }
    // console.log(this.wtkGroupName)
    let path=this.wtkGroupName==null ? `/wtk/contents/${name}/items` : `/wtk/groups/${name}/items`
    fetch(path)
    .then((data) => {
      // is loged in
      // console.log(data.status)
      if (data.status==204 && this.user) {  
        this.wtkClass._fetchWtkDep(
          `${this.wtkClass.base}/js/wtk-new-content.js`, 
          'wtk-new-content', 
          this.target) 
      }
      else { 
        // is loged in and has data
        // console.log(data)
        return data.json()          
      }
    })
    .then((cj) => {
      console.log(cj)
      this.setCJ(cj)
      this._appendWtkContentItemsData(cj, this.wtkName);
      if (this.user) {
        this.wtkClass._fetchWtkDep(
            `${this.wtkClass.base}/js/wtk-content-controls.js`, 
            'wtk-content-ctrl', 
            this.target) 
      }
    })
    .catch((err) => {
      console.log(err)
      //...
    });
  }
  _getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
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
}
customElements.forcePolyfill = true;
customElements.define('wtk-content', wtkContentElem);

// CONTENT META
class wtkContentMetaElem extends  HTMLElement{
  constructor(args){
    super()
    this.wtkClass=new wtk();
  }
  connectedCallback(){
    this.wtkName=this.getAttribute('wtk-name')
    this.wtkGroupName=this.getAttribute('wtk-ingroup')
    this.user=this._getCookie('userForWeb') || false;  // <=PREPSAT !!!!!
    this.wtkMetaTemplate=this.innerHTML
    this.cj={}
    this.target=this
    if (this.wtkName!=null) { this.setAttribute('id', 'wtk_'+this.wtkName.replace('/','_')) }
    
    this._getContentData(this.wtkName)
  }
  getWtkName(){
    return this.wtkName
  }
  getShadow(){
    return this.target
  }
  getCJ(){
    return this.cj
  }
  setCJ(cj){
    this.cj=cj
  }
  updateCJ(name){
    let path=this.wtkGroupName==null ? `/wtk/contents/${name}/items` : `/wtk/groups/${name}/items`
    fetch(`/wtk/${path}/${this.wtkName}`)
    .then((data) => {
      // console.log(data)
      return data.json()
    })
    .then((cj) => {
      this.setCJ(cj)
      // console.log(cj)
    })
    .catch((err) => {
      console.log(err)
    });
  }
  getItemByID(id){
    return this.cj.collection.items.find((val) => {
      return val.href==id
    })
  }
  _appendWtkContentMetaData(target){
    let wtkContentMetaCtrl=document.createElement('wtk-content-ctrl')
    target.appendChild(wtkContentMetaCtrl)
  }
  _visibleItems(items, wtkGroupName){
    return new Promise((resolve, reject) => {
        
      if (wtkGroupName==null) { return resolve(items) }
      fetch(`${this.wtkClass.apiOpen}/groups/${wtkGroupName}`)
      .then((data) => {
        return data.json()
      })
      .then((cj) => {
        let itemsToSend=[]
        let formMetaData=[
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
          if (formMetaData[key]!=undefined) {
            return itemsToSend.push(val)
          }
          let item=cj.collection.items.find((data) => {
            return data.href==val.href
          })
          if (item!=undefined) {
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
  _getContentData(name){
    console.log(this.wtkName)
    console.log(name)
    if (!this.wtkName && this.user) {
      this.wtkClass._fetchWtkDep(
          `${this.wtkClass.base}/js/wtk-new-content.js`, 
          'wtk-new-content', 
          this.target) 
      return
    }
    if (!this.wtkName) { return }
    // console.log(this.wtkGroupName)
    let path=this.wtkGroupName==null ? `/wtk/contents/${name}` : `/wtk/groups/${name}`
    fetch(`${path}`)
    .then((data) => {
      // is loged in
      console.log(data.status)
      console.log(name)
      console.log(path)
      console.log(this.target)
      console.log(this)

      if (data.status==204 && this.user) {  
        this.wtkClass._fetchWtkDep(
          `${this.wtkClass.base}/js/wtk-new-content.js`, 
          'wtk-new-content', 
          this.target) 
        throw ''
      }
      else if (data.status==200) { 
        // is loged in and has data
        console.log(data)
        return data.json()          
      }
    })
    .then((cj) => {
      console.log(cj)
      this.setCJ(cj)
      
      // this._appendWtkContentMetaData(this);
      if (this.user) {
        this.wtkClass._fetchWtkDep(
            `${this.wtkClass.base}/js/wtk-content-controls.js`, 
            'wtk-content-ctrl', 
            this.target) 
      }
      return this._visibleItems(cj.collection.items, this.wtkGroupName)
    })
    .then((items) => {
      this.wtkClass.bindDataToTemplate(items, this)
    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
      //...
    });
  }
  _getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
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
}
customElements.define('wtk-content-meta', wtkContentMetaElem);

// GROUP
class wtkGroupElem extends HTMLElement{
  constructor(args){
    super()
    this.wtkClass=new wtk();
  }
  connectedCallback(){
    this.wtkName=this.getAttribute('wtk-name')
    this.user=this.wtkClass.getCookie('userForWeb') || false;  // <=PREPSAT !!!!!
    // this.wtkMetaTemplate=this.innerHTML
    this.cj={}
    this.target=this
    this.setAttribute('id', 'wtk_'+this.wtkName.replace('/','_'))
    this._getGroupData(this.wtkName)
  }
  _getGroupData(wtkName){
    fetch(`/wtk/groups/${wtkName}/contents`)
    .then((data) => {
      // is loged in
      // console.log(data.status)
      if (data.status==204 && this.user) {  
        this.wtkClass._fetchWtkDep(
          `${this.wtkClass.base}/js/wtk-new-group.js`, 
          'wtk-new-group', 
          this.target) 
      }
      else { 
        // is loged in and has data
        // console.log(data)
        return data.json()          
      }
    })
    .then((cj) => {
      // console.log(cj)
      // this.setCJ(cj)
      // this.wtkClass.bindDataToTemplate(cj.collection.items, this)
      // console.log(this.wtkName)
      this._appendWtkGroupItemsData(cj);
      if (this.user) {
        this.wtkClass._fetchWtkDep(
            `${this.wtkClass.base}/js/wtk-content-controls.js`, 
            'wtk-content-meta-ctrl', 
            this.target) 
      }
    })
    .catch((err) => {
      console.log(err)
      //...
    });
  }
  _appendWtkGroupItemsData(cj){
    // console.log(this.wtkName)
    // if (cj.collection.items.length==0) {
    // }
    cj.collection.items.forEach((val, key) => {
      let wtkContElem=document.createElement('wtk-content')
          wtkContElem.setAttribute('wtk-name', val.href)
          wtkContElem.setAttribute('wtk-ingroup', this.wtkName)
      this.target.appendChild(wtkContElem)
    })
    if (this.user) {

      let wtkContElem=document.createElement('wtk-content')
          wtkContElem.setAttribute('wtk-name', "")
          wtkContElem.setAttribute('wtk-ingroup', this.wtkName)
      this.target.appendChild(wtkContElem)

      let wtkGroupCtrlElem=document.createElement('wtk-group-ctrl')
      this.insertBefore(wtkGroupCtrlElem, this.firstChild)
    }
  }
}
customElements.define('wtk-group', wtkGroupElem);

// GROUP META
class wtkGroupMetaElem extends HTMLElement{
  constructor(args){
    super()
    this.wtkClass=new wtk();
  }
  connectedCallback(){
    this.wtkName=this.getAttribute('wtk-name')
    this.user=this.wtkClass.getCookie('userForWeb') || false;  // <=PREPSAT !!!!!
    this.wtkMetaTemplate=this.cloneNode(true)//this.innerHTML
    this.innerHTML=""
    this.cj={}
    this.target=this
    this.setAttribute('id', 'wtk_'+this.wtkName.replace('/','_'))
    this._getGroupData(this.wtkName)
  }
  _getGroupData(wtkName){
    fetch(`/wtk/groups/${wtkName}/contents`)
    .then((data) => {
      // is loged in
      // console.log(data.status)
      if (data.status==204 && this.user) {  
        this.wtkClass._fetchWtkDep(
          `${this.wtkClass.base}/js/wtk-new-group.js`, 
          'wtk-new-group', 
          this.target) 
      }
      else { 
        // is loged in and has data
        // console.log(data)
        return data.json()          
      }
    })
    .then((cj) => {
      // console.log(cj)
      // this.setCJ(cj)
      // this.wtkClass.bindDataToTemplate(cj.collection.items, this)
      // console.log(this.wtkName)
      this._appendWtkGroupItemsMetaData(cj);
      if (this.user) {
        this.wtkClass._fetchWtkDep(
            `${this.wtkClass.base}/js/wtk-content-controls.js`, 
            'wtk-content-meta-ctrl', 
            this.target) 
      }
    })
    .catch((err) => {
      console.log(err)
      //...
    });
  }
  _appendWtkGroupItemsMetaData(cj){
    // console.log(this.wtkName)
    // if (cj.collection.items.length==0) {
    // }
    console.log(this.wtkMetaTemplate) 
    cj.collection.items.forEach((val, key) => {
      let wtkContElem=this.wtkMetaTemplate.querySelector('wtk-content-meta') || this.wtkMetaTemplate.querySelector('wtk-content')
          wtkContElem.setAttribute('wtk-name', val.href)
          wtkContElem.setAttribute('wtk-ingroup', this.wtkName)
          // wtkContElem.innerHTML=this.wtkMetaTemplate
      console.log(this.wtkMetaTemplate)
    // return
      this.target.innerHTML+=this.wtkMetaTemplate.innerHTML
      // return
      // this.target.appendChild(wtkContElem)
    })

    if (this.user) {
      let wtkContElem=document.createElement('wtk-content')
          wtkContElem.setAttribute('wtk-name', "")
          wtkContElem.setAttribute('wtk-ingroup', this.wtkName)
          // wtkContElem.innerHTML=this.wtkMetaTemplate
      this.target.appendChild(wtkContElem)


      let wtkGroupCtrlElem=document.createElement('wtk-group-ctrl')
      this.insertBefore(wtkGroupCtrlElem, this.firstChild)
    }
  }
}
customElements.define('wtk-group-meta', wtkGroupMetaElem);

// CONTENT TEXT ITEM
class wtkContentTextItemElem extends HTMLElement {
  constructor(args) {
    super()
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.itemHref=this.getAttribute('wtk-item-href')
    this.groupName=this.closest('wtk-content').getAttribute('wtk-ingroup')
    this.setAttribute('id', 'wtk_'+this.itemHref.replace('/','_'))

    this._fetchItemData(this.itemHref)
    // let pos=this.parentNode.getItemByID(this.itemHref)
    // pos = pos.data.find((val) => {
    //   return val.name=="wtkPosition"
    // })
    // pos=pos.value

    // let poss=document.createElement('h1')
    //     poss.innerHTML=pos + " - " + this.itemHref
    // this.appendChild(poss)
  }
  _fetchItemData(href){
    let path=this.groupName==null ? 'contents' : 'groups'
    fetch(`/wtk/${path}/${href}/content`)
    .then((data) => {
      return data.text()
    })
    .then((contData) => {
      let wtkCont=document.createElement('wtk-tinyMCE')
          wtkCont.innerHTML=contData
      this.appendChild(wtkCont)

      let wtkItemCtrlElem=document.createElement('wtk-item-ctrl')
      this.appendChild(wtkItemCtrlElem)
    })
    .catch((err) => {
      this.wtkClass._toast(err)
      console.log(err)
    })
  }
  // methods
}
customElements.define('wtk-content-textitem', wtkContentTextItemElem);

// CONTENT IMG ITEM
class wtkContentImgItemElem extends HTMLElement {
  constructor(args) {
    super()
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.itemHref=this.getAttribute('wtk-item-href')
    this.groupName=this.closest('wtk-content').getAttribute('wtk-ingroup')

    this.setAttribute('id', 'wtk_'+this.itemHref.replace('/','_'))
    this.wtkClass.fireEvent('connectCE', this)
    this._fetchItemData(this.itemHref)
  }
  setMetaData(metaData){
    console.log(metaData)
    this.metaData=metaData
  }
  getMetaData(){
    return this.metaData
  }
  setSize(imgSize){
    let wtkImgFile=this.querySelector('wtk-imgFile img')
    if (imgSize!=undefined) {
      this.imgSize=imgSize  
    }
    if (this.imgSize!=undefined && wtkImgFile!=undefined) {
      wtkImgFile.style.width=this.imgSize.wtkWidth
      wtkImgFile.style.height=this.imgSize.wtkHeight
    }
  }
  _fetchItemData(href){
    let path=this.groupName==null ? 'contents' : 'groups'
    fetch(`/wtk/${path}/${href}/content`)
    .then((data) => {
      return data.blob()
    })
    .then((contBlob) => {
      let wtkCont=document.createElement('wtk-imgFile')
      let imgElm=document.createElement('img')

      let objectURL = window.URL.createObjectURL(contBlob);
      imgElm.src = objectURL;
      imgElm.onload = ()=> {
        // wouldnt show img on edit 
        // window.URL.revokeObjectURL(imgElm.src);
      }
      wtkCont.appendChild(imgElm)
      this.appendChild(wtkCont)
      this.setSize()

      let wtkItemCtrlElem=document.createElement('wtk-item-ctrl')
      this.appendChild(wtkItemCtrlElem)
    })
    .catch((err) => {
      this.wtkClass._toast(err)
      console.log(err)
    })
  }
  // methods
}
customElements.define('wtk-content-imgitem', wtkContentImgItemElem);

// SEARCH
class wtkSearchElem extends HTMLElement {
  constructor(args) {
    super()
    this.wtkClass=new wtk();
  }
  connectedCallback(){
    this.wtkNames=this.getAttribute('wtk-names').split(',')
    this.wtkOpt=this.getAttribute('wtk-options').split(',')
    
    this._searchElemInit()
  }
  _searchElemInit(){
    this.target=this
    fetch(`${this.wtkClass.base}/views/search.html`)
    .then((data) => {
      return data.text()
    })
    .then((html) => {
      this.target.innerHTML=html
      this._alocEvents()
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _alocEvents(){
    this.searchInput=this.target.querySelector('input[type="search"]')
    this.searchInput.addEventListener('keyup', this._onKeyUp.bind(this))
    this.searchInput.addEventListener('keydown', this._onKeyDown.bind(this))
    this.searchInput.addEventListener('search', this._onKeyUp.bind(this))
    this.submitInput=this.target.querySelector('input[type="submit"]')

    this.wtkSearchTemplate=this.target.querySelector('.wtkSearchTemplate')
    this.wtkSTHtml=this.wtkSearchTemplate.innerHTML

    this.wtkSearchForm=this.target.querySelector('form')
    this.wtkSearchForm.addEventListener('submit', (evt) =>{ evt.preventDefault() })  
  }
  _fetchSearchData(query){
    console.log(query)
    this._dropHint()
    if (query=="") { return }
    this.wtkNames.forEach((val, key) => {
      console.log(val)
      fetch(`${this.wtkClass.apiOpen}/search?query=${query}&wtkName=${val}&wtkOpt=${this.wtkOpt}`)
      .then((data) => {
        console.log(data)
        if (data.status!=204) {
          return data.json()
        }else{
          return "Bohužel jsme nic nenašli."
        }
      })
      .then((cjList) => {
        console.log(cjList)
        this._buildHint(cjList)
        // this._dropHint()
      })
      .catch((err) => {
        console.log(err)
        this.wtkClass.toast(err)
      })
    })
  }
  _dropHint(){
    this.wtkSearchTemplate.innerHTML=""
    this.wtkSearchTemplate.setAttribute('style',`
        opacity: 0;
        pointer-events:none;`)
  }
  _buildHint(cjList){
    // let li=this.target.querySelector('li')
    let y = this.searchInput.getBoundingClientRect().height;
    this.wtkSearchTemplate.setAttribute('style',`
        opacity: 1;
        pointer-events:initial;
        transform:translateY(${y}px);`)
    if (typeof cjList=="string") {
      return this.wtkSearchTemplate.innerHTML="<li>Bohužel jsme nic nenašli.</li>"
    }
    cjList.forEach((cj, key) => {
      //...

      let stHtml=document.createElement('div')
          stHtml.innerHTML=this.wtkSTHtml
      this.wtkClass.bindDataToTemplate(cj.collection.items, stHtml)
      this.wtkSearchTemplate.innerHTML+=stHtml.innerHTML
      // let newTemplateChild=document.createElement(this.wtkSearchTemplate.firstChild.tagName.toLowerCase())
          // liNew.innerHTML=li.innerHTML

      // ul.appendChild(liNew)
      
      // console.log(val)
      // this.wtkClass.bindDataToTemplate(this.wtkClass.getVisibleItems(val, val.href), this.wtkSearchTemplate)
    })
  }
  _visibleItems(items, wtkGroupName){
    return new Promise((resolve, reject) => {
        
      if (wtkGroupName==null) { return resolve(items) }
      fetch(`${this.wtkClass.apiOpen}/groups/${wtkGroupName}`)
      .then((data) => {
        return data.json()
      })
      .then((cj) => {
        let itemsToSend=[]
        let formMetaData=[
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
          if (formMetaData[key]!=undefined) {
            return itemsToSend.push(val)
          }
          let item=cj.collection.items.find((data) => {
            return data.href==val.href
          })
          if (item!=undefined) {
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
  _onKeyDown(evt){
    const target = evt.target;
    let query=target.value

    //if TAB validate input
    if (evt.keyCode==9) { this._fetchSearchData(query); }
    else{ clearTimeout(this.validTimeout); }
  }
  _onKeyUp(evt){
    const target = evt.target;
    let query=target.value

    clearTimeout(this.validTimeout);
    this.validTimeout=setTimeout(()=>{
      this._fetchSearchData(query);
    }, 500);
  }

}
customElements.define('wtk-search', wtkSearchElem);
