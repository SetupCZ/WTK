'use strict';
class wtkNewGroupCtrl extends HTMLElement{
  constructor(args) {
    super();
    this.wtkClass=new wtk()
  }
  connectedCallback(){
    this.wtkGroup=this.closest('wtk-group') || this.closest('wtk-group-meta')
    this.wtkName=this.wtkGroup.getAttribute('wtk-name')
    this._newGroupCtrlInit()
  }
  _newGroupCtrlInit(){
    // make shadow root
    this.target = this.attachShadow({mode: 'open'});
    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/aloc-new-group-btn.css`)
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
    let wtkAlocNewGroup = document.createElement('wtk-aloc-new-group')
        wtkAlocNewGroup.setAttribute('wtk-name', this.wtkName)
    document.body.appendChild(wtkAlocNewGroup)    
    // this.wtkClass.__fetchWtkDep(null, 'wtk-aloc-new-content', document.body)
  }
}

customElements.forcePolyfill = true;
customElements.define('wtk-new-group', wtkNewGroupCtrl);


class wtkAlocNewGroup extends HTMLElement {
  constructor(args) {
    super();
    this.wtkClass=new wtk()
    // get base url

  }
  connectedCallback(){
    this.wtkName=this.getAttribute("wtk-name")
    this.wtkGroupName=this.getAttribute("wtk-group-name")
    this.editGroup=this.wtkGroupName!=null ? true : false
    this.groupAttrs=[]
    this.newGroupWrapper=document.createElement('div')
    this.newGroupWrapper.classList.add('wtk_alocNewGroupWrapper')
    
    this._alocNewGroupInit()
  }
  _alocNewGroupInit(){
    // make shadow root
    this.target=this.attachShadow({mode: 'open'});
    console.log(this)
    fetch(`${this.wtkClass.base}/views/aloc-new-group.html`)
    .then((data) => {
      return data.text()
    })
    .then((data) => {
      this.newGroupWrapper.innerHTML=data
      this.target.appendChild(this.newGroupWrapper)
      if (this.editGroup) {
        this._initEditGroup()
      }
      let attrOptions=[
        {name:"text", value:"text", selected:"selected"},
        {name:"password", value:"password", selected:""},
        {name:"email", value:"email", selected:""},
        {name:"tel", value:"tel", selected:""},
        {name:"checkbox", value:"checkbox", selected:""},
        {name:"select", value:"select", selected:""},
        {name:"date", value:"date", selected:""},
      ]
      this.attrTypeSelect=this.target.querySelector('#wtk__attrTypeSelect')
      this.attrTypeSelect.addEventListener('change', this._changeAttrType.bind(this))
      this.wtkClass.addOptionsToSelect(this.attrTypeSelect, attrOptions)



      let addAttrToContenBtn=this.target.querySelector('#wtk__addAttrToContenBtn')
          addAttrToContenBtn.addEventListener('click', this._addAttrToContent.bind(this))

      let closeAlocNewGroup=this.target.querySelector('#wtk__closeAlocNewGroupBtn')
          closeAlocNewGroup.addEventListener('click', this._closeAlocNewGroupClick.bind(this))
      // form
      this.addNewAttrForm=this.target.querySelector('#wtk__newAttrForm')
      this.addNewAttrForm.addEventListener('submit', this._submitNewAttrForm.bind(this))

      this.alocNewGroupForm=this.target.querySelector('#wtk__newGroupForm')
      this.alocNewGroupForm.addEventListener('submit', this._submitAlocNewGroup.bind(this))
      // this.alocNewGroupForm.querySelector('input[name="wtkName"]').value=this.wtkName
      // validate input on all elems
      let validateClass = new validateInput()
      for (let i = 0; i < this.alocNewGroupForm.elements.length; i++) {
        this.alocNewGroupForm[i].addEventListener('keyup', validateClass._onKeyUp.bind(validateClass))
        this.alocNewGroupForm[i].addEventListener('keydown', validateClass._onKeyDown.bind(validateClass))
      }

    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    })

    // css
    let css=document.createElement('style')
    fetch(`${this.wtkClass.base}/css/aloc-new-group.css`)
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
  }
  _initEditGroup(){
    fetch(`${this.wtkClass.apiOpen}/groups/${this.wtkGroupName}`)
    .then((data) => {
      return data.json()
    })
    .then((cj) => {
      this._setGroupMetaData(cj)
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _setGroupMetaData(cj){
    console.log(cj)
    // this.newGroupWrapper.querySelector('input[name="wtkName"]').value=this.wtkGroupName
    cj.collection.items.forEach((val, key) => {
      let body={}
      val.data.forEach((val, key) => {
        body[val.name]=val.value
      })
      this._updateAttrs(body)
    })
  }
  _changeAttrType(evt){
    let opt=evt.target || target
    let parent=this.target
    if (opt.value=="text") { this._loadNewInputAttr("text") }
    if (opt.value=="password") { this._loadNewInputAttr("password") }
    if (opt.value=="email") { this._loadNewInputAttr("email") }
    if (opt.value=="tel") { this._loadNewInputAttr("tel") }
    if (opt.value=="date") { this._loadNewInputAttr("date") }
    if (opt.value=="checkbox") {}
    if (opt.value=="selecet") {}
  }
  _loadNewInputAttr(type){
    let name=""
    let label=""
    let regex=""
    let required=""
          // onchange="${this._setCodeParams.bind(this, 'name')}"
    let wtkAttrValueElem = this.target.querySelector('.wtkAttrValue')
        wtkAttrValueElem.innerHTML=`
          <div class="wtk-layout wtk-align-between-start">
            <div class="inputWrapper">
              <label for="wtkAttrName">Name</label>
              <input type="text" name="wtkAttrName" required > 
            </div>
            <div class="inputWrapper">
              <label for="wtkAttrLabel">Label</label>
              <input type="text" name="wtkAttrLabel" required> 
            </div>
            <div class="inputWrapper">
              <label for="wtkAttrRegex">Regex</label>
              <input type="text" name="wtkAttrRegex"> 
            </div>
            <div class="inputWrapper">
              <label for="wtkAttrReq">Required</label>
              <input type="checkbox" name="wtkAttrReq" value="checked"> 
            </div>
          </div>
          <code style="display: inline-block; background-color:lightgrey; padding:5px 15px; border-radius:3px; margin:10px 0; color:grey;">
              &lt;input type="${type}" label="" name="" pattern="" /&gt;
          </code>
        ` // <--NEMAZAT!
        // replace < by &lt; and > by &gt;
        let wtkAttrName = wtkAttrValueElem.querySelector('input[name="wtkAttrName"]')
            console.log(wtkAttrName)
            wtkAttrName.addEventListener('keyup', this._setCodeParams.bind(this, 'name'))
        let wtkAttrLabel = wtkAttrValueElem.querySelector('input[name="wtkAttrLabel"]')
            wtkAttrLabel.addEventListener('keyup', this._setCodeParams.bind(this, 'label'))
        let wtkAttrRegex = wtkAttrValueElem.querySelector('input[name="wtkAttrRegex"]')
            wtkAttrRegex.addEventListener('keyup', this._setCodeParams.bind(this, 'regex'))
        let wtkAttrReq = wtkAttrValueElem.querySelector('input[name="wtkAttrReq"]')
            wtkAttrReq.addEventListener('click', this._setCodeParams.bind(this, 'name'))
  }
  _setCodeParams(param, evt){
    // console.log(param)
    // console.log(evt)
    // console.log(evt.target.value)
    let wtkAttrCodeElem = this.target.querySelector('.wtkAttrValue code')
    let text=wtkAttrCodeElem.innerHTML
    text.replace(`/${param}\=([\"\'])(?:(?=(\\?))\\2.)*?\\1/`, `${param}="${evt.target.value}"`)
    // console.log(text)
    // console.log(wtkAttrCodeElem.innerHTML)
    // wtkAttrCodeElem.innerHTML=text
  }
  _addAttrToContent(evt){
    let wtkNewAttribute=this.target.querySelector('.wtkNewAttribute')
        wtkNewAttribute.classList.toggle('wtk-hidden')
    this.attrTypeSelect.dispatchEvent(new Event('change'));
  }
  _submitNewAttrForm(evt){
    evt.preventDefault()
    let target=evt.target
    let body={}
    let validForm=true;
    console.log(target)

    let validateClass = new validateInput()
    for (let i = 0; i < this.addNewAttrForm.elements.length; i++) {
      if (target.elements[i].type!='submit') {
        // validForm=validateClass._validateInput(target.elements[i]);
        if (target.elements[i].name=="wtkAttrReq") {
          target.elements[i].value=target.elements[i].checked?'required':''
        }
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    this._updateAttrs(body)
    console.log(body)
  }
  _updateAttrs(body){
    this.groupAttrs.push(body)
    console.log(body.wtkAttrReq)
    let groupAttr=document.createElement('div')
        groupAttr.innerHTML=`
          <code style="display: inline-block; background-color:lightgrey; padding:5px 15px; border-radius:3px; margin:10px 0; color:grey;">
            &lt;input type="${body.wtkAttrType}" label="${body.wtkAttrLabel}" name="${body.wtkAttrName}" pattern="${body.wtkAttrRegex}" ${body.wtkAttrReq} /&gt;
          </code>
          <button class="wtkDropAttr" wtk-attr-pos="${this.groupAttrs.length-1}">ODEBRAT</button>
        `
    let wtkAttributesHidden=this.target.querySelector('.wtkAttributesHidden')
        wtkAttributesHidden.appendChild(groupAttr)
    let wtkDropAttr=groupAttr.querySelector('.wtkDropAttr')
        wtkDropAttr.addEventListener('click', this._dropAttr.bind(this))
        console.log(this.groupAttrs)
  }
  _dropAttr(evt){
    evt.preventDefault()
    let target=evt.target
    let attrPos=target.getAttribute('wtk-attr-pos')
    console.log(target.parentNode)
    target.parentNode.parentNode.removeChild(target.parentNode)
    this.groupAttrs.splice(attrPos, 1)
    console.log(this.groupAttrs)
  }
  _submitAlocNewGroup(evt){
    evt.preventDefault();
    let target=evt.target

    let body={}
    let validForm=true;

    let validateClass = new validateInput()
    for (let i = 0; i < this.alocNewGroupForm.elements.length; i++) {
      if (target.elements[i].type!='submit' && target.elements[i].type!='button') {
        validForm=validateClass._validateInput(target.elements[i]);

        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }
      
    let method=this.editGroup ? 'PUT' : 'POST'
    let path=this.editGroup ? `groups/${this.wtkGroupName}` : 'groups'

    // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);
        
    body.wtkName=this.wtkName
    body.groupAttrs=this.groupAttrs
    console.log(body)

    // return 
    fetch(`${this.wtkClass.api}/${path}`, {
      method:method, 
      body:JSON.stringify(body), 
      headers:myHeaders
    })
    .then((data) => {
      return data.json()
    })
    .then((data) => {
      console.log(data)
      let updateGroupName=this.editGroup? this.wtkGroupName : this.wtkName
      console.log(updateGroupName)
      this.wtkClass.updateGroup(updateGroupName)      
      this.wtkClass.toast("Group přidán.")
      // this.wtkClass.__fetchWtkDep(null, 'wtk-aloc-new-group', document.body)
      this._closeAlocNewGroupClick()


    })
    .catch((err) => {
      console.log(err)
      this.wtkClass.toast(err)
    })
  } 
  _closeAlocNewGroupClick(){
    console.log(this.parentNode)
    this.parentNode.removeChild(this)
  }


  // methods
}
customElements.define('wtk-aloc-new-group', wtkAlocNewGroup);
