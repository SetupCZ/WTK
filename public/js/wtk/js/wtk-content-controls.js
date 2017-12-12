'use strict';
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
  _contentCtrlInit(){
    this.target = this.attachShadow({mode: 'open'});
    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/content-ctrl.css`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      css.innerHTML = data
      this.target.insertBefore( css, this.target.firstChild )
    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
      alert("Ups! Nepodařilo se nahrát styly pro tlacitko. Zkuste aktualizovat stránku.")
    })

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
    this.wtkClass._fetchWtkDep(
      `${this.wtkClass.base}/js/wtk-new-content.js`, 
      null, 
      this.target) 
    let wtkAlocNewCont = document.createElement('wtk-aloc-new-content')
        wtkAlocNewCont.setAttribute('wtk-cont-name', this.wtkName)
        if (this.wtkGroupName!=null) {
          wtkAlocNewCont.setAttribute('wtk-ingroup', this.wtkGroupName)
        }
    document.body.appendChild(wtkAlocNewCont)    
  }
  _trashClick(evt){
    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    let path=this.wtkGroupName==null ? 'contents' : 'groups'
    fetch(`${this.wtkClass.api}/${path}/${this.wtkName}`,{
      method:'DELETE',
      headers:myHeaders
    })
    .then((data) => {
      return data.text()
    })
    .then((cj) => {
      console.log(cj)
      this.parentNode.remove()
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _newTextClick(evt){
    this.wtkClass._getTinyMCEJS()
    .then((data) => {
      this._tinymceLoaded()
    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    });
  }
  _newImgClick(evt){
    // TODO!!!

    // let wtkContentElem=this.closest('wtk-content')
    let wtkImgItemElem=document.createElement('wtk-new-img-item')

    this.wtkContent.insertBefore(wtkImgItemElem, this.wtkContent.lastChild)
  }
  _tinymceLoaded(evt){
    // console.log('tinyloaded')
    // let wtkContentElem=this.closest('wtk-content')
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
    // this.wtkContent=this.closest('wtk-content')
    this.wtkGroupName=this.wtkContent.getAttribute("wtk-ingroup")
    // console.log(this.getAttribute('wtk-text-content'))
    this.wtkItemHref=this.getAttribute('wtk-text-content')
    this.editContent=this.wtkItemHref!=null ? true : false 
    this.wtkItemContent=this.editContent ? this.parentNode : undefined


    this._textItemInit()
  }
  _textItemInit(){
    // make shadow root
    // this.target=this.attachShadow({mode: 'open'});
    this.target=this

    let textHTML=document.createElement('div')
    fetch(`${this.wtkClass.base}/views/text-item-ctrl.html`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      textHTML.innerHTML=data
      this.target.appendChild(textHTML)
      // window.tinymce.dom.Event.domLoaded = true;
      let textItem=this.target.querySelector('#wtk__textItem')
      tinymce.init({ target:textItem });

      if (this.editContent) {
        let wtkContentItem=this.target.parentNode.querySelector('wtk-tinymce')
            console.log(this.target)
        let wtkTinyMCECont=this.target.querySelector('#wtk__textItem')
            wtkTinyMCECont.innerHTML=wtkContentItem.innerHTML
      }
      this._wtkTextItemCtrlInit()
      
    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    })

    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/text-item-ctrl.css`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      css.innerHTML = data
      this.target.insertBefore( css, this.target.firstChild )
    })
    .catch((err) => {
      this.wtkClass.toast(err)
      console.log(err)
      alert("Ups! Nepodařilo se nahrát styly pro tlacitko. Zkuste aktualizovat stránku.")
    })
  }
  _wtkTextItemCtrlInit(){
    this.textContForm=this.target.querySelector('form')
        .addEventListener('submit', this._saveClick.bind(this))
    this.fullscreenButton=this.querySelector('#wtk__textItemCtrl__fullscreen')
        .addEventListener('click', this._fullscreenClick.bind(this))
    this.closeButton=this.target.querySelector('#wtk__textItemCtrl__close')
        .addEventListener('click', this._closeClick.bind(this))
  }
  _fullscreenClick(evt){
    this.target.classList.toggle('wtkFullScreen')
  }
  _saveClick(evt){
    evt.preventDefault()
    let textContent = tinyMCE.get('wtk__textItem').getContent();
    // headers
    let method=this.editContent ? 'PUT' : 'POST'
    console.log(this.wtkGroupName)
    let groupPath=this.wtkGroupName==null ? `contents` : `groups`
    let path=this.editContent ? `${groupPath}/${this.wtkItemHref}` : `${groupPath}/${this.wtkContent.wtkName}/items`

    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    // cj
    let cj=this.wtkContent.getCJ()
    console.log(cj)
    let cjPosition = 0
    if (cj.collection.items.length!=0) {
      cjPosition = cj.collection.items[cj.collection.items.length-1].data.find((val, key) => {
        return val.name==="wtkPosition"
      }).value
      console.log(cjPosition)
      // cjPosition=1
      cjPosition=cjPosition.value+1
    }
    // body
    console.log(cjPosition)
    let body=[{name:'wtkCont', value:textContent}, {name:'wtkType', value:'text'}]
    if (!this.editContent) { body.push({name:'wtkPosition', value:cjPosition})}

    // ${this.wtkContent.wtkName}
    console.log(path)
    // return
    fetch(`${this.wtkClass.api}/${path}`,{
      method:method, 
      body:JSON.stringify(body), 
      headers:myHeaders
    })
    .then((data) => {
      console.log(data)
      console.log(data.headers.get('location'))
      return data.headers.get('location')
      // return data.json()
    })
    .then((location) => {
      console.log('location',location)
      if (this.editContent) {
        this.wtkClass.updateContentTextItem(location, this.wtkItemContent, 'text', groupPath)
      }
      else{
        this._closeClick()
        this.wtkClass.addContentItem(location, this.wtkContent, this.wtkContent.lastChild, 'text')
      }
      this.wtkContent.updateCJ(groupPath, this.wtkContent.wtkName)

    })
    .catch((err) => {
    console.log(err)
    })
  }
  _closeClick(evt){
    // evt.preventDefault()
    let wtkTextItemElem=document.querySelector('wtk-new-text-item')

    if (this.editContent) {
        let parent=wtkTextItemElem.parentNode
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
  _imgItemInit(){
    // make shadow root
    // this.target=this.attachShadow({mode: 'open'});
    this.target=this

    let textHTML=document.createElement('div')
    fetch(`${this.wtkClass.base}/views/img-item-ctrl.html`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      textHTML.innerHTML=data
      this.target.appendChild(textHTML)
      // window.tinymce.dom.Event.domLoaded = true;
      // tinymce.init({ selector:'#wtk__imgItem' });

      if (this.editContent) {
        this.metaData=this.wtkItemContent.getMetaData()
        console.log(this.wtkItemContent)
        let metaWtkWidth
        let metaWtkHeight
        let metaWtkCont
        // this.metaData.data.forEach((val, key) => {
        //   metaWtkWidth=val.name=="wtkWidth" ? val.value
        //   metaWtkHeight=val.name=="wtkHeight" ? val.value
        //   metaWtkCont=val.name=="wtkCont" ? val.value
        // })
        let wtkWidthElem=this.wtkItemContent.querySelector('form input[name="wtkWidth"]')
            .value=this.metaData.data.find((data) => {
              return data.name=="wtkWidth"
            }).value
        let wtkHeightElem=this.wtkItemContent.querySelector('form input[name="wtkHeight"]')
            .value=this.metaData.data.find((data) => {
              return data.name=="wtkHeight"
            }).value
        let imgNameElem=this.wtkItemContent.querySelector('#imgName')
            .innerHTML=this.metaData.data.find((data) => {
              return data.name=="wtkCont"
            }).value
        let imgFileElem=this.wtkItemContent.querySelector('.imgUploader')
            .src=this.wtkItemContent.querySelector('wtk-imgfile img').src
        //     console.log(this.target)
        // let wtkTinyMCECont=this.target.querySelector('#wtk__textItem')
        //     wtkTinyMCECont.innerHTML=wtkContentItem.innerHTML
      }
      this._wtkImgItemCtrlInit()
      
    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    })

    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/img-item-ctrl.css`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      css.innerHTML = data
      this.target.insertBefore( css, this.target.firstChild )
    })
    .catch((err) => {
      this.wtkClass.toast(err)
      console.log(err)
      alert("Ups! Nepodařilo se nahrát styly pro tlacitko. Zkuste aktualizovat stránku.")
    })
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
  _saveClick(evt){
    evt.preventDefault()
    console.log('this')
    // return
    let imgCont=""
    // headers
    console.log(evt)
    let form = evt.target
    console.log(form)
    let formData = new FormData(form)
    console.log(formData)
    console.log(this.imgContFileInput.files[0])

    let boundary="blob"
    console.log(boundary)

    let wtkCont=this.imgContFileInput.files[0]
    let method=this.editContent ? 'PUT' : 'POST'
    let groupPath=this.groupName==null ? 'contents' : 'groups'

    let path=this.editContent ? `${groupPath}/${this.wtkItemHref}` : `${groupPath}/${this.wtkContent.wtkName}/items`

    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        // myHeaders.append('Content-Type', 'multipart/form-data; ');
        // myHeaders.append('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);
    // cj
    // TODO
    // getMetaData() from contentElement
    // no need for looping in position

    console.log('this.editContent', this.editContent)
    let cj=this.wtkContent.getCJ()
    let cjPosition = 0
    if (cj.collection.items.length!=0) {
      cjPosition = cj.collection.items[cj.collection.items.length-1].data.find((val, key) => {
        console.log(val)
        return val.name==="wtkPosition"
      })
      console.log(cjPosition)
      cjPosition=this.editContent ? cjPosition.value : cjPosition.value+1
      // cjPosition=1
    }
    // body
    // return
    console.log(cjPosition)
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

    // if(reader.readyState === FileReader.LOADING) {
    //   reader.abort();
    // }
    // let file = reader.readAsBinaryString(wtkCont);
        // console.log(file)

    // let data=""
    // data += "--" + boundary + "\r\n";

    // // Describe it as form data
    // data += 'content-disposition: form-data; '
    // // Define the name of the form data
    //       + 'name="'         + "wtkImgContent"          + '"; '
    // // Provide the real name of the file
    //       + 'filename="'     + wtkCont.name + '"\r\n';
    // // And the MIME type of the file
    // data += 'Content-Type: ' + wtkCont.type + '\r\n';

    // // There's a blank line between the metadata and the data
    // data += '\r\n';
    
    // // Append the binary data to our body's request
    // data += file.binary + '\r\n';




    // console.log(data)
    let body = new FormData(evt.target)

    let imgInfo=body.get('img')

    let imgWidth=body.get('wtkWidth')=="" ? "auto" : body.get('wtkWidth') 
    let imgHeight=body.get('wtkHeight')=="" ? "auto" : body.get('wtkHeight') 

    console.log(imgHeight, imgWidth)

    let bodyData=[{name:'wtkType', value:'img'}, {name:'wtkWidth', value:imgWidth}, {name:'wtkHeight', value:imgHeight}]

    if (!this.editContent) { bodyData.push({name:'wtkPosition', value:cjPosition})}

    // body.prepend('bodyData', JSON.stringify(bodyData))
    console.log(body.get('img'))
    console.log(body)

    let metaWtkCont
    let body2= new FormData()
    console.log(this.metaData)
    console.log(this.metaData.length)
    if (this.metaData!=undefined && Object.keys(this.metaData).length!==0) {
      metaWtkCont=this.metaData.data.find((val) => {
        return val.name=="wtkCont"
      }).value
      console.log(metaWtkCont)
      console.log(imgInfo.name)
    }
    if (imgInfo.name!=metaWtkCont && imgInfo.name!="") {
      console.log(' ola')
      bodyData.push({name:'wtkCont', value:imgInfo.name})
      body2.append('img',body.get('img'))
    }
    body2.append('bodyData', JSON.stringify(bodyData))
    console.log(body2)
    // ${this.wtkContent.wtkName}
    console.log(path)
    // return
    // let conf=confirm("send?")
    // if (!conf) { return }

    fetch(`${this.wtkClass.api}/${path}`,{
      method:method, 
      body:body2,//JSON.stringify(body), 
      headers:myHeaders
    })
    .then((data) => {
      console.log(data)
      console.log(data.headers.get('location'))
      return data.headers.get('location')
      // return data.json()
    })
    .then((location) => {
      console.log(location)

      if (this.editContent) {
        this.wtkItemContent.setSize({'wtkWidth':imgWidth, 'wtkHeight':imgHeight})
        this.wtkClass.updateContentImgItem(location, this.wtkItemContent, 'img', groupPath)
      }
      else{
        this.wtkClass.addContentItem(location, this.wtkContent, this.wtkContent.lastChild, 'img')
      }
      this._closeClick()
      this.wtkContent.updateCJ(groupPath, this.wtkContent.wtkName)

    })
    .catch((err) => {
      this.wtkClass.toast(err)
      console.log(err)
    })
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

    this.wtkClass._getTinyMCEJS()
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
  _itemUpClick(evt){
    evt.preventDefault()
     // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    let item=this.wtkContent.getItemByID(this.wtkItemHref)
    let cj=this.wtkContent.getCJ()

    let prevItem=item

    // let nextItemCJ=cj.collection.items.find((val, key, list) => {
    //   nextItem=list[key+1]
    //   return val.href==this.wtkItemHref
    // })

    let prevItemCJ=cj.collection.items.find((val) => {
      let prevItemVisible=val.data.find((valItem) => {
        return valItem.name=="wtkVisible"
      })
      if (prevItemVisible.value && val.href!=this.wtkItemHref) { 
        prevItem=val 
      }
      return val.href==this.wtkItemHref
    })
    console.log(prevItem)
    console.log(item)
    console.log(prevItem.href==item.href)
    if (prevItem.href==item.href) { return }
    let prevItemPosition=prevItem.data.find((val) => {
      return val.name=="wtkPosition"
    })
    let itemPosition=item.data.find((val) => {
      return val.name=="wtkPosition"
    })
    let itemType=item.data.find((data) => {
      return data.name=="wtkType"
    })
    prevItemPosition=prevItemPosition.value
    itemPosition=itemPosition.value
    itemType=itemType.value

    console.log('prevItemPosition',prevItemPosition)
    console.log('itemPosition',itemPosition)

    let bodyPrevItem=[{name:"wtkPosition", value:prevItemPosition}]
    let bodyItem=[{name:"wtkPosition", value:itemPosition}]
    let itemsToEdit=[
      {href:item.href, body:bodyPrevItem},
      {href:prevItem.href, body:bodyItem}
    ]
    // return
    let path=this.groupName==null ? 'contents' : 'groups'

    let updateItems=(val) => {
      fetch(`${this.wtkClass.api}/${path}/${val.href}`,{
        method:'PUT', 
        body:JSON.stringify(val.body), 
        headers:myHeaders
      })
      .then((data) => {
        console.log('this')
        return data.headers.get('location')
      })
      .then((location) => {
        if (location==this.wtkItemHref) { 
          this.wtkClass.addContentItem(location, this.wtkContent, this.wtkItemELem.previousSibling, itemType)
          this.wtkContent.updateCJ(path, this.wtkContent.wtkName)
          this.parentNode.remove()
          updateItems(itemsToEdit[1])
        }
        this.wtkContent.updateCJ(path, this.wtkContent.wtkName)
      })
      .catch((err) => {
        console.log(err)
        this.wtkClass.toast(err)
      })
    }
    updateItems(itemsToEdit[0])
  }
  _itemDownClick(evt){
    evt.preventDefault()
    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    let item=this.wtkContent.getItemByID(this.wtkItemHref)
    let cj=this.wtkContent.getCJ()

    let nextItem=item

    let nextItemCJ=cj.collection.items.find((val, key, list) => {
      nextItem=list[key+1]
      return val.href==this.wtkItemHref
    })
    if (nextItem==undefined) { return }
    let nextItemPosition=nextItem.data.find((val) => {
      return val.name=="wtkPosition"
    })
    let itemPosition=item.data.find((val) => {
      return val.name=="wtkPosition"
    })
    let itemType=item.data.find((val) => {
      return val.name=="wtkType"
    })
    nextItemPosition=nextItemPosition.value
    itemPosition=itemPosition.value
    itemType=itemType.value

    let bodyNextItem=[{name:"wtkPosition", value:nextItemPosition}]
    let bodyItem=[{name:"wtkPosition", value:itemPosition}]
    let itemsToEdit=[
      {href:item.href, body:bodyNextItem},
      {href:nextItem.href, body:bodyItem}
    ]
    console.log(this.wtkItemELem.nextSibling)
    // return
    let path=this.groupName==null ? 'contents' : 'groups'
    let updateItems=(val) => {
      fetch(`${this.wtkClass.api}/${path}/${val.href}`,{
        method:'PUT', 
        body:JSON.stringify(val.body), 
        headers:myHeaders
      })
      .then((data) => {
        return data.headers.get('location')
      })
      .then((location) => {
        if (location==this.wtkItemHref) { 
          this.wtkClass.addContentItem(location, this.wtkContent, this.wtkItemELem.nextSibling.nextSibling, itemType)
          this.wtkContent.updateCJ(path, this.wtkContent.wtkName)
          this.parentNode.remove()
          updateItems(itemsToEdit[1])
        }
        this.wtkContent.updateCJ(path, this.wtkContent.wtkName)
      })
      .catch((err) => {
        console.log(err)
        this.wtkClass.toast(err)
      })
    }
    updateItems(itemsToEdit[0])
  }
  _itemTrashClick(evt){
    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    let path=this.groupName==null ? 'contents' : 'groups'
    fetch(`${this.wtkClass.api}/${path}/${this.wtkItemHref}`,{
      method:'DELETE', 
      headers:myHeaders
    })
    .then((data) => {
      return data.json()
    })
    .then((cj) => {
      console.log(cj)
      this.parentNode.remove()
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _tinymceLoaded(){
    // make shadow root
    // this.target=this.attachShadow({mode: 'open'});
    this.target=this

    let textHTML=document.createElement('div')
    fetch(`${this.wtkClass.base}/views/text-item-ctrl.html`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      textHTML.innerHTML=data
      this.target.appendChild(textHTML)
      // window.tinymce.dom.Event.domLoaded = true;
      tinymce.init({ selector:'#wtk__textItem' });

      this._wtkTextItemCtrlInit()
      
    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    })

    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/text-item-ctrl.css`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      css.innerHTML = data
      this.target.insertBefore( css, this.target.firstChild )
    })
    .catch((err) => {
      this.wtkClass.toast(err)
      console.log(err)
      alert("Ups! Nepodařilo se nahrát styly pro tlacitko. Zkuste aktualizovat stránku.")
    })
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
  _itemCtrlInit(){
    this.target = this.attachShadow({mode: 'open'});
    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/group-ctrl.css`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      css.innerHTML = data
      this.target.insertBefore( css, this.target.firstChild )
    })
    .catch((err) => {
      console.log(err)
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

    // trash icon
    let trashIcon=document.createElement('img')
        trashIcon.src=`${this.wtkClass.base}/icons/itemTrash.svg`
    // trash button
    let trashButton=document.createElement('button')
        trashButton.appendChild(trashIcon)
        trashButton.addEventListener('click', this._itemTrashClick.bind(this))
    this.target.appendChild(trashButton)
  }
  _itemEditClick(evt){
    this.wtkClass._fetchWtkDep(
      `${this.wtkClass.base}/js/wtk-new-group.js`, 
      null, 
      this.target) 
    let wtkAlocNewGroup = document.createElement('wtk-aloc-new-group')
        wtkAlocNewGroup.setAttribute('wtk-group-name', this.wtkName)
    document.body.appendChild(wtkAlocNewGroup)    
  }
  _itemTrashClick(evt){
    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    let path=this.groupName==null ? 'contents' : 'groups'
    fetch(`${this.wtkClass.api}/groups/${this.wtkItemHref}`,{
      method:'DELETE',
      headers:myHeaders
    })
    .then((data) => {
      return data.json()
    })
    .then((cj) => {
      console.log(cj)
      this.parentNode.remove()
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
}
customElements.define('wtk-group-ctrl', wtkGroupCtrl);
