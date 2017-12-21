import validateInput from '../wtkValidateInput.js'
const validateClass = new validateInput()

class wtkBasic {
  constructor() {
    this.apiOpen = "/wtk"
    this.base = "/js/wtk"
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
  async getGeneralMetadata() {
    const path = `${this.base}/wtkSettings.json`
    const response = await fetch(path).catch(_ => { })
    if (!response.ok) { this.toast(response.statusText); return false }
    return await response.json()
  }
}
const wtkClass = new wtkBasic()

class wtkResetPswd {
  constructor(args) {
    this.metaData = {}
    // this.user=JSON.parse(this.wtkClass.getCookie('userForWeb'))

    this.secQForm=document.querySelector('form#wtkResetPswdForm')
    this.secQForm.addEventListener('submit', this._resetPswd.bind(this))

    this.newPswdForm=document.querySelector('form#wtkNewPswdForm')
    this.newPswdForm.addEventListener('submit', this._newPswdSubmit.bind(this))

    const params = (new URL(document.location)).searchParams;
    this.hash = params.get("hash");
    console.log(this.hash)

    this._resetPswdInit()

  }
  async _resetPswdInit(){
    this.metaData = await wtkClass.getGeneralMetadata()
    this._buildSecQ()
  }
  _buildSecQ(evt){
    let formSelects = this.secQForm.querySelectorAll('select')
        formSelects.forEach((val, key) => {
          this.metaData.metaData.user.secQ.forEach((valOpt, key) => {
            let option=document.createElement('option')
                option.value=valOpt.val
                option.innerText=valOpt.text
            val.appendChild(option)
          })
        })
    // this._alocUserInfo()
  }
  async _resetPswd(evt){
    evt.preventDefault()
    const target=evt.target
    const body={}
    let validForm=true
    let validateClass = new validateInput()
    for (const val of target.elements) {
      if (val.type!='submit' && val.type!='file') {
        validForm=validateClass._validateInput(val);
        body[val.name]=val.value;
      }
    }
    if (!validForm) { return wtkClass.toast("invalid form") }
    
    body.hash = this.hash

    const resPswdHeaders= new Headers()
          resPswdHeaders.append('Content-Type', 'application/json');

    const path = `${wtkClass.apiOpen}/wtk-resetPswd`
    const response = await fetch(path ,{
      method: "POST",
      body: JSON.stringify(body), 
      headers: resPswdHeaders
    }).catch(_ => {})
    if (!response.ok) return wtkClass.toast(response.statusText)
    
    wtkClass.toast('Heslo resetováno!')
    setTimeout(_ => { this._newPswdInit() }, 2000);
  }
  _newPswdInit(){
    this.secQForm.style.display="none";
    this.newPswdForm.style.display="block";
  }
  async _newPswdSubmit(evt){
    evt.preventDefault()
    const target=evt.target
    const body={}
    let validForm=true
    let validateClass = new validateInput()
    for (const val of target.elements) {
      if (val.type!='submit' && val.type!='file') {
        validForm=validateClass._validateInput(val);
        body[val.name]=val.value;
      }
    }
    if (!validForm) { return wtkClass.toast("invalid form") }
    
    delete body.wtkLoginPswdNewAgain

    body.wtkLoginPswdNew = 
      CryptoJS.SHA256(body.wtkLoginPswdNew).toString(CryptoJS.enc.Hex);
    body.wtkLoginPswdOld = 
      CryptoJS.SHA256(body.wtkLoginPswdOld).toString(CryptoJS.enc.Hex);
      
    body.hash = this.hash

    const newPswdHeaders= new Headers()
          newPswdHeaders.append('Content-Type', 'application/json');

    const path = `${wtkClass.apiOpen}/wtk-newPswd`
    const response = await fetch(path,{
      method:"POST",
      body:JSON.stringify(body), 
      headers:newPswdHeaders
    }).catch(_ => {})
    if (!response.ok) return wtkClass.toast(response.statusText)
    wtkClass.toast('Heslo úspěšně změněno!')
    setTimeout(_ => { window.location='/' }, 2000);
  }
}

window.addEventListener('load', ()=>{
  new wtkResetPswd()
})