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
  async _newGroupCtrlInit(){
    // make shadow root
    this.target = this.attachShadow({mode: 'open'});
    // css
    const path = `${this.wtkClass.base}/css/aloc-new-group-btn.css`
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) return this.wtkClass.toast("Ups! Nepodařilo se nahrát styly pro tlacitko. Zkuste aktualizovat stránku.")

    const css = document.createElement('style')
          css.innerHTML = await response.text()
    this.target.insertBefore(css, this.target.firstChild)

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
    
    
    this._alocNewGroupInit()
  }
  async _alocNewGroupInit(){
    // make shadow root
    this.target=this.attachShadow({mode: 'open'});
    const htmlPath = `${this.wtkClass.base}/views/aloc-new-group.html`
    const cssPath = `${this.wtkClass.base}/css/aloc-new-group.css`

    const htmlPromise = fetch(htmlPath).catch(_ => { })
    const cssPromise = fetch(cssPath).catch(_ => { })
    const [htmlResponse, cssResponse] = await Promise.all([htmlPromise, cssPromise])

    if (!htmlResponse.ok || !cssResponse.ok) return this.wtkClass.toast("Ups! Něco se nepovedlo. Zkuste aktualizovat stránku.")

    // css
    const css = document.createElement('style')
    css.innerHTML = await cssResponse.text()
    this.target.insertBefore(css, this.target.firstChild)
    
    // html
    this.newGroupWrapper = document.createElement('div')
    this.newGroupWrapper.classList.add('wtk_alocNewGroupWrapper')
    this.newGroupWrapper.innerHTML = await htmlResponse.text() 
    this.target.appendChild(this.newGroupWrapper)
    
    this._initEditGroup()
    this._initAttrOptions()

    // form
    this.addNewAttrForm=this.target.querySelector('#wtk__newAttrForm')
    this.addNewAttrForm.addEventListener('submit', this._submitNewAttrForm.bind(this))

    this.alocNewGroupForm=this.target.querySelector('#wtk__newGroupForm')
    this.alocNewGroupForm.addEventListener('submit', this._submitAlocNewGroup.bind(this))
    // this.alocNewGroupForm.querySelector('input[name="wtkName"]').value=this.wtkName
    
    // validate input on all elems on keyup/keydown
    let validateClass = new validateInput()
    this.alocNewGroupForm.elements.forEach((val, key) => {
      val.addEventListener('keyup', validateClass._onKeyUp.bind(validateClass))
      val.addEventListener('keydown', validateClass._onKeyDown.bind(validateClass))
    })
  }
  _initAttrOptions(){
    const attrOptions = [
      { name: "text", value: "text", selected: "selected" },
      { name: "password", value: "password", selected: "" },
      { name: "email", value: "email", selected: "" },
      { name: "tel", value: "tel", selected: "" },
      { name: "checkbox", value: "checkbox", selected: "" },
      { name: "select", value: "select", selected: "" },
      { name: "date", value: "date", selected: "" },
    ]
    this.attrTypeSelect = this.target.querySelector('#wtk__attrTypeSelect')
    this.attrTypeSelect.addEventListener('change',
      this._changeAttrType.bind(this))
    this.wtkClass.addOptionsToSelect(this.attrTypeSelect, attrOptions)

    const addAttrToContenBtn =
      this.target.querySelector('#wtk__addAttrToContenBtn')
          addAttrToContenBtn.addEventListener('click', this._addAttrToContent.bind(this))

    const closeAlocNewGroup =
      this.target.querySelector('#wtk__closeAlocNewGroupBtn')
          closeAlocNewGroup.addEventListener('click', this._closeAlocNewGroupClick.bind(this))
  }
  _initEditGroup(){
    if (!this.editGroup) return 
    const path = `${this.wtkClass.apiOpen}/groups/${this.wtkGroupName}`
    const response = await fetch(path).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    const cj = await data.json()
    this._setGroupMetaData(cj)
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
    if (opt.value == "text") { this._loadNewInputAttr(opt.value) }
    if (opt.value == "password") { this._loadNewInputAttr(opt.value) }
    if (opt.value == "email") { this._loadNewInputAttr(opt.value) }
    if (opt.value == "tel") { this._loadNewInputAttr(opt.value) }
    if (opt.value == "date") { this._loadNewInputAttr(opt.value) }
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
    const wtkAttrName = 
      wtkAttrValueElem.querySelector('input[name="wtkAttrName"]')
          wtkAttrName.addEventListener('keyup', 
            this._setCodeParams.bind(this, 'name'))
    const wtkAttrLabel = 
      wtkAttrValueElem.querySelector('input[name="wtkAttrLabel"]')
          wtkAttrLabel.addEventListener('keyup', 
            this._setCodeParams.bind(this, 'label'))
    const wtkAttrRegex = 
      wtkAttrValueElem.querySelector('input[name="wtkAttrRegex"]')
          wtkAttrRegex.addEventListener('keyup', 
            this._setCodeParams.bind(this, 'regex'))
    const wtkAttrReq = 
      wtkAttrValueElem.querySelector('input[name="wtkAttrReq"]')
          wtkAttrReq.addEventListener('click', 
            this._setCodeParams.bind(this, 'name'))
  }
  _setCodeParams(param, evt){
    const wtkAttrCodeElem = this.target.querySelector('.wtkAttrValue code')
    let text = wtkAttrCodeElem.innerHTML
        text.replace(`/${param}\=([\"\'])(?:(?=(\\?))\\2.)*?\\1/`, 
          `${param}="${evt.target.value}"`)
  }
  _addAttrToContent(evt){
    const wtkNewAttribute = this.target.querySelector('.wtkNewAttribute')
          wtkNewAttribute.classList.toggle('wtk-hidden')
    this.attrTypeSelect.dispatchEvent(new Event('change'));
  }
  _submitNewAttrForm(evt){
    evt.preventDefault()
    const target=evt.target
    const body={}
    let validForm=true;
    console.log(target)

    let validateClass = new validateInput()
    for (let i = 0; i < this.addNewAttrForm.elements.length; i++) {
      if (target.elements[i].type!='submit') {
        if (target.elements[i].name=="wtkAttrReq") {
          target.elements[i].value=target.elements[i].checked?'required':''
        }
        validForm=validateClass._validateInput(target.elements[i]);
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    console.log(body)

    this._updateAttrs(body)
  }
  _updateAttrs(body){
    this.groupAttrs.push(body)
    let groupAttr = document.createElement('div')
        groupAttr.innerHTML=`
          <code style="display: inline-block; background-color:lightgrey; padding:5px 15px; border-radius:3px; margin:10px 0; color:grey;">
            &lt;input type="${body.wtkAttrType}" label="${body.wtkAttrLabel}" name="${body.wtkAttrName}" pattern="${body.wtkAttrRegex}" ${body.wtkAttrReq} /&gt;
          </code>
          <button class="wtkDropAttr" wtk-attr-pos="${this.groupAttrs.length-1}">ODEBRAT</button>
        ` //<= POZOR NEMAZAT
    let wtkAttributesHidden=this.target.querySelector('.wtkAttributesHidden')
        wtkAttributesHidden.appendChild(groupAttr)
    let wtkDropAttr=groupAttr.querySelector('.wtkDropAttr')
        wtkDropAttr.addEventListener('click', this._dropAttr.bind(this))
  }
  _dropAttr(evt){
    evt.preventDefault()
    const target=evt.target
    let attrPos=target.getAttribute('wtk-attr-pos')
    console.log(target.parentNode)
    target.parentNode.parentNode.removeChild(target.parentNode)
    this.groupAttrs.splice(attrPos, 1)
    console.log(this.groupAttrs)
  }
  _submitAlocNewGroup(evt){
    evt.preventDefault();
    const target=evt.target

    const body = {}
          body.wtkName = this.wtkName
          body.groupAttrs = this.groupAttrs
    let validForm = true;

    let validateClass = new validateInput()
    for (let i = 0; i < this.alocNewGroupForm.elements.length; i++) {
      if (target.elements[i].type!='submit' && 
          target.elements[i].type!='button') {
        validForm=validateClass._validateInput(target.elements[i]);
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }
      
    const method = this.editGroup ? 'PUT' : 'POST'
    const path = this.editGroup ? 
        `${this.wtkClass.api}/groups/${this.wtkGroupName}`: 
        `${this.wtkClass.api}/groups`

    const metaHeaders = new Headers();
          myHeaders.append('Content-Type', 'application/json');
    console.log(body)

    // return 
    const response = await fetch(path, {
      method:method, 
      body:JSON.stringify(body), 
      headers:myHeaders,
      credentials: 'same-origin'
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    const data = await response.json()
    console.log(data);
    
    // const 
    const updateGroupName=this.editGroup? this.wtkGroupName : this.wtkName
    this.wtkClass.updateGroup(updateGroupName)      
    this.wtkClass.toast("Group přidán.")
    this._closeAlocNewGroupClick()
  } 
  _closeAlocNewGroupClick(){
    this.parentNode.removeChild(this)
  }
}
customElements.define('wtk-aloc-new-group', wtkAlocNewGroup);
