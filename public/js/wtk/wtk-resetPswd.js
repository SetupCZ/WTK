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
class wtk{
  constructor(args) {
    this.base = "/js/wtk"
    this.contents=[]
    this.api="/wtk/auth"
    this.apiOpen="/wtk"
  }
  toast(msg, mainErr){
    // let mainErr=errMsg.querySelector('.mad-main-errMsg')
    //     mainErr.innerText=msg
    //     mainErr.classList.add(err?'colE':'colC')
    let toastElm=document.createElement('div')
        toastElm.innerText=msg
          toastElm.style.position='fixed'
          toastElm.style.zIndex = 9999
          toastElm.style.top = '8px'
          toastElm.style.right = '8px'
          toastElm.style.backgroundColor = '#212121'
          toastElm.style.color = '#fff'
          toastElm.style.borderRadius = '3px'
          toastElm.style.padding = '4px 16px'
        document.body.appendChild(toastElm)
    setTimeout(function() {
      toastElm.parentNode.removeChild(toastElm)
      // mainErr.classList.remove('colE')
      // mainErr.classList.remove('colC')
      // mainErr.innerText=""
    }, 5000);
  }
  getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return false;
  }
  getGeneralMetadata(){
    return new Promise((resolve, reject) => {
      fetch(`${this.base}/wtkSettings.json`)
      .then((data) => {
        return data.json()
      })
      .then((settings) => {
        console.log(settings)
        return resolve(settings)
      })
      .catch((err) => {
        return reject(err)
      })
    });
  }
}

class wtkResetPswd {
  constructor(args) {
    this.wtkClass=new wtk()
    this.metaData={}
    this.user=JSON.parse(this.wtkClass.getCookie('userForWeb'))

    this.secQForm=document.querySelector('form#wtkResetPswdForm')
    this.secQForm.addEventListener('submit', this._resetPswd.bind(this))

    this.newPswdForm=document.querySelector('form#wtkNewPswdForm')
    this.newPswdForm.addEventListener('submit', this._newPswdSubmit.bind(this))

    let params = (new URL(document.location)).searchParams;
    this.hash = params.get("hash");
    console.log(this.hash)

    this._resetPswdInit()

  }
  _resetPswdInit(){
    this.wtkClass.getGeneralMetadata()
    .then((data) => {
      this.metaData=data
      this._buildSecQ()
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    });
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
  _resetPswd(evt){
    evt.preventDefault()
    let target=evt.target
    let validForm=true
    let body={}
    let validateClass = new validateInput()
    for (let i = 0; i < target.elements.length; i++) {
      if (target.elements[i].type!='submit' && target.elements[i].type!='file') {
        validForm=validateClass._validateInput(target.elements[i]);
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }
    body.hash=this.hash
    let myHeaders= new Headers()
        myHeaders.append('Content-Type', 'application/json');

    fetch(`${this.wtkClass.apiOpen}/wtk-resetPswd`,{method:"POST",body:JSON.stringify(body), headers:myHeaders})
    .then((data) =>{
      if (!data.ok) { throw Error(data.statusText); }
      return data.text()
    })
    .then((data) =>{
      console.log(data)
      // document.cookie='token='+data.token+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';
      // document.cookie='userForWeb='+JSON.stringify(data.userForWeb)+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';

      this.wtkClass.toast('Heslo resetováno!')
      setTimeout(function() { this._newPswdInit() }, 2000);
      

    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _newPswdInit(){
    this.secQForm.style.display="none";
    this.newPswdForm.style.display="block";
  }
  _newPswdSubmit(evt){
    evt.preventDefault()
    let target=evt.target
    let validForm=true
    let body={}
    let validateClass = new validateInput()
    for (let i = 0; i < target.elements.length; i++) {
      if (target.elements[i].type!='submit' && target.elements[i].type!='file') {
        validForm=validateClass._validateInput(target.elements[i]);
        body[target.elements[i].name]=target.elements[i].value;
      }
    }
    if (!validForm) { return this.wtkClass.toast("invalid form") }
    body.wtkLoginPswdNew=CryptoJS.SHA256(body.wtkLoginPswdNew).toString(CryptoJS.enc.Hex);
    body.wtkLoginPswdOld=CryptoJS.SHA256(body.wtkLoginPswdOld).toString(CryptoJS.enc.Hex);
    body.hash=this.hash

    let myHeaders= new Headers()
        myHeaders.append('Content-Type', 'application/json');

    fetch(`${this.wtkClass.apiOpen}/wtk-newPswd`,{method:"POST",body:JSON.stringify(body), headers:myHeaders})
    .then((data) =>{
      return data.text()
    })
    .then((data) =>{
      console.log(data)
      // document.cookie='token='+data.token+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';
      // document.cookie='userForWeb='+JSON.stringify(data.userForWeb)+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';

      this.wtkClass.toast('Heslo úspěšně změněno!')
      setTimeout(function() { window.location='/wtk/wtk-login' }, 2000);


    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })

  }
}

window.addEventListener('load', ()=>{
  new wtkResetPswd()
})