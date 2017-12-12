'use strict';
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
  _newContCtrlInit(){
    // make shadow root
    this.target = this.attachShadow({mode: 'open'});
    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/aloc-new-content-btn.css`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      css.innerHTML = data
      this.target.insertBefore( css, this.target.firstChild )
    })
    .catch((err) => {
      console.log(err)
      alert("Ups! Nepodařilo se nahrát styly pro tlacitko. Zkuste aktualizovat stránku.")
    })

    // plus icon
    let plusIcon=document.createElement('img')
        plusIcon.src=`${this.wtkClass.base}/icons/plus.svg`
    // plus button
    let plusButton=document.createElement('button')
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
    // this.wtkClass.__fetchWtkDep(null, 'wtk-aloc-new-content', document.body)
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
    console.log(this.wtkContName)
    this.wtkGroupName=this.getAttribute("wtk-ingroup")
    this.editContent=this.wtkContName!=null ? true : false  
    this.groupAttrs=[]
    this.newContentWrapper=document.createElement('div')
    this.newContentWrapper.classList.add('wtk_alocNewContentWrapper')
    this._alocNewContInit()
  }
  _alocNewContInit(){
    // make shadow root
    this.target=this.attachShadow({mode: 'open'});

    fetch(`${this.wtkClass.base}/views/aloc-new-content.html`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      this.newContentWrapper.innerHTML=data
      this.target.appendChild(this.newContentWrapper)

      let closeAlocNewCont=this.target.querySelector('#wtk__closeAlocNewContentBtn')
          closeAlocNewCont.addEventListener('click', this._closeAlocNewContClick.bind(this))
      // form
      this.alocNewContForm=this.target.querySelector('form')
      this.alocNewContForm.addEventListener('submit', this._submitAlocNewCont.bind(this))

      this._initAttrForCont()
      this._initThumbnail()
      this._initEditCont()

      // validate input on all elems
      let validateClass = new validateInput()
      for (let i = 0; i < this.alocNewContForm.elements.length; i++) {
        this.alocNewContForm[i].addEventListener('keyup', validateClass._onKeyUp.bind(validateClass))
        this.alocNewContForm[i].addEventListener('keydown', validateClass._onKeyDown.bind(validateClass))
      }

    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/aloc-new-content.css`)
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
  }
  _initThumbnail(){
    this.imgContUploader=this.target.querySelector('#wtk__imgItemCtrl__upload')
    console.log(this)
    this.imgContUploader.addEventListener('dragenter', this._dragEnter.bind(this))
    this.imgContUploader.addEventListener('dragover', this._dragOver.bind(this))
    this.imgContUploader.addEventListener('drop', this._drop.bind(this))

    this.imgName=this.target.querySelector('#imgName')


    this.imgContFileInput=this.target.querySelector('#wtk__imgItemCtrl__fileInput')
    this.imgContFileInput.addEventListener('change', this._handleImage.bind(this))
  }
  _initEditCont(){
    if (!this.editContent) { return }
    let name=this.wtkContName.split('/')
        name=name[name.length-1]
    let path=this.wtkGroupName!=null ? `groups/${this.wtkContName}` : `contents/${this.wtkContName}` 
    fetch(`${this.wtkClass.apiOpen}/${path}`)
    .then((data) => {
      return data.json()
    })
    .then((cj) => {
      this._insertMetaData(cj)
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _insertMetaData(cj){
    // console.log(cj)

    cj.collection.items.forEach((val, key) => {
      if (val.href=="wtkMetaThumbnail/") {
        console.log(val.data)
        let imgHref=val.data.find((data) => {
          return data.name=="wtkMetaValue"
        }).value
        if (imgHref) {
          let imgHrefSplit=imgHref.split('/')
          this.imgNameOld=imgHrefSplit[imgHrefSplit.length-1]
          this.imgName.innerText=imgHrefSplit[imgHrefSplit.length-1]
          this.imgContUploader.querySelector('.imgUploader').src=imgHref
        }
      }
      let formElem=this.alocNewContForm.elements[val.href.replace('/','')]
      if (formElem!=undefined) {
        formElem.value=val.data.find((data) => {
          return data.name=="wtkMetaValue"
        }).value
      }
    })      
    if (this.editContent) {



      // let name=this.wtkContName.split('/')
      //     name=name[name.length-1]
      // this.alocNewContForm.elements['wtkMetaName'].value=name

    }
  }
  _initAttrForCont(){
    if (this.wtkGroupName==null) { return }
    let attrWrapper=document.createElement('div')
        attrWrapper.classList.add('wtkAttrWrapper','wtk-full-shrink')

    let attrs=this.alocNewContForm.querySelector('div .wtk-layout')
    attrs.appendChild(attrWrapper)
    // this.alocNewContForm.insertBefore(attrWrapper, this.alocNewContForm.querySelector('div div'))
    fetch(`${this.wtkClass.apiOpen}/groups/${this.wtkGroupName}`)
    .then((data) => {
      return data.json()
    })
    .then((cj) => {
      cj.collection.items.forEach((val, key) => {

        let wtkAttrType=val.data.find((data) => {
          return data.name=="wtkAttrType"
        }).value
        this.groupAttrs.push({
          wtkMetaName:val.href.replace('/',''), 
          wtkMetaValue:"", 
          wtkMetaAttr:wtkAttrType, 
          wtkMetaAttrName:""
        })
        this._selectAttrType(wtkAttrType, val, attrWrapper)
      })
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _selectAttrType(type, item, target){
    // let opt=evt.target
    // let parent=this.target
    // console.log(parent)
    // console.log(this.target.querySelector('.wtkAttrValue'))
    let attrElem
    if (type=="text") { attrElem=this._loadNewInputAttr("text", item) }
    if (type=="password") { attrElem=this._loadNewInputAttr("password", item) }
    if (type=="email") { attrElem=this._loadNewInputAttr("email", item) }
    if (type=="tel") { attrElem=this._loadNewInputAttr("tel", item) }
    if (type=="date") { attrElem=this._loadNewInputAttr("date", item) }
    if (type=="checkbox") {}
    if (type=="selecet") {}

    let attrItemElem=document.createElement('div')
        attrItemElem.classList.add('wtkAttrItem')
        attrItemElem.innerHTML=attrElem
    target.appendChild(attrItemElem)
  }
  _loadNewInputAttr(type, item){
    let wtkAttrName=item.data.find((data) => {
      return data.name=="wtkAttrName"
    }).value
    let wtkAttrLabel=item.data.find((data) => {
      return data.name=="wtkAttrLabel"
    }).value
    let wtkAttrRegex=item.data.find((data) => {
      return data.name=="wtkAttrRegex"
    }).value
    let wtkAttrReq=item.data.find((data) => {
      return data.name=="wtkAttrReq"
    }).value
    let pattern=wtkAttrRegex!="" ? `pattern="${wtkAttrRegex}"` : ""
    
    return `<div class="inputWrapper">
              <label for="${wtkAttrName}">${wtkAttrLabel}</label>
              <input 
                type="${type}" 
                name="${wtkAttrName}"
                ${pattern}
                ${wtkAttrReq} />
                <div class="errMsg">
                  <div class="errMsg pattern">Musí obsahovat pouze malá/velká písmena bez diakritiky a čísla!</div>
                  <div class="errMsg required">Toto pole musí být vyplněno!</div>
                </div>
              </div>`
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
  _submitAlocNewCont(evt){
    let target=evt.target
    evt.preventDefault();

    let body={}
    let validForm=true;
    let imgCont=""
    let boundary="blob"

    let validateClass = new validateInput()
    for (let i = 0; i < this.alocNewContForm.elements.length; i++) {
      if (target.elements[i].type!='submit' && target.elements[i].type!='file') {
        validForm=validateClass._validateInput(target.elements[i]);
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }
    let path
    let method=this.editContent ? 'PUT' : 'POST'

    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        // myHeaders.append('Content-Type', 'multipart/form-data; ');
        // myHeaders.append('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    // img
    let wtkCont=this.imgContFileInput.files[0]
    let formData = new FormData(evt.target)
    let file = {
      dom    : this.imgContFileInput,
      binary : null
    };

    let reader = new FileReader();

    file.binary = reader.result;
    reader.addEventListener("load", function () {
    });
    if(file.dom.files[0]) {
      reader.readAsBinaryString(file.dom.files[0]);
    }
    file.dom.addEventListener("change", function () {
      if(reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
      
      reader.readAsBinaryString(file.dom.files[0]);
    });

    // let data=""
    // data += "--" + boundary + "\r\n";

    // // Describe it as form data
    // data += 'content-disposition: form-data; '
    // // Define the name of the form data
    //       + 'name="'         + "wtkContentThumbnail"          + '"; '
    // // Provide the real name of the file
    //       + 'filename="'     + wtkCont.name + '"\r\n';
    // // And the MIME type of the file
    // data += 'Content-Type: ' + wtkCont.type + '\r\n';

    // // There's a blank line between the metadata and the data
    // data += '\r\n';
    
    // // Append the binary data to our body's request
    // data += file.binary + '\r\n';




    // in group
    if (this.wtkGroupName!=null) {
      
      body.wtkMetaName=this.editContent ? `${this.wtkName || this.wtkContName}` : `${this.wtkGroupName}/contents/${new Date().getTime()}`
      body.groupAttrs=[]
      console.log(this.groupAttrs)
      this.groupAttrs.forEach((val, key) => {
        val.wtkMetaValue=this.newContentWrapper.querySelector(`*[name="${val.wtkMetaName}"]`).value
        body.groupAttrs.push(val)
      })
      path=this.editContent ? `groups/${this.wtkName || this.wtkContName}` : 'contents'
    }
    // alone
    else if (this.wtkName!=null || this.wtkContName!=null) {
      body.wtkMetaName=this.wtkName|| this.wtkContName
      path=this.editContent ? `contents/${this.wtkName || this.wtkContName}` : 'contents'
    }
    // add general metadata
      
    this.wtkClass.getGeneralMetadata()
    .then((settings) => {
      body.wtkMetaUrl=window.location.href
      body.wtkMetaOgLocale=settings.metaData.facebook.locale
      body.wtkMetaOgSitename=settings.metaData.facebook.sitename
      body.wtkMetaTwitterSite=settings.metaData.twitter.site
      console.log(body)

      let bodySend = new FormData()
      let imgInfo=formData.get('img')
      // console.log(imgInfo)
      // console.log(this.imgNameOld)
      let bodyData=[{name:'wtkCont', value:imgInfo.name}, {name:'wtkType', value:'img'}]

      if (imgInfo.name!="") {
        bodySend.append('img',formData.get('img'))
      }
      bodySend.append('bodyData',JSON.stringify(body))
      console.log(bodySend)
      // let conf=confirm("Odeslat?")
      // if (!conf) { throw "" }
      return fetch(`${this.wtkClass.api}/${path}`, {
                method:method, 
                body:bodySend, 
                headers:myHeaders})
    })
    .then((data) => {
      return data.text()
    })
    .then((location) => {
      console.log(location)
      if (this.wtkGroupName!=null) {
        // in group
        if (this.editContent) {
          this.wtkClass.updateContent(location)

          // this.wtkClass.editContentData(location, this.wtkGroupName)
        }
        else{
          this.wtkClass.addContentToGroup(location, this.wtkGroupName)
        }
      }
      else{
        // alone
        if (this.editContent) {
          this.wtkClass.updateContent(location)
          // this.wtkClass.editContentData(location, this.wtkGroupName)
        }
        else{
          this.wtkClass.updateContent(location)
        }
      }
      this._closeAlocNewContClick()
      this.wtkClass.toast("Content přidán.")
      // this.wtkClass.__fetchWtkDep(null, 'wtk-aloc-new-content', document.body)
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    });
  } 
  _closeAlocNewContClick(){
    this.parentNode.removeChild(this)
  }


  // methods
}
customElements.define('wtk-aloc-new-content', wtkAlocNewContent);
