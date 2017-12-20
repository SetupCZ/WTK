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

import validateInput from './wtkValidateInput.js'
import wtk from './wtk.js'

// CONTENT
class wtkContentElem extends HTMLElement{
  constructor(args){
    super()
    this.wtkClass=new wtk();
  }
  connectedCallback(){
    this.wtkName = this.getAttribute('wtk-name')
    this.wtkGroupName = this.getAttribute('wtk-ingroup')
    this.cj = {}
    this.target = this
    if (this.wtkName != null) { this.setAttribute('id', 'wtk_' + this.wtkName.replace('/', '_')) }
    
    this._getContentData()
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
  getItemByID(id){
    return this.cj._embedded.items[id]
  }
  async _getContentData(){
    const cj = await this.wtkClass.getContentData(this.wtkName, this.wtkGroupName, this.target, "content")
    if (!cj) return 
    this.wtkClass.appendWtkContentItemsData(cj, this.wtkName, this.target);
  }

}
customElements.forcePolyfill = true;
customElements.define('wtk-content', wtkContentElem);

// TODO:
// CONTENT META
class wtkContentMetaElem extends  HTMLElement{
  constructor(args){
    super()
    this.wtkClass=new wtk();
  }
  connectedCallback(){
    this.wtkName=this.getAttribute('wtk-name')
    this.wtkGroupName=this.getAttribute('wtk-ingroup')
    this.wtkMetaTemplate = this.cloneNode(true)//this.innerHTML
    // this.wtkMetaTemplate=this.innerHTML
    
    this.cj = {}
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
  getItemByID(id){
    return this.cj.collection.items.find((val) => {
      return val.href==id
    })
  }
  async _getContentData(name){
    const cj = await this.wtkClass.getContentData(this.wtkName, this.wtkGroupName, this.target, "content")
    if (!cj) return 
    const visibleItems = 
      this.wtkClass.visibleItems(cj, this.wtkGroupName, this.target)
    this.wtkClass.bindDataToTemplate(visibleItems, this.target)
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
    // this.wtkMetaTemplate=this.innerHTML
    this.cj={}
    this.target=this
    this.setAttribute('id', 'wtk_'+this.wtkName.replace('/','_'))
    this._getGroupData(this.wtkName)
  }
  setCJ(cj) {
    this.cj = cj
  }
  getCJ() {
    return this.cj
  }
  async _getGroupData(wtkName){
    const cj = await this.wtkClass.getContentData(this.wtkName, undefined, this.target, "group")
    if (!cj) return
    this.wtkClass.appendWtkGroupItemsData(cj, this.wtkName, this.target,'content');
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
    this.wtkMetaTemplate=this.cloneNode(true)//this.innerHTML
    this.innerHTML=""
    this.cj={}
    this.target=this
    this.setAttribute('id', 'wtk_'+this.wtkName.replace('/','_'))
    this._getGroupData(this.wtkName)
  }
  setCJ(cj){
    this.cj = cj
  }
  getCJ() {
    return this.cj
  }
  async _getGroupData(wtkName){
    const cj = await this.wtkClass.getContentData(this.wtkName, undefined, this.target, "group")
    if (!cj) return
    console.log(cj);
    this.wtkClass.appendWtkGroupItemsData(cj, this.wtkName, this.target, "content-meta", this.wtkMetaTemplate);
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
  }
  async _fetchItemData(href){
    const path = this.groupName==null ? 
      `/wtk/contents/${this.itemHref}/content`: 
      `/wtk/groups/${this.itemHref}/content`
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) return

    const contText = await response.text()
    const wtkCont = document.createElement('wtk-tinyMCE')
          wtkCont.innerHTML = contText
    this.appendChild(wtkCont)

    if (!this.wtkClass.user) return
    const wtkItemCtrlElem = document.createElement('wtk-item-ctrl')
    this.appendChild(wtkItemCtrlElem)
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
    this.metaData=metaData
  }
  getMetaData(){
    return this.metaData
  }
  setSize(imgSize){
    if (!imgSize) return
    this.imgSize=imgSize  
    
    const wtkImgFile = this.querySelector('wtk-imgFile img')
    if (!wtkImgFile) return
    wtkImgFile.style.width=this.imgSize.wtkWidth
    wtkImgFile.style.height=this.imgSize.wtkHeight
  }
  async _fetchItemData(href){
    const path = this.groupName==null ? 
        `/wtk/contents/${this.itemHref}/content`: 
        `/wtk/groups/${this.itemHref}/content` 
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) return

    const contBlob = await response.blob()
    const objectURL = window.URL.createObjectURL(contBlob);
    const wtkCont = document.createElement('wtk-imgFile')
    const imgElm = document.createElement('img')
          imgElm.src = objectURL;
          imgElm.onload = () => {
            // TODO: visit this
            // wouldnt show img on edit 
            // window.URL.revokeObjectURL(imgElm.src);
          }
        if (this.imgSize) {
          imgElm.style.width = this.imgSize.wtkWidth
          imgElm.style.height = this.imgSize.wtkHeight
        }

    wtkCont.appendChild(imgElm)
    this.appendChild(wtkCont)
    // this.setSize()

    if (!this.wtkClass.user) return 
    let wtkItemCtrlElem = document.createElement('wtk-item-ctrl')
    this.appendChild(wtkItemCtrlElem)
  }
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
    // this.wtkSearchTemplate = this.cloneNode(true)//this.innerHTML
    
    this.target=this
    
    this._searchElemInit()
  }
  async _searchElemInit(){
    this.devSearchTemplateElem =
      this.target.querySelector('[wtk-search-template]')
    if (this.devSearchTemplateElem) {
      this.wtkSearchTemplateHTML = this.devSearchTemplateElem.cloneNode(true)
      this.devSearchTemplateElem.parentNode.removeChild(this.devSearchTemplateElem)
    }

    const path = `${this.wtkClass.base}/views/search.html`
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) return

    const searchHTML = await response.text()
    this.target.innerHTML = searchHTML
    this._alocEvents()
  }
  _alocEvents(){
    this.searchInput=this.target.querySelector('input[type="search"]')
    this.searchInput.addEventListener('keyup', this._onKeyUp.bind(this))
    this.searchInput.addEventListener('keydown', this._onKeyDown.bind(this))
    this.searchInput.addEventListener('search', this._onKeyUp.bind(this))
    this.submitInput=this.target.querySelector('input[type="submit"]')

    this.wtkSearchTemplateElem = 
      this.target.querySelector('.wtkSearchTemplate[wtk-search-template]')

    console.log(this.devSearchTemplateElem);
    if (!this.devSearchTemplateElem) {
      this.wtkSearchTemplateHTML = this.wtkSearchTemplateElem.cloneNode(true)
    }
      

    this.wtkSearchForm=this.target.querySelector('form')
    this.wtkSearchForm.addEventListener('submit', (evt) =>{ evt.preventDefault() })  
  }
  async _fetchSearchData(query){
    console.log(query)
    this._dropHint()
    if (query=="") { return }
    const queryPromises = this.wtkNames.map(val => {
      const path = `${this.wtkClass.apiOpen}/search?query=${query}&wtkName=${val}&wtkOpt=${this.wtkOpt}`
      console.log(path);
      console.log(path.trim());

      return fetch(path).catch((err) => {
        console.log(err)
      })
    })
    const queryResponses = await Promise.all(queryPromises)
    console.log(queryResponses);
    const queryResFilteredPromise = queryResponses
      .filter(response => { return response.ok && response.status != 204 })
      .map(response => { return response.json() })
      // .map(cjListPromise => { this._buildHint(cjListPromise) })

    const queryResFiltered = await Promise.all(queryResFilteredPromise)
    // TODO: add attr empty-msg
    if (queryResFiltered.length==0) return this._buildHint()
    
    queryResFiltered.forEach(cjList => { this._buildHint(cjList) })
  }
  _dropHint(){
    this.wtkSearchTemplateElem.innerHTML=""
    this.wtkSearchTemplateElem.setAttribute('style',`
        opacity: 0;
        pointer-events:none;`)
  }
  async _buildHint(cjList){
    
    // let li=this.target.querySelector('li')
    let y = this.searchInput.getBoundingClientRect().height;
    this.wtkSearchTemplateElem.setAttribute('style',`
        opacity: 1;
        pointer-events:initial;
        transform:translateY(${y}px);`)
    if (!cjList) {
      return this.wtkSearchTemplateElem.innerHTML="<p class='wtk-warning'>Bohužel jsme nic nenašli.</p>"
    }
    cjList.forEach(cj => {
      const stHtml=document.createElement('div')
            stHtml.innerHTML = this.wtkSearchTemplateHTML.innerHTML
      console.log(stHtml);
          console.log(cj);
      this.wtkClass.bindDataToTemplate(cj, stHtml)
      console.log(stHtml.innerHTML);
      this.wtkSearchTemplateElem.innerHTML += stHtml.innerHTML
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
