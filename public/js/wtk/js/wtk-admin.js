'use strict';
import wtk from '../wtk.js'
import validateInput from '../wtkValidateInput.js'

class wtkAdmin {
  constructor(args) {
    this.wtkClass = new wtk()
    this._initAdmin()
  }
  async _initAdmin(evt) {
    if (!this.wtkClass.user) return

    const adminWrapperELem = document.createElement('div')
          adminWrapperELem.style.position = "fixed"
          adminWrapperELem.style.bottom = "calc(100% - 50px)"
          adminWrapperELem.style.left = "0"
    document.body.appendChild(adminWrapperELem)
          
    this.target = adminWrapperELem.attachShadow({ mode: 'open' });

    const htmlPath = `${this.wtkClass.base}/views/admin.html`
    const cssPath = `${this.wtkClass.base}/css/admin.css`

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
    
    this._initElements()
    this._buildSecQ()
  }
  _initElements(){

    this.userInfoForm = 
      this.target.querySelector('form#userInfoForm')
    this.userInfoForm
      .addEventListener('submit', this._saveUserInfo.bind(this))

    this.changePswdBtn = 
      this.target.querySelector('#changePswd')
    this.changePswdBtn
      .addEventListener('click', this._showPswdForm.bind(this))

    this.userPswdFormWrapper = 
      this.target.querySelector('#userPswdFormWrapper')
    this.userPswdForm = 
      this.target.querySelector('form#userPswdForm')
    this.userPswdForm
      .addEventListener('submit', this._saveUserPswd.bind(this))

    this.userPswdCloseBtn = 
      this.target.querySelector('#userPswdCloseBtn')
    this.userPswdCloseBtn
      .addEventListener('click', this._closeUserPswd.bind(this))

    this.secQForm = 
      this.target.querySelector('form#secQForm')
    this.secQForm
      .addEventListener('submit', this._saveUserInfo.bind(this))

    this.adminMainElem = 
        this.target.querySelector('#wtk-admin')
    this.labelElem = 
      this.target.querySelector('#wtk-admin-label')
    this.labelElem
      .addEventListener('click', this._showAdmin.bind(this))

  }
  async _buildSecQ(evt) {
    this.metaData = await this.wtkClass.getGeneralMetadata()
    const formSelects = this.secQForm.querySelectorAll('select')
    formSelects.forEach((val, key) => {
      this.metaData.metaData.user.secQ.forEach((valOpt, key) => {
        const option = document.createElement('option')
              option.value = valOpt.val
              option.innerText = valOpt.text
        val.appendChild(option)
      })
    })
    this._alocUserInfo()
  }
  _alocUserInfo() {
    // this.userInfoForm.elements['wtkLoginName'].value = this.user.email

    // this.secQForm.elements['wtkSecQ1'].querySelector(`option[value="${this.user.secQ1}"]`).selected = true
    // this.secQForm.elements['wtkSecQ2'].querySelector(`option[value="${this.user.secQ2}"]`).selected = true
  }
  _closeUserPswd(evt) {
    evt.preventDefault()
    this.userPswdFormWrapper.style.display = "none"
  }
  _showPswdForm(evt) {
    evt.preventDefault()
    this.wtkClass.fetchWtkDep('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js')
    this.userPswdFormWrapper.style.display = "block"
  }
  _showAdmin(evt){
    this.adminMainElem.classList.toggle('showAdmin')
  }
  async _saveUserInfo(evt) {
    evt.preventDefault()
    const target = evt.target
    let validForm = true
    const body = {}
    const validateClass = new validateInput()
    for (const val of target.elements) {
      if (val.type != 'submit' && val.type != 'file') {
        validForm = validateClass._validateInput(val);
        body[val.name] = val.value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }

    const userHeaders = new Headers();
          userHeaders.append('Content-Type', 'application/json');

    const path = `${this.wtkClass.api}/user`
    const response = await fetch(path, { 
      method: "PUT", 
      body: JSON.stringify(body), 
      headers: userHeaders 
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)

    this.wtkClass.toast('user saved!')
  }
  async _saveUserPswd(evt) {
    evt.preventDefault()
    const target = evt.target
    let validForm = true
    const body = {}
    const validateClass = new validateInput()
    for (const val of target.elements) {
      if (val.type != 'submit' && val.type != 'file') {
        validForm = validateClass._validateInput(val);
        body[val.name] = val.value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }

    body.wtkLoginPswdNew = 
      CryptoJS.SHA256(body.wtkLoginPswdNew).toString(CryptoJS.enc.Hex);
    body.wtkLoginPswdNewAgain = 
      CryptoJS.SHA256(body.wtkLoginPswdNewAgain).toString(CryptoJS.enc.Hex);
    body.wtkLoginPswdOld = 
      CryptoJS.SHA256(body.wtkLoginPswdOld).toString(CryptoJS.enc.Hex);

    const pswdHeaders = new Headers();
          pswdHeaders.append('Content-Type', 'application/json');

    const path = `${this.wtkClass.api}/user`
    const response = await fetch(path, { 
      method: "PUT", 
      body: JSON.stringify(body), 
      headers: pswdHeaders 
    }).catch(_ => {})
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    this.wtkClass.toast('Password change succesfull!')
  }
  async _saveSecQ(evt) {
    evt.preventDefault()
    const target = evt.target
    let validForm = true
    const body = {}
    const validateClass = new validateInput()
    for (const val of target.elements) {
      if (val.type != 'submit' && val.type != 'file') {
        validForm = validateClass._validateInput(val);
        body[val.name] = val.value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }

    const secQHeaders = new Headers();
          secQHeaders.append('Content-Type', 'application/json');

    const path = `${this.wtkClass.api}/user`
    const response = await fetch(path, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: secQHeaders
    }).catch(_ => { })
    if (!response.ok) return this.wtkClass.toast(response.statusText)
    this.wtkClass.toast('Security questions change succesfull!')
  }
}
new wtkAdmin()