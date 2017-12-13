class validateInput{
  _validateInput(target){
    let required=target.getAttribute('required');
    let pattern=target.getAttribute('pattern');
    let patternReg=new RegExp(pattern);
    let requiredMsg=target.parentNode.querySelector('.errMsg.required');
    let patternMsg=target.parentNode.querySelector('.errMsg.pattern');
    //check required
    console.log(target)
    //if "" pattern must be opacity:0 too
    if (target.value=="") { 
      requiredMsg.style.opacity=1; 
      patternMsg.style.opacity=0; 
      target.style.borderColor='red';
      return false; 
    }
    else{ 
      requiredMsg.style.opacity=0; 
      target.style.borderColor='rgba(0,0,0,0.1)';
    }
    if (pattern!=null && !patternReg.test(target.value)) { 
      patternMsg.style.opacity=1; 
      return false;
    }
    else{ 
      patternMsg.style.opacity=0; 
      target.style.borderColor='rgba(0,0,0,0.1)';
      return true;
    }
  }
  _onKeyDown(evt){
    const target = evt.target;
    //if TAB validate input
    if (evt.keyCode==9) { this._validateInput(target); }
    else{ clearTimeout(this.validTimeout); }
  }
  _onKeyUp(evt){
    const target = evt.target;
    clearTimeout(this.validTimeout);
    this.validTimeout=setTimeout(()=>{
      this._validateInput(target);
    }, 500);
  }
}
class wtkLogin {
  constructor(args) {
    this.loginForm=document.querySelector('#wtkLoginForm')
    this.loginForm.addEventListener('submit', this._submitLoginForm.bind(this))

    this.wtkPswdReset=this.loginForm.querySelector('#wtkPswdReset')
    this.wtkPswdReset.addEventListener('click', this._resetPswd.bind(this))

    this.wtkForgotPswdForm=document.querySelector('#wtkForgotPswdForm')
    this.wtkForgotPswdForm.addEventListener('submit', this._submitForgotPswd.bind(this))

    this.globalMsg=document.querySelector('#globalMsg')

    let validateClass = new validateInput()
    for (let i = 0; i < this.loginForm.elements.length; i++) {
      this.loginForm[i].addEventListener('keyup', validateClass._onKeyUp.bind(validateClass))
      this.loginForm[i].addEventListener('keydown', validateClass._onKeyDown.bind(validateClass))
    }
  }
  _submitLoginForm(evt){
    evt.preventDefault()
    let target=evt.target
    let validateClass=new validateInput()
    let validForm=true;
    let body={};
    // let body=new FormData(evt.target)
    for (let i = 0; i < this.loginForm.elements.length; i++) {
      if (target.elements[i].type!='submit') {
        // validForm=validateClass._validateInput(target.elements[i]);
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    if (!validForm) { return alert("Některá pole jsou špatně vyplněna!") }

    let pswdCrypted=CryptoJS.SHA256(body.wtkLoginPswd).toString(CryptoJS.enc.Hex);
    console.log(pswdCrypted)
    // body.set('wtkLoginPswd',pswdCrypted)
    // console.log(body.get('wtkLoginPswd'))
    body.wtkLoginPswd=pswdCrypted
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        // myHeaders.append('Content-Type', 'form-data; ');
        console.log(JSON.stringify(body))
    fetch(`/wtk/wtk-login`,{method:'POST', body: JSON.stringify(body), headers:myHeaders, credentials: 'same-origin'})
    .then((data) => {
      // console.log(data.json())
      if (!data.ok) { throw Error(data.statusText); }
      else{ return data.json() }
    })
    .then((res) => {
      console.log(res)
      // document.cookie='XSRF-COOKIE='+this.loginCSRF.value;
      document.cookie='token='+res.token+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';
      document.cookie='userForWeb='+JSON.stringify(res.userForWeb)+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';


      setTimeout(function() { window.location='/' }, 2000);
      
    })
    .catch((err) => {
      console.log(err)
      alert('Ups! Něco je špatně. Zkuste se přihlásit znovu.')
    })
  }
  _wrongUser(){
    // alert('Ups! Něco je špatně. Zkuste se přihlásit znovu.')
  }
  _resetPswd(){
    this.loginForm.style.display="none"
    this.wtkForgotPswdForm.style.display="block"
  }
  _submitForgotPswd(evt){
    evt.preventDefault()
    let target=evt.target
    let validateClass=new validateInput()
    let validForm=true;
    let body={};
    // let body=new FormData(evt.target)
    for (let i = 0; i < target.elements.length; i++) {
      if (target.elements[i].type!='submit') {
        // validForm=validateClass._validateInput(target.elements[i]);
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    if (!validForm) { return alert("Některá pole jsou špatně vyplněna!") }

    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        // myHeaders.append('Content-Type', 'form-data; ');
    fetch(`/wtk/wtk-forgotPswd`,{method:'POST', body: JSON.stringify(body), headers:myHeaders})
    .then((data) => {
      return data.text() 
    })
    .then((res) => {
      console.log(res)
      // document.cookie='XSRF-COOKIE='+this.loginCSRF.value;
      // document.cookie='token='+res.token+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';
      // document.cookie='userForWeb='+JSON.stringify(res.userForWeb)+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';

      // window.location='/'
      this.globalMsg.innerText="Byl vám zaslán ověřovací E-mail."
    })
    .catch((err) => {
      alert('Ups! Něco je špatně. Zkuste to znovu.')
      console.log(err)
    })
  }
  // methods
}

window.addEventListener('load', ()=>{
  new wtkLogin()
})