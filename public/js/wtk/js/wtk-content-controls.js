'use strict';
import wtk from '../wtk.js'
import validateInput from '../wtkValidateInput.js'

class wtkContentCtrl extends HTMLElement{
  constructor(args) {
    super();
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkContent=this.closest('wtk-content') || this.closest('wtk-content-meta')
    this.wtkName=this.wtkContent.getAttribute('wtk-name')
    this.wtkGroupName=this.wtkContent.getAttribute('wtk-ingroup')
    this._contentCtrlInit()
  }
  async _contentCtrlInit(){
    this.target = this.attachShadow({mode: 'open'});
    // css
    const css=document.createElement('style')

    const path = `${this.wtkClass.base}/css/content-ctrl.css`
    const response = await fetch(path).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    css.innerHTML = await response.text()
    this.target.insertBefore( css, this.target.firstChild )

    // edit icon
    let editIcon=document.createElement('img')
        editIcon.src=`${this.wtkClass.base}/icons/itemEdit.svg`
    // edit button
    let editButton=document.createElement('button')
        editButton.appendChild(editIcon)
        editButton.addEventListener('click', this._editClick.bind(this))
    this.target.appendChild(editButton)

    // text icon
    let textIcon=document.createElement('img')
        textIcon.src=`${this.wtkClass.base}/icons/plusText.svg`
    // text button
    let textButton=document.createElement('button')
        textButton.appendChild(textIcon)
        textButton.addEventListener('click', this._newTextClick.bind(this))
    this.target.appendChild(textButton)

    // img icon
    let imgIcon=document.createElement('img')
        imgIcon.src=`${this.wtkClass.base}/icons/plusImg.svg`
    // img button
    let imgButton=document.createElement('button')
        imgButton.appendChild(imgIcon)
        imgButton.addEventListener('click', this._newImgClick.bind(this))
    this.target.appendChild(imgButton)

    // trash icon
    let trashIcon=document.createElement('img')
        trashIcon.src=`${this.wtkClass.base}/icons/itemTrash.svg`
    // trash button
    let trashButton=document.createElement('button')
        trashButton.appendChild(trashIcon)
        trashButton.addEventListener('click', this._trashClick.bind(this))
    this.target.appendChild(trashButton)
  }
  _editClick(evt){
    this.wtkClass.fetchWtkDep(
      `${this.wtkClass.base}/js/wtk-new-content.js`, 
      null, 
      this.target) 
    const wtkAlocNewCont = document.createElement('wtk-aloc-new-content')
        wtkAlocNewCont.setAttribute('wtk-cont-name', this.wtkName)
    if (this.wtkGroupName) {
        wtkAlocNewCont.setAttribute('wtk-ingroup', this.wtkGroupName)
    }
    document.body.appendChild(wtkAlocNewCont)    
  }
  async _trashClick(evt){
    const path = this.wtkGroupName==null ? 
        `${this.wtkClass.api}/contents/${this.wtkName}`: 
        `${this.wtkClass.api}/groups/${this.wtkName}`
    const trashHeaders = new Headers();
          trashHeaders.append('Content-Type', 'application/json');

    const response = await fetch(path,{
      method:'DELETE',
      headers:trashHeaders
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    const { location } = await response.json()
    this.parentNode.remove()
  }
  _newTextClick(evt){
    this.wtkClass.getTinyMCEJS()
    .then((response) => {
      this._tinymceLoaded()
    }).catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    })
  }
  _newImgClick(evt){
    let wtkImgItemElem=document.createElement('wtk-new-img-item')
    this.wtkContent.insertBefore(wtkImgItemElem, this.wtkContent.lastChild)
  }
  _tinymceLoaded(evt){
    let wtkTextItemElem=document.createElement('wtk-new-text-item')
    this.wtkContent.insertBefore(wtkTextItemElem, this.wtkContent.lastChild)
  }
}

customElements.forcePolyfill = true;
customElements.define('wtk-content-ctrl', wtkContentCtrl);


// //////////////////////////////////////////////////////////
// items-----------------------------------------------------
// //////////////////////////////////////////////////////////
class wtkNewTextItem extends HTMLElement {
  constructor(args) {
    super();
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkContent=this.closest('wtk-content') || this.closest('wtk-content-meta')
    this.wtkGroupName=this.wtkContent.getAttribute("wtk-ingroup")
    this.wtkItemHref=this.getAttribute('wtk-text-content')
    this.editContent=this.wtkItemHref!=null ? true : false 
    this.wtkItemContent=this.editContent ? this.parentNode : undefined


    this._textItemInit()
  }
  async _textItemInit(){
    // make shadow root
    // this.target=this.attachShadow({mode: 'open'});
    this.target=this
    const htmlPath = `${this.wtkClass.base}/views/text-item-ctrl.html`
    const cssPath = `${this.wtkClass.base}/css/text-item-ctrl.css`

    const htmlPromise = fetch(htmlPath).catch(_ => { })
    const cssPromise = fetch(cssPath).catch(_ => { })
    const [htmlResponse, cssResponse] = await Promise.all([htmlPromise, cssPromise])

    if (!htmlResponse.ok || !cssResponse.ok) return this.wtkClass.toast("Ups! Něco se nepovedlo. Zkuste aktualizovat stránku.")
    // css
    const css = document.createElement('style')
    css.innerHTML = await cssResponse.text()
    this.target.insertBefore(css, this.target.firstChild)

    // html
    const textHTML = document.createElement('div')
          textHTML.innerHTML = await htmlResponse.text()
    this.target.appendChild(textHTML)
    
    // window.tinymce.dom.Event.domLoaded = true;
    const textItem = this.target.querySelector('#wtk__textItem')
    tinymce.init({ target:textItem });
    
    this._wtkTextItemCtrlInit()

    if (!this.editContent) return
    const wtkContentItem = 
      this.target.parentNode.querySelector('wtk-tinymce')
    const wtkTinyMCECont = 
      this.target.querySelector('#wtk__textItem')
        wtkTinyMCECont.innerHTML = wtkContentItem.innerHTML
  }
  _wtkTextItemCtrlInit(){
    this.textContForm = this.target.querySelector('form')
      .addEventListener('submit', this._saveClick.bind(this))
    this.fullscreenButton = 
      this.querySelector('#wtk__textItemCtrl__fullscreen')
      .addEventListener('click', this._fullscreenClick.bind(this))
    this.closeButton = 
      this.target.querySelector('#wtk__textItemCtrl__close')
      .addEventListener('click', this._closeClick.bind(this))
  }
  _fullscreenClick(evt){
    this.target.classList.toggle('wtkFullScreen')
  }
  async _saveClick(evt){
    evt.preventDefault()
    

    const method = this.editContent ? 'PUT' : 'POST'
    const groupPath = this.wtkGroupName == null ? 
      'contents' : 'groups'
    this.wtkGroupName == null ? 'contents' : 'groups'
    const path = this.editContent ? 
        `${this.wtkClass.api}/${groupPath}/${this.wtkItemHref}` : 
        `${this.wtkClass.api}/${groupPath}/${this.wtkContent.wtkName}/items`
    
    const textHeaders = new Headers();
          textHeaders.append('Content-Type', 'application/json');

    // body
    const textContent = tinyMCE.get('wtk__textItem').getContent();
    const body = {
      wtkCont: textContent, 
      wtkType: 'text'
    }

    // set position if new item
    if (!this.editContent) {
      // TODO: get cj items data in content-meta 
      const cj = this.wtkContent.getCJ()
      const itemsKeys = Object.keys(cj._embedded.items)
      const lastItem = itemsKeys[itemsKeys.length - 1]
      let cjPosition = cj._embedded.items[lastItem]
          cjPosition = cjPosition ? cjPosition.wtkPosition + 1 : 0
      
      body.wtkPosition = cjPosition
    }

    // return
    const response = await fetch(path,{
      method:method, 
      body:JSON.stringify(body), 
      headers:textHeaders
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    const { location } = await response.json()

    this.wtkClass.toast("Saved")

    if (this.editContent) {
      this.wtkClass.updateContentTextItem(
        location, 
        this.wtkItemContent, 
        'text', 
        groupPath)
    }
    else{
      this._closeClick()
      this.wtkClass.addContentItem(
        location, this.wtkContent, 
        this.wtkContent.lastChild, 'text')
    }
    await this.wtkClass.updateCJ(
      groupPath, 
      this.wtkContent.wtkName, 
      this.wtkContent)
  }
  _closeClick(evt){
    // evt.preventDefault()
    let wtkTextItemElem=document.querySelector('wtk-new-text-item')

    if (this.editContent) {
      const parent=wtkTextItemElem.parentNode
            parent
              .querySelector('wtk-tinymce')
              .classList.remove('wtk-hidden')
            parent
              .querySelector('wtk-item-ctrl')
              .classList.remove('wtk-hidden')
    }
    wtkTextItemElem.remove()
  }
}
customElements.define('wtk-new-text-item', wtkNewTextItem);


class wtkNewImgItem extends HTMLElement {
  constructor(args) {
    super();
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkContent=this.closest('wtk-content') || this.closest('wtk-content-meta')
    // this.wtkContent=this.closest('wtk-content')
    this.wtkItemHref=this.getAttribute('wtk-img-content')
    this.groupName=this.wtkContent.getAttribute('wtk-ingroup')

    this.editContent=this.wtkItemHref!=null ? true : false 
    this.wtkItemContent=this.editContent ? this.parentNode : undefined
    console.log(this.wtkItemContent)
    this.metaData={}
    this._imgItemInit()
  }
  async _imgItemInit(){
    // make shadow root
    // this.target=this.attachShadow({mode: 'open'});
    this.target=this
    const htmlPath = `${this.wtkClass.base}/views/img-item-ctrl.html`
    const cssPath = `${this.wtkClass.base}/css/img-item-ctrl.css`

    const htmlPromise = fetch(htmlPath).catch(_ => { })
    const cssPromise = fetch(cssPath).catch(_ => { })
    const [htmlResponse, cssResponse] = await Promise.all([htmlPromise, cssPromise])

    if (!htmlResponse.ok || !cssResponse.ok) return this.wtkClass.toast("Ups! Něco se nepovedlo. Zkuste aktualizovat stránku.")
    // css
    const css = document.createElement('style')
    css.innerHTML = await cssResponse.text()
    this.target.insertBefore(css, this.target.firstChild)

    // html
    const textHTML = document.createElement('div')
          textHTML.innerHTML = await htmlResponse.text()
    this.target.appendChild(textHTML)
    
    this._wtkImgItemCtrlInit()
    this._editImageInit()
  }
  _editImageInit(){
    if (!this.editContent) return

    this.metaData = this.wtkItemContent.getMetaData()
    console.log(this.metaData)
    // TODO: look into this
    let metaWtkWidth
    let metaWtkHeight
    let metaWtkCont
    // this.metaData.data.forEach((val, key) => {
    //   metaWtkWidth=val.name=="wtkWidth" ? val.value
    //   metaWtkHeight=val.name=="wtkHeight" ? val.value
    //   metaWtkCont=val.name=="wtkCont" ? val.value
    // })
    const wtkWidthElem = 
      this.wtkItemContent.querySelector('form input[name="wtkWidth"]')
      .value = this.metaData.wtkWidth
    const wtkHeightElem = 
      this.wtkItemContent.querySelector('form input[name="wtkHeight"]')
      .value = this.metaData.wtkHeight
    const imgNameElem = 
      this.wtkItemContent.querySelector('#imgName')
      .innerHTML = this.metaData.wtkCont
    const imgFileElem = 
      this.wtkItemContent.querySelector('.imgUploader')
      .src = this.wtkItemContent.querySelector('wtk-imgfile img').src
  }
  _wtkImgItemCtrlInit(){
    this.imgContUploader=this.querySelector('#wtk__imgItemCtrl__upload')
    this.imgContUploader.addEventListener('dragenter', this._dragEnter.bind(this))
    this.imgContUploader.addEventListener('dragover', this._dragOver.bind(this))
    this.imgContUploader.addEventListener('drop', this._drop.bind(this))

    this.imgName=this.querySelector('#imgName')


    this.imgContFileInput=this.querySelector('#wtk__imgItemCtrl__fileInput')
    this.imgContFileInput.addEventListener('change', this._handleImage.bind(this))

    this.imgContForm=this.querySelector('form')
    this.imgContForm.addEventListener('submit', this._saveClick.bind(this))

    this.closeButton=this.querySelector('#wtk__imgItemCtrl__close')
    this.closeButton.addEventListener('click', this._closeClick.bind(this))
  }
  async _saveClick(evt){
    evt.preventDefault()
    const target = evt.target
    // body
    const validatedBody = {}
    let validForm = true;
    const validateClass = new validateInput()
    for (const val of target.elements) {
      if (val.type != 'submit' &&
        val.type != 'file' &&
        val.type != 'button') {
        validForm = validateClass._validateInput(val);
        validatedBody[val.name] = val.value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }
    
    const imgWidth = validatedBody.wtkWidth=="" ? 
      "auto" : validatedBody.wtkWidth 
    const imgHeight = validatedBody.wtkHeight=="" ? 
      "auto" : validatedBody.wtkHeight 

    const body = {
      wtkType: 'img',
      wtkWidth: imgWidth,
      wtkHeight: imgHeight
    }

    // cj
    // TODO:
    // getMetaData() from contentElement
    // no need for looping in position
    // set position if new item
    if (!this.editContent) {
      // TODO: get cj items data in content-meta 
      const cj = this.wtkContent.getCJ()
      const itemsKeys = Object.keys(cj._embedded.items)
      const lastItem = itemsKeys[itemsKeys.length - 1]
      let cjPosition = cj._embedded.items[lastItem]
          cjPosition = cjPosition ? cjPosition.wtkPosition + 1 : 0

      body.wtkPosition = cjPosition
    }

    // img
    const imgFormData = new FormData(evt.target)
    const imgForm = new FormData()
          imgForm.append('img', imgFormData.get('img'))
    const imgInfo = imgForm.get('img')

    let metaWtkCont
    console.log(this.metaData)
    console.log(this.metaData.length)

    if (this.metaData && Object.keys(this.metaData).length !== 0) {
      metaWtkCont = this.metaData.data.find((val) => {
        return val.name == "wtkCont"
      }).value
    }

    const method = this.editContent ? 'PUT' : 'POST'
    const groupPath = this.groupName == null ? 
      'contents' : 'groups'
    const path = this.editContent ? 
      `${this.wtkClass.api}/${groupPath}/${this.wtkItemHref}` : 
      `${this.wtkClass.api}/${groupPath}/${this.wtkContent.wtkName}/items`
    const metaHeaders = new Headers();
          metaHeaders.append('Content-Type', 'application/json');

    // if img exists and is diferent than before
    if (imgInfo.name != metaWtkCont && imgInfo.name != "") {
      const response = await fetch(path, {
        method: method,
        body: imgForm,
        credentials :'same-origin'
      }).catch(_ => {})
      if (!response.ok) return this.wtkClass.toast(response.statusText)
      const { imgItemUrl } = await response.json()

      body.wtkCont = imgInfo.name
    }
    // save img metadata
    const response = await fetch(path, {
      method: method,
      body: JSON.stringify(body),
      headers: metaHeaders,
      credentials: 'same-origin'
    }).catch(_ => { })
    if (!response.ok) return this.wtkClass.toast(response.statusText)

    const { location } = await response.json() //TODO: edit the {} to sute the architecture ... 

    if (this.editContent) {
      this.wtkItemContent.setSize({'wtkWidth':imgWidth, 'wtkHeight':imgHeight})
      this.wtkClass.updateContentImgItem(location, this.wtkItemContent, 'img', groupPath)
    }
    else{
      this.wtkClass.addContentItem(location, this.wtkContent, this.wtkContent.lastChild, 'img')
    }
    this._closeClick()
    this.wtkClass.updateCJ(groupPath, this.wtkContent.wtkName, this.wtkContent)
  }
  _closeClick(evt){
    // evt.preventDefault()
    let wtkImgItemElem=document.querySelector('wtk-new-img-item')

    if (this.editContent) {
        let parent=wtkImgItemElem.parentNode
          parent
            .querySelector('wtk-imgfile')
            .classList.remove('wtk-hidden')
          parent
            .querySelector('wtk-item-ctrl')
            .classList.remove('wtk-hidden')
    }
    wtkImgItemElem.remove()
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
    console.log(this.wtkContent)
    console.log( this.imgContFileInput)
    this.imgContFileInput.files = files;

  }
}
customElements.define('wtk-new-img-item', wtkNewImgItem);

class wtkItemCtrl extends HTMLElement {
  constructor(args) {
    super()
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkContent=this.closest('wtk-content')
    this.wtkItemELem=this.parentNode
    this.wtkItemHref=this.wtkItemELem.getAttribute('wtk-item-href')
    this.groupName=this.wtkContent.getAttribute('wtk-ingroup')

    this._itemCtrlInit()
  }
  _itemCtrlInit(){
    this.target = this.attachShadow({mode: 'open'});
    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/item-ctrl.css`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      css.innerHTML = data
      this.target.insertBefore( css, this.target.firstChild )
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
    // text icon
    let editIcon=document.createElement('img')
        editIcon.src=`${this.wtkClass.base}/icons/itemEdit.svg`
    // text button
    let editButton=document.createElement('button')
        editButton.appendChild(editIcon)
        editButton.addEventListener('click', this._itemEditClick.bind(this))
    this.target.appendChild(editButton)

    // up icon
    let upIcon=document.createElement('img')
        upIcon.src=`${this.wtkClass.base}/icons/itemUp.svg`
    // up button
    let upButton=document.createElement('button')
        upButton.appendChild(upIcon)
        upButton.addEventListener('click', this._itemUpClick.bind(this))
    this.target.appendChild(upButton)

    // down icon
    let downIcon=document.createElement('img')
        downIcon.src=`${this.wtkClass.base}/icons/itemDown.svg`
    // down button
    let downButton=document.createElement('button')
        downButton.appendChild(downIcon)
        downButton.addEventListener('click', this._itemDownClick.bind(this))
    this.target.appendChild(downButton)

    // trash icon
    let trashIcon=document.createElement('img')
        trashIcon.src=`${this.wtkClass.base}/icons/itemTrash.svg`
    // trash button
    let trashButton=document.createElement('button')
        trashButton.appendChild(trashIcon)
        trashButton.addEventListener('click', this._itemTrashClick.bind(this))
    this.target.appendChild(trashButton)
  }
  _editTextItemInit(){
    let wtkTextTinyMCE=this.parentNode.querySelector('wtk-tinymce')
    // load tinymce
    wtkTextTinyMCE.classList.add('wtk-hidden')
    if (this.parentNode.querySelector('wtk-new-text-item')!=null) { return }

    this.wtkClass.getTinyMCEJS()
    .then((data) => {
      let wtkTinyMCE=this.parentNode.querySelector('wtk-tinymce')
          wtkTinyMCE.classList.add('wtk-hidden')
      let wtkNewTextItem=document.createElement('wtk-new-text-item')
          wtkNewTextItem.setAttribute('wtk-text-content',this.parentNode.getAttribute('wtk-item-href'))
      this.parentNode.insertBefore( wtkNewTextItem, this.parentNode.firstChild )

    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    });
  }
  _editImgItemInit(){
    let wtkImgFile=this.parentNode.querySelector('wtk-imgfile')
        wtkImgFile.classList.add('wtk-hidden')

    if (this.parentNode.querySelector('wtk-new-img-item')!=null) { return }
    let wtkNewImgItem=document.createElement('wtk-new-img-item')
        wtkNewImgItem.setAttribute('wtk-img-content',this.parentNode.getAttribute('wtk-item-href'))

    this.parentNode.insertBefore( wtkNewImgItem, this.parentNode.firstChild )
  }
  _itemEditClick(evt){
    console.log(this.wtkItemELem.nodeName)
    if (this.wtkItemELem.nodeName=="WTK-CONTENT-TEXTITEM") {
      this._editTextItemInit()
    }
    if (this.wtkItemELem.nodeName=="WTK-CONTENT-IMGITEM") {
      this._editImgItemInit()
    }
  }
  async _itemUpClick(evt){
    evt.preventDefault()
    
    const item = this.wtkContent.getItemByID(this.wtkItemHref)
    const cj = this.wtkContent.getCJ()
      
    let prevItem=item

    const items = cj._embedded.items
    Object.keys(items)
    .sort((valA, valB) => {
      return items[valA].wtkPosition > items[valB].wtkPosition
    })
    .find((val, key, list) => {
      if (items[val].wtkVisible && 
        items[val]._links.self.href != this.wtkItemHref) { 
        prevItem = items[val] 
      }
      return items[val]._links.self.href == this.wtkItemHref
    })
    if (prevItem._links.self.href == item._links.self.href) { return }
    let prevItemPosition=prevItem.wtkPosition
    let itemPosition=item.wtkPosition
    let itemType=item.wtkType
    
    
    const prevItemBody = {
      wtkPosition:prevItemPosition
    }
    const itemBody={
      wtkPosition:itemPosition
    }
    // return
    const itemPath = this.groupName==null ? 
      `${this.wtkClass.api}/contents/${item._links.self.href}` : 
      `${this.wtkClass.api}/groups/${item._links.self.href}`  
    const prevItemPath = this.groupName == null ?
      `${this.wtkClass.api}/contents/${prevItem._links.self.href}` :
      `${this.wtkClass.api}/groups/${prevItem._links.self.href}`  
      
    const moveUpHeaders = new Headers();
          moveUpHeaders.append('Content-Type', 'application/json');

    // first item
    const itemResponse = await fetch(itemPath, {
      method: 'PUT',
      body: JSON.stringify(prevItemBody),
      headers: moveUpHeaders
    }).catch(_ => {})
    if (!itemResponse.ok) return this.wtkClass.toast(itemResponse.statusText)
    let { location } = await itemResponse.json()
    
      
    // prev item
    // if (location != this.wtkItemHref) { return }
    const prevItemResponse = await fetch(prevItemPath, {
      method: 'PUT',
      body: JSON.stringify(itemBody),
      headers: moveUpHeaders
    }).catch(_ => { })
    if (!prevItemResponse.ok) return this.wtkClass.toast(prevItemResponse.statusText)
    let { prevItemLocation } = await prevItemResponse.json()

    this.wtkClass.updateCJ(
      this.groupName == null ? 'contents' : 'groups',
      this.wtkContent.wtkName, this.wtkContent)

    this.wtkClass.addContentItem(
      location,
      this.wtkContent,
      this.wtkItemELem.previousSibling,
      itemType,
      { wtkWidth: item.wtkWidth, wtkHeight: item.wtkHeight },
      item
    )
    this.parentNode.remove()
  }
  async _itemDownClick(evt){
    evt.preventDefault()
    const item = this.wtkContent.getItemByID(this.wtkItemHref)
    const cj = this.wtkContent.getCJ()
    
    let nextItem = item

    const items = cj._embedded.items
    Object.keys(items)
    .sort((valA, valB) => {
      return items[valA].wtkPosition > items[valB].wtkPosition
    })
    .find((val, key, list) => {
      nextItem = items[list[key+1]]
      if (items[val]._links.self.href == this.wtkItemHref) 
        return items[val]
    })
    // console.log(`${nextItem.wtkID}`);
    if (nextItem==undefined) { return }

    let nextItemPosition=nextItem.wtkPosition
    let itemPosition=item.wtkPosition
    let itemType=item.wtkType

    const nextItemBody = {
      "wtkPosition":nextItemPosition
    }
    const itemBody = {
      "wtkPosition": itemPosition
    }
    // return
    const itemPath = this.groupName==null ? 
      `${this.wtkClass.api}/contents/${item._links.self.href}` :
      `${this.wtkClass.api}/groups/${item._links.self.href}`
    const nextItemPath = this.groupName == null ?
      `${this.wtkClass.api}/contents/${nextItem._links.self.href}` :
      `${this.wtkClass.api}/groups/${nextItem._links.self.href}`

    const moveDownHeaders = new Headers();
          moveDownHeaders.append('Content-Type', 'application/json');
    // item
    const itemResponse = await fetch(itemPath,{
      method: 'PUT', 
      body: JSON.stringify(nextItemBody), 
      headers: moveDownHeaders
    }).catch(_ => {})
    if (!itemResponse.ok) return this.wtkClass.toast(itemResponse.statusText)
    let { location } = await itemResponse.json()

    // nextItem
    const nextItemResponse = await fetch(nextItemPath, {
      method: 'PUT',
      body: JSON.stringify(itemBody),
      headers: moveDownHeaders
    }).catch(_ => { })
    if (!nextItemResponse.ok) return this.wtkClass.toast(nextItemResponse.statusText)
    let { nextItemLocation } = await nextItemResponse.json()

    this.wtkClass.updateCJ(
      this.groupName == null ? 'contents' : 'groups',
      this.wtkContent.wtkName, this.wtkContent)
    
    this.wtkClass.addContentItem(
      location, 
      this.wtkContent, 
      this.wtkItemELem.nextSibling.nextSibling, 
      itemType,
      {wtkWidth:item.wtkWidth,wtkHeight:item.wtkHeight},
      item 
    )
    this.parentNode.remove()
  }
  async _itemTrashClick(evt){
    const trashHeaders = new Headers();
          trashHeaders.append('Content-Type', 'application/json');

    const path = this.groupName==null ? 
        `${this.wtkClass.api}/contents/${this.wtkItemHref}`:
        `${this.wtkClass.api}/groups/${this.wtkItemHref}`
        
    const response = await fetch(path,{
      method:'DELETE', 
      headers:trashHeaders
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)

    const cj = await response.json()
    this.parentNode.remove()
  }
  async _tinymceLoaded(){
    // make shadow root
    // this.target=this.attachShadow({mode: 'open'});
    this.target=this
    const htmlPath = `${this.wtkClass.base}/views/text-item-ctrl.html`
    const cssPath = `${this.wtkClass.base}/css/text-item-ctrl.css`

    const htmlPromise = fetch(htmlPath).catch(_ => { })
    const cssPromise = fetch(cssPath).catch(_ => { })
    const [htmlResponse, cssResponse] = await Promise.all([htmlPromise, cssPromise])

    if (!htmlResponse.ok || !cssResponse.ok) return this.wtkClass.toast("Ups! Něco se nepovedlo. Zkuste aktualizovat stránku.")

    // css
    const css = document.createElement('style')
    css.innerHTML = await cssResponse.text()
    this.target.insertBefore(css, this.target.firstChild)

    const textHTML = document.createElement('div')
          textHTML.innerHTML = await htmlResponse.text()
    this.target.appendChild(textHTML)

    tinymce.init({ selector:'#wtk__textItem' });
    this._wtkTextItemCtrlInit()
  }
}
customElements.define('wtk-item-ctrl', wtkItemCtrl);

class wtkGroupCtrl extends HTMLElement {
  constructor(args){
    super()
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkGroup=this.closest('wtk-group') || this.closest('wtk-group-meta')
    this.wtkName=this.wtkGroup.getAttribute('wtk-name')
    this._itemCtrlInit()
  }
  async _itemCtrlInit(){
    this.target = this.attachShadow({mode: 'open'});
    // css
    const path = `${this.wtkClass.base}/css/group-ctrl.css`
    const response = await fetch(path).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    
    const css = document.createElement('style')
          css.innerHTML = await response.text()
    this.target.insertBefore( css, this.target.firstChild )
    // text icon
    const editIcon=document.createElement('img')
          editIcon.src=`${this.wtkClass.base}/icons/itemEdit.svg`
    // text button
    const editButton=document.createElement('button')
          editButton.appendChild(editIcon)
          editButton.addEventListener('click', this._itemEditClick.bind(this))
    this.target.appendChild(editButton)

    // trash icon
    const trashIcon=document.createElement('img')
          trashIcon.src=`${this.wtkClass.base}/icons/itemTrash.svg`
    // trash button
    const trashButton=document.createElement('button')
          trashButton.appendChild(trashIcon)
          trashButton.addEventListener('click', this._itemTrashClick.bind(this))
    this.target.appendChild(trashButton)
  }
  _itemEditClick(evt){
    this.wtkClass.fetchWtkDep(
      `${this.wtkClass.base}/js/wtk-new-group.js`, 
      null, 
      this.target) 
    let wtkAlocNewGroup = document.createElement('wtk-aloc-new-group')
        wtkAlocNewGroup.setAttribute('wtk-group-name', this.wtkName)
    document.body.appendChild(wtkAlocNewGroup)    
  }
  async _itemTrashClick(evt){
    const trashHeaders = new Headers();
          trashHeaders.append('Content-Type', 'application/json');

    const path = `${this.wtkClass.api}/groups/${this.wtkName}`
    const response = await fetch(path,{
      method:'DELETE',
      headers:trashHeaders
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)


    // const cj = await response.json()
    this.parentNode.remove()
  }
}
customElements.define('wtk-group-ctrl', wtkGroupCtrl);
