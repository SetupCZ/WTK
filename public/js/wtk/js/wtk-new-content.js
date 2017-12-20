'use strict';
import wtk from '../wtk.js'
import validateInput from '../wtkValidateInput.js'

class wtkNewContentCtrl extends HTMLElement{
  constructor(args) {
    super();
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkContent=this.closest('wtk-content') || this.closest('wtk-content-meta')
    this.wtkName=this.wtkContent.getAttribute("wtk-name")
    this.wtkGroupName=this.wtkContent.getAttribute("wtk-ingroup")
   
    this._newContCtrlInit()
  }
  async _newContCtrlInit(){
    // make shadow root
    this.target = this.attachShadow({mode: 'open'});
    // css
    const path = `${this.wtkClass.base}/css/aloc-new-content-btn.css`
    const response = await fetch(path).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast("Ups! Nepodařilo se nahrát styly pro tlacitko. Zkuste aktualizovat stránku.")

    const css = document.createElement('style')
          css.innerHTML = await response.text()
    this.target.insertBefore(css, this.target.firstChild)
    
    // plus icon
    const plusIcon=document.createElement('img')
          plusIcon.src=`${this.wtkClass.base}/icons/plus.svg`
    // plus button
    const plusButton=document.createElement('button')
          plusButton.appendChild(plusIcon)
          plusButton.addEventListener('click', this._newPlusClick.bind(this))
    this.target.appendChild(plusButton)
  }
  _newPlusClick(evt){
    let wtkAlocNewCont = document.createElement('wtk-aloc-new-content')
        wtkAlocNewCont.setAttribute('wtk-name',this.wtkName)
        if (this.wtkGroupName!=null) {
          wtkAlocNewCont.setAttribute('wtk-ingroup',this.wtkGroupName)
        }
    document.body.appendChild(wtkAlocNewCont)    
  }
}

customElements.forcePolyfill = true;
customElements.define('wtk-new-content', wtkNewContentCtrl);


class wtkAlocNewContent extends HTMLElement {
  constructor(args) {
    super();
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkName=this.getAttribute("wtk-name")
    this.wtkContName=this.getAttribute("wtk-cont-name")
    this.wtkGroupName=this.getAttribute("wtk-ingroup")
    this.editContent=this.wtkContName!=null ? true : false  
    this.groupAttrs={}
    
    this._alocNewContInit()
  }
  async _alocNewContInit(){
    // make shadow root
    this.target=this.attachShadow({mode: 'open'});
    const htmlPath = `${this.wtkClass.base}/views/aloc-new-content.html`
    const cssPath = `${this.wtkClass.base}/css/aloc-new-content.css`

    const htmlPromise =  fetch(htmlPath).catch(_ => {})
    const cssPromise =  fetch(cssPath).catch(_ => {})
    const [htmlResponse, cssResponse] = await Promise.all([htmlPromise, cssPromise])
    
    if (!htmlResponse.ok || !cssResponse.ok) return this.wtkClass.toast("Ups! Něco se nepovedlo. Zkuste aktualizovat stránku.")
    // css
    const css = document.createElement('style')
          css.innerHTML = await cssResponse.text()
    this.target.insertBefore(css, this.target.firstChild)

    // html
    this.newContentWrapper = document.createElement('div')
    this.newContentWrapper.classList.add('wtk_alocNewContentWrapper')
    this.newContentWrapper.innerHTML = await htmlResponse.text()

    this.target.appendChild(this.newContentWrapper)
    

    this._initForm()
    this._initAttrForCont()
    this._initThumbnail()
    this._initEditCont()

    // validate input on all elems on keyup/keydown
    let validateClass = new validateInput()
    for (const val of this.alocNewContForm.elements) {
      val.addEventListener('keyup', validateClass._onKeyUp.bind(validateClass))
      val.addEventListener('keydown', validateClass._onKeyDown.bind(validateClass))
    }

  }
  _initForm(){
    // add event to closeBtn 
    this.target
      .querySelector('#wtk__closeAlocNewContentBtn')
      .addEventListener('click', this._closeAlocNewContClick.bind(this))

    this.alocNewContForm = this.target.querySelector('form')
    this.alocNewContForm
      .addEventListener('submit', this._submitAlocNewCont.bind(this))

    // add event to metaTitle input 
    this.formMetaTitle = 
      this.target.querySelector('form input[name="wtkMetaTitle"]')
    this.formMetaTitle
      .addEventListener('keyup', this._onChangeLink.bind(this))
    this.formMetaLink =
      this.target.querySelector('form input[name="wtkMetaLink"]')

  }
  _initThumbnail(){
    this.imgContUploader=this.target.querySelector('#wtk__imgItemCtrl__upload')
    this.imgContUploader.addEventListener('dragenter', this._dragEnter.bind(this))
    this.imgContUploader.addEventListener('dragover', this._dragOver.bind(this))
    this.imgContUploader.addEventListener('drop', this._drop.bind(this))

    this.imgName=this.target.querySelector('#imgName')


    this.imgContFileInput=this.target.querySelector('#wtk__imgItemCtrl__fileInput')
    this.imgContFileInput.addEventListener('change', this._handleImage.bind(this))
  }
  async _initEditCont(){
    if (!this.editContent) { return }

    let name = this.wtkContName.split('/')
        name = name[name.length-1]

    const path = this.wtkGroupName!=null ? 
        `${this.wtkClass.apiOpen}/groups/${this.wtkContName}`: 
        `${this.wtkClass.apiOpen}/contents/${this.wtkContName}` 
    const response = await fetch(path).catch(_ => {})

    if (!response.ok) return this.wtkClass.toast(response.statusText)
    const cj = await response.json()
    this._insertMetaData(cj)
  }
  _insertMetaData(cj){
    // console.log(cj)

    cj.collection.items.forEach((val, key) => {
      if (val.href=="wtkMetaThumbnail/") {
        let imgHref=val.data.find((data) => {
          return data.name=="wtkMetaValue"
        })
        if (imgHref.value) {
          let imgHrefSplit=imgHref.value.split('/')
          this.imgNameOld=imgHrefSplit[imgHrefSplit.length-1]
          this.imgName.innerText=imgHrefSplit[imgHrefSplit.length-1]
          this.imgContUploader.querySelector('.imgUploader').src=imgHref.value
        }
      }
      let formElem=this.alocNewContForm.elements[val.href.replace('/','')]
      if (formElem) {
        formElem.value=val.data.find((data) => {
          return data.name=="wtkMetaValue"
        }).value
      }
    })      
    if (this.editContent) {
      // TODO: hmmm...
      // let name=this.wtkContName.split('/')
      //     name=name[name.length-1]
      // this.alocNewContForm.elements['wtkMetaName'].value=name
    }
  }
  async _initAttrForCont(){
    if (!this.wtkGroupName) return 

    const attrWrapper=document.createElement('div')
          attrWrapper.classList.add('wtkAttrWrapper','wtk-full-shrink')

    const attrsElem=this.alocNewContForm.querySelector('div .wtk-layout')
          attrsElem.appendChild(attrWrapper)
    // this.alocNewContForm.insertBefore(attrWrapper, this.alocNewContForm.querySelector('div div'))
    const path = `${this.wtkClass.apiOpen}/groups/${this.wtkGroupName}`
    const response = await fetch(path).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    const cj = await response.json()

    const attrs = cj.groupAttributes
    Object.keys(attrs)
    .forEach((val, key) => {
      this._selectAttrType(attrs[val], attrWrapper)
    })
    this.groupAttrs = cj.groupAttributes // TODO: check for conflict, may need to copy
  }
  _selectAttrType(attr, target){
    const type = attr.wtkAttrType
    let attrElem
    if (type=="text") { attrElem=this._loadNewInputAttr(type, attr) }
    if (type=="password") { attrElem=this._loadNewInputAttr(type, attr) }
    if (type=="email") { attrElem=this._loadNewInputAttr(type, attr) }
    if (type=="tel") { attrElem=this._loadNewInputAttr(type, attr) }
    if (type=="date") { attrElem=this._loadNewInputAttr(type, attr) }
    if (type=="checkbox") { return }
    if (type=="selecet") { return }

    const attrItemElem=document.createElement('div')
          attrItemElem.classList.add('wtkAttrItem')
          attrItemElem.innerHTML=attrElem
    target.appendChild(attrItemElem)
  }
  _loadNewInputAttr(type, attr){
    // TODO: type < obsolete
    let pattern=attr.wtkAttrRegex!="" ? `pattern="${attr.wtkAttrRegex}"` : ""
    
    return `<div class="inputWrapper">
              <label for="${attr.wtkAttrName}">${attr.wtkAttrLabel}</label>
              <input 
                type="${attr.wtkAttrType}" 
                name="${attr.wtkAttrName}"
                ${pattern}
                ${attr.wtkAttrReq} />
                <div class="errMsg">
                  <div class="errMsg pattern">Musí obsahovat pouze malá/velká písmena bez diakritiky a čísla!</div>
                  <div class="errMsg required">Toto pole musí být vyplněno!</div>
                </div>
              </div>`
  }
  _onChangeLink(evt){
    const target = evt.target
    const filteredValue = 
        String(target.value)
          .toLowerCase()
          .replace(/á/g, "a")
          .replace(/é/g, "e")
          .replace(/í/g, "i")
          .replace(/ó/g, "o")
          .replace(/ú/g, "u")
          .replace(/ů/g, "u")
          .replace(/ý/g, "y")
          .replace(/ž/g, "z")
          .replace(/š/g, "s")
          .replace(/č/g, "c")
          .replace(/ř/g, "r")
          .replace(/ď/g, "d")
          .replace(/ť/g, "t")
          .replace(/ň/g, "n")
          .replace(/ě/g, "e")
          .replace(/ /g, "_")
    this.formMetaLink.value = filteredValue
  }
  _handleImage(evt) {
    let reader = new FileReader();
        reader.addEventListener('load', (evt) => {
          this.imgContUploader.querySelector('img').setAttribute('src', evt.target.result)
        })
        reader.readAsDataURL(evt.target.files[0]);
        this.imgName.innerHTML=evt.target.files[0].name
  }
  _dragEnter(evt){
    evt.stopPropagation();
    evt.preventDefault();
  }
  _dragOver(evt){
    evt.stopPropagation();
    evt.preventDefault();
  }
  _drop(evt){
    evt.stopPropagation();
    evt.preventDefault();
    //you can check evt's properties
    //console.log(evt);
    let dt = evt.dataTransfer;
    let files = dt.files;
    console.log(files)
    console.log(dt)
    //this code line fires your 'handleImage' function (imageLoader change event)
    // console.log(this.wtkContent)
    console.log( this.imgContFileInput)
    this.imgContFileInput.files = files;
  }
  async _submitAlocNewCont(evt){
    evt.preventDefault();
    const target=evt.target
    
    const body = {}
    let validForm = true;
    const validateClass = new validateInput()
    for (const val of this.alocNewContForm.elements) {
      if (val.type != 'submit' && 
          val.type != 'file' && 
          val.type != 'button') {
        validForm=validateClass._validateInput(val);
        body[val.name]=val.value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }
    // console.log(body);
    // return
    // img
    const contFormData = new FormData(evt.target)
    const imgForm = new FormData()
          imgForm.append('img', contFormData.get('img'))
    const imgInfo = imgForm.get('img')

    let path
    // in group
    if (this.wtkGroupName) {
      body.wtkMetaName = this.editContent ? 
          `${this.wtkName || this.wtkContName}`: 
          `${this.wtkGroupName}/contents/${new Date().getTime()}`
      body.groupAttrs = this.groupAttrs
      path = this.editContent ? 
          `${this.wtkClass.api}/groups/${this.wtkName || this.wtkContName}`: 
          `${this.wtkClass.api}/contents`
    }
    // alone
    else if (this.wtkName || this.wtkContName) {
      body.wtkMetaName = this.wtkName || this.wtkContName
      path = this.editContent ? 
          `${this.wtkClass.api}/contents/${this.wtkName || this.wtkContName}`: 
          `${this.wtkClass.api}/contents`
    }
    // add general metadata
      
    const wtkSettings = await this.wtkClass.getGeneralMetadata()
    console.log(wtkSettings);
    // if (!wtkSettings) 
    body.wtkMetaUrl=window.location.href
    body.wtkMetaOgLocale=wtkSettings.metaData.facebook.locale
    body.wtkMetaOgSitename=wtkSettings.metaData.facebook.sitename
    body.wtkMetaTwitterSite=wtkSettings.metaData.twitter.site
    
    const method = this.editContent ? 'PUT' : 'POST'
    // if img exists
    if (imgInfo.name) {
      const response = await fetch(path, {
        method: method,
        body: imgForm,
        credentials: 'same-origin'
      }).catch(_ => {console.log(); })
      if (!response.ok) return this.wtkClass.toast(response.statusText)
      const { wtkMetaThumbnail } = await response.json()
      body.wtkMetaThumbnail = wtkMetaThumbnail
    }
    // save content
    const metaHeaders = new Headers();
          metaHeaders.append('Content-Type', 'application/json');
    const response = await fetch(path, {
      method: method,
      body: JSON.stringify(body),
      headers: metaHeaders,
      credentials: 'same-origin'
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    
    const { location } = await response.json() //TODO: edit the {} to sute the architecture ... same on line 339 
    
    // only in group when editing 
    if (this.wtkGroupName && !this.editContent) {
      console.log('§s');
      this.wtkClass.addContentToGroup(location, this.wtkGroupName) 
    }
    else{
      this.wtkClass.updateContent(location)
    }
  
    
    this._closeAlocNewContClick()
    this.wtkClass.toast("Content přidán.")
  } 
  _closeAlocNewContClick(){
    this.parentNode.removeChild(this)
  }
}
customElements.define('wtk-aloc-new-content', wtkAlocNewContent);
