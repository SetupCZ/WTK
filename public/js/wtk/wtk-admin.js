'use strict';
window.URL = window.URL || window.webkitURL;
if (window.Element && !Element.prototype.closest) {
    Element.prototype.closest = 
    function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i,
            el = this;
        do {
            i = matches.length;
            while (--i >= 0 && matches.item(i) !== el) {};
        } while ((i < 0) && (el = el.parentElement)); 
        return el;
    };
}
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
class wtkAdmin {
  constructor(args) {
    this.userInfoForm=document.querySelector('form#userInfoForm')
    this.userInfoForm.addEventListener('submit', this._saveUserInfo.bind(this))

    this.changePswdBtn=document.querySelector('#changePswd')
    this.changePswdBtn.addEventListener('click', this._showPswdForm.bind(this))

    this.userPswdFormWrapper=document.querySelector('#userPswdFormWrapper')
    this.userPswdForm=document.querySelector('form#userPswdForm')
    this.userPswdForm.addEventListener('submit', this._saveUserPswd.bind(this))

    this.userPswdCloseBtn=document.querySelector('#userPswdCloseBtn')
    this.userPswdCloseBtn.addEventListener('click', this._closeUserPswd.bind(this))

    this.secQForm=document.querySelector('form#secQForm')
    this.secQForm.addEventListener('submit', this._saveUserInfo.bind(this))

    this.metaData={}
    this.wtkClass=new wtk()
    this.user=JSON.parse(this.wtkClass.getCookie('userForWeb'))
    console.log(this.user)


    this._initAdmin()
  }
  _initAdmin(evt){
    this.wtkClass.getGeneralMetadata()
    .then((data) => {
      this.metaData=data
      this._buildSecQ()
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    });


  }
  _closeUserPswd(evt){
    console.log(evt)
    evt.preventDefault()
    console.log('this')
    this.userPswdFormWrapper.style.display="none"
  }
  _showPswdForm(evt){
    evt.preventDefault()
    this.userPswdFormWrapper.style.display="block"
  }
  _saveUserInfo(evt){
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

     // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    fetch(`${this.wtkClass.api}/user`,{method:"PUT",body:JSON.stringify(body), headers:myHeaders})
    .then((data) =>{
      return data.json()
    })
    .then((data) =>{
      console.log(data)
      // document.cookie='token='+data.token+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';
      // document.cookie='userForWeb='+JSON.stringify(data.userForWeb)+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';


      this.wtkClass.toast('Uživatel úspěšně upraven!')
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })

  } 
  _saveUserPswd(evt){
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
    body.wtkLoginPswdNewAgain=CryptoJS.SHA256(body.wtkLoginPswdNewAgain).toString(CryptoJS.enc.Hex);
    body.wtkLoginPswdOld=CryptoJS.SHA256(body.wtkLoginPswdOld).toString(CryptoJS.enc.Hex);

     // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    fetch(`${this.wtkClass.api}/user`,{method:"PUT",body:JSON.stringify(body), headers:myHeaders})
    .then((data) =>{
      return data.json()
    })
    .then((data) =>{
      console.log(data)
      // document.cookie='token='+data.token+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';
      // document.cookie='userForWeb='+JSON.stringify(data.userForWeb)+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';


      this.wtkClass.toast('Uživatel úspěšně upraven!')
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  _saveSecQ(evt){
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
      
     // jwt
    let token = this.wtkClass.getCookie("token");
    let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
    let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('X-XSRF-TOKEN', `${csrfCookie}`);

    fetch(`${this.wtkClass.api}/user`,{method:"PUT",body:JSON.stringify(body), headers:myHeaders})
    .then((data) =>{
      return data.json()
    })
    .then((data) =>{
      console.log(data)
      document.cookie='token='+data.token+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';
      document.cookie='userForWeb='+JSON.stringify(data.userForWeb)+'; expires=Thu, 18 Dec 2018 12:00:00 UTC; path=/';


      this.wtkClass.toast('Uživatel úspěšně upraven!')
    })
    .catch((err) => {
      this.wtkClass.toast(err)
    })
  }
  
  _alocUserInfo(){
    this.userInfoForm.elements['wtkLoginName'].value=this.user.email

    this.secQForm.elements['wtkSecQ1'].querySelector(`option[value="${this.user.secQ1}"]`).selected=true
    this.secQForm.elements['wtkSecQ2'].querySelector(`option[value="${this.user.secQ2}"]`).selected=true
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
    this._alocUserInfo()
  }

}
const constantMock = window.fetch;
// window.fetch = function(path, data) {
//     // Get the parameter in arguments
//     // Intercept the parameter here 

//     let wtkClass=new wtk()
//     let headers=new Headers()
//     // console.log(wtkClass)
//     // let csrfCookie = this.wtkClass.getCookie("XSRF-COOKIE");
//     let token = wtkClass.getCookie("token");
//     // console.log(token)
//     console.log(data)
//     if (data && token) {
//       if (data.headers) {
//         data.headers.append("Authorization", 'Bearer ' +token)
//       }
//       else{
//         headers.append("Authorization", 'Bearer ' +token)
//         data.headers=headers
//       }
//       // headers['X-XSRF-TOKEN'] = csrfCookie;
//     }
//     // console.log(data,arguments[1])
//     // console.log(data.body.get('wtkLoginName'))
//     // console.log(path,arguments[0])
//    return constantMock(arguments[0],arguments[1])
// }
window.addEventListener('load', ()=>{
  new wtkAdmin()
})

/*
  return {
    request: function (config) {
      config.headers = config.headers || {};
      var token = getCookie("token");
      var csrfCookie = getCookie("XSRF-COOKIE");
      if (token) {
        config.headers.Authorization = 'Bearer ' +token;
        config.headers['X-XSRF-TOKEN'] = csrfCookie;
      }else{
        window.location.href='/login';
      }
      return config;
    },
    responseError: function (response) {
      if (response.status === 401 || response.status === 403) {
        window.location.href='/login';
      }
      return $q.reject(response);
    }
  };
  */