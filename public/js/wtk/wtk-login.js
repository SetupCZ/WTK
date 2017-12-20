import validateInput from './wtkValidateInput.js'
const validateClass = new validateInput()

class wtkBasic {
  constructor(){
    this.apiOpen = "/wtk"
  }
  toast(msg, mainErr) {
    console.log(msg)
    // let mainErr=errMsg.querySelector('.mad-main-errMsg')
    //     mainErr.innerText=msg
    //     mainErr.classList.add(err?'colE':'colC')
    let toastElm = document.createElement('div')
    toastElm.innerText = msg
    toastElm.style.position = 'fixed'
    toastElm.style.zIndex = 9999
    toastElm.style.top = '8px'
    toastElm.style.right = '8px'
    toastElm.style.backgroundColor = '#212121'
    toastElm.style.color = '#fff'
    toastElm.style.borderRadius = '3px'
    toastElm.style.padding = '4px 16px'
    document.body.appendChild(toastElm)
    setTimeout(function () {
      toastElm.parentNode.removeChild(toastElm)
      // mainErr.classList.remove('colE')
      // mainErr.classList.remove('colC')
      // mainErr.innerText=""
    }, 5000);
  }
}
const wtkClass = new wtkBasic()

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
      if (val.type != 'submit' && val.type != 'button') {
        validForm=validateClass._validateInput(val);
        body[val.name]=val.value;
      }
    }
    if (!validForm) { return wtkClass.toast("Některá pole jsou špatně vyplněna!") }

    const pswdCrypted = CryptoJS.SHA256(body.wtkLoginPswd).toString(CryptoJS.enc.Hex);
    body.wtkLoginPswd = pswdCrypted
    
    const path = `${wtkClass.apiOpen}/wtk-login`
    console.log(path);
    let loginHeaders = new Headers();
        loginHeaders.append('Content-Type', 'application/json');

    const response = await fetch(path,{
      method:'POST', 
      body: JSON.stringify(body), 
      headers: loginHeaders, 
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

    const path = `${wtkClass.apiOpen}/wtk-forgotPswd`
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