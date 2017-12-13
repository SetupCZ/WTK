import validateInput from './wtkValidateInput.js'
import wtk from './wtk.js'
const validateClass = new validateInput()
const wtkClass = new wtk()
class wtkLogin {
  constructor(args) {
    this.loginForm=document.querySelector('#wtkLoginForm')
    this.loginForm.addEventListener('submit', this._submitLoginForm.bind(this))

    this.wtkPswdReset=this.loginForm.querySelector('#wtkPswdReset')
    this.wtkPswdReset.addEventListener('click', this._resetPswd.bind(this))

    this.wtkForgotPswdForm=document.querySelector('#wtkForgotPswdForm')
    this.wtkForgotPswdForm.addEventListener('submit', this._submitForgotPswd.bind(this))

    this.globalMsg=document.querySelector('#globalMsg')

    for (const val of this.loginForm.elements) {
      val.addEventListener('keyup', validateClass._onKeyUp.bind(validateClass))
      val.addEventListener('keydown', validateClass._onKeyDown.bind(validateClass))
    }
  }
  async _submitLoginForm(evt){
    evt.preventDefault()
    const target=evt.target
    const body = {};
    let validForm = true;

    for (const val of target.elements) {
      if (val.type!='submit') {
        validForm=validateClass._validateInput(val);
        body[val.name]=val.value;
      }
    }
    if (!validForm) { return wtkClass.toast("Některá pole jsou špatně vyplněna!") }

    const pswdCrypted = CryptoJS.SHA256(body.wtkLoginPswd).toString(CryptoJS.enc.Hex);
    body.wtkLoginPswd = pswdCrypted
    
    const path = `/${wtkClass.openApi}/wtk-login`
    let loginHeaders = new Headers();
        loginHeaders.append('Content-Type', 'application/json');

    const response = await fetch(path,{
      method:'POST', 
      body: JSON.stringify(body), 
      headers:myHeaders, 
      credentials: 'same-origin'
    }).catch(_ => {})
    if (!response.ok) return wtkClass.toast(response.statusText)
    window.location = '/'
  }
  _wrongUser(){
    // alert('Ups! Něco je špatně. Zkuste se přihlásit znovu.')
  }
  _resetPswd(){
    this.loginForm.style.display="none"
    this.wtkForgotPswdForm.style.display="block"
  }
  async _submitForgotPswd(evt){
    evt.preventDefault()
    const target=evt.target
    const body = {};
    let validForm = true;

    for (const val of target.elements) {
      if (val.type!='submit') {
        validForm = validateClass._validateInput(val);
        body[val.name]=val.value;
      }
    }
    if (!validForm) { return wtkClass.toast("Některá pole jsou špatně vyplněna!") }

    const path = `/${wtkClass.openApi}/wtk-forgotPswd`
    let resPswdHeaders = new Headers();
        resPswdHeaders.append('Content-Type', 'application/json');
        // resPswdHeaders.append('Content-Type', 'form-data; ');
    const response = await fetch(path, {
      method:'POST', 
      body: JSON.stringify(body), 
      headers: resPswdHeaders
    }).catch(_ => {})
    if (!response.ok) return wtkClass.toast(response.statusText)
    this.globalMsg.innerText = "Byl vám zaslán ověřovací E-mail."
  }
}
window.addEventListener('load', ()=>{
  new wtkLogin()
})