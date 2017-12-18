'use strict';

const fs = require('fs');
const path = require('path');
const xss = require('xss');
const sanitizeHtml = require('sanitize-html');
let alocDataGlobal={}
const cjBase='';
const settings = require('./serverSettings.json');

const nodemailer = require("nodemailer");
const https = require("https");
const smtpTransport = require('nodemailer-smtp-transport');

const filterEverything = {
  whitelist:[],
  stripIgnoreTag:true,
  stripIgnoreTagBody:['script']
}
const mailGlobalReg = new RegExp(/^([\w\.\-_]+)?\w+@[\w-_]+(\.\w+){1,}$/)
const pswdGlobalReg = new RegExp(/^([a-zA-z0-9]){64}$/)
const nameGlobalReg = new RegExp(/^([0-9A-Za-z_-])+(\/contents\/)*([0-9A-Za-z_-])+$/)
const textGlobalReg = new RegExp(/^[a-zA-ZěščřžýáíéúůďťňóĚŠČŘŽÝÁÍÉÚŮĎŤŇÚÓ \-\_\!\?\:\/\\\'\(\)\[\]\{\}\,\.]+$/)
const regExpGlobalReg = new RegExp(/^[a-zA-ZěščřžýáíéúůďťňóĚŠČŘŽÝÁÍÉÚŮĎŤŇÚÓ \-\_\!\?\:\/\\\']*$/)
const urlGlobalReg = new RegExp(/^(.*)$/)
const pathGlobalReg = new RegExp(/^((?!\.\.\/).)*(\.jpg|png|json|html)$/i)

function returnAlocDataByName(alocData, name, resolve) {
  return alocData[name] // alocdata={}
  // return alocData.alocData.find((val, key) => {
  //   // console.log(val.wtkName, name)
  //   // console.log(val.wtkName==name)
  //   return val.wtkName==name
  // })
}
module.exports={
  sendMail:function(body){
    return new Promise((resolve, reject) => {
      let regName = new RegExp("^([ěščřžýáíéóúůďťňĎŇŤŠČŘŽÝÁÍÉÚŮa-zA-Z ])+$");
      let regMail = new RegExp("^([A-Z|a-z|0-9](\\.|_){0,1})+[A-Z|a-z|0-9]\\@([A-Z|a-z|0-9])+((\\.){0,1}[A-Z|a-z|0-9]){2}\\.[a-z]{2,3}$");
      if(!regName.test(body.name)){ return res.status(400).send("Špatně zadané jméno!"); };
      if(!regMail.test(body.email)){ return res.status(400).send("Špatně zadaný E-mail!"); };

      let transporter = nodemailer.createTransport(smtpTransport({
        host: 'localhost',
        port: 25,
        tls: {
          rejectUnauthorized: false
        }
      }));

      let mailOptions = {
        from:"jarkovsky.d@gmail.com", // sender address
        to: body.email, // list of receivers
        subject: 'WTK reset heslo', // Subject line
        text: body.msg  // plaintext body
      };

      // cos localhost
      return resolve(body.msg)
      
      transporter.sendMail(mailOptions, function(error, info){
        if(error){console.log(error); return reject("E-mail se nepodařilo odeslat.") }
        return resolve('E-mail se úspěšně odeslal!');
      });
    });
  },
  getResetPswd:function (){
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'resetPswd.json')
      fs.readFile(filePath, {encoding: 'utf8'}, function(err, data) {
        if (err) { console.log(err); return reject(err); }
        else { console.log(data); return resolve(JSON.parse(data)) };
      });
    });
  },
  saveResetPswd:function (reserPswd) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'resetPswd.json');
      fs.writeFile(filePath, reserPswd, function(err, data) {
        if (err) { console.log(err); return reject(err) }
        else{ return resolve(data) };
      });
    });
  },

  getUserSettings:function (){
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'userSettings.json')
      fs.readFile(filePath, {encoding: 'utf8'}, function(err, data) {
        if (err) { return reject(err); }
        else { return resolve(JSON.parse(data)) };
      });
    });
  },
  saveUserSettings:function (userSett) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'userSettings.json');
      fs.writeFile(filePath, userSett, function(err, data) {
        if (err) { console.log(err); return reject(err) }
        else{ return resolve(data) };
      });
    });
  },

  getAlocData:function() {
    return new Promise((resolve, reject) => {
      if (Object.keys(alocDataGlobal).length!=0) 
        return resolve(alocDataGlobal) 
      
      // read alocData.json if we dont have it saved
      var filePath=path.resolve(__dirname, './alocData.json')
      fs.readFile(filePath, {encoding: 'utf8'}, function(err, data) {
        if (err) { return reject(err); }
        else { 
          alocDataGlobal = JSON.parse(data); 
          return resolve(alocDataGlobal) };
      });
    })
  },
  getAlocDataByName:function(wtkName, newCont) {
    return new Promise((resolve, reject) => {
      // alocDataGlobal is set
      if (Object.keys(alocDataGlobal).length != 0) { 
        let alocDataByName = 
          returnAlocDataByName(alocDataGlobal, wtkName);
        if (!alocDataByName) {
          if (newCont) { return resolve(null) }
          return reject(204) 
        }
        return resolve(alocDataByName)
      }

      // alocDataGlobal is NOT set
      var filePath=path.resolve(__dirname, './alocData.json')
      fs.readFile(filePath, {encoding: 'utf8'}, function(err, data) {
        if (err) { return reject(err); }
        else{ 
          alocDataGlobal = JSON.parse(data);
          let alocDataByName = 
            returnAlocDataByName(alocDataGlobal, wtkName)
          if (!alocDataByName) { 
            if (newCont) { return resolve(null) }
            return reject(204)
          }
          return resolve(alocDataByName)
        };
      });
    });
  },
  // TODO: getGroups getContents will use on admin page
  getGroups:function () {
    let sendGroups=[];
    alocDataGlobal.forEach((val, key) => {
      if (val.wtkGroup) { sendGroups.push(val); }
    }) 
    return sendGroups
  },
  getContents: function (name) {
    console.log('get ocntents name',name)
    let sendContent=[];
    alocDataGlobal.alocData.forEach((val, key) => {
      let push=true
      if (name!="") {
        let groupName=val.wtkName.split('/')
        console.log(groupName)
        console.log(groupName[0]!=name)
        if (groupName[0]!=name) { push=false }
      }
      if (!val.wtkVisible) { push=false }
      if (push) { sendContent.push(val); }
    }) 
    return sendContent
  },
  getItemsDataByDir:function(dir) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'yourContent', dir, 'wtkItemsData.json');
      var data = fs.readFile(filePath, {encoding: 'utf8'}, function (err, data) {
        if (err) { reject(err); }
        else { resolve(JSON.parse(data)) }
      });
    });
  },
  getMetaDataByDir:function(dir) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'yourContent', dir, 'wtkMetaData.json');
      var data = fs.readFile(filePath, {encoding: 'utf8'}, function (err, data) {
        if (err) { reject(err); }
        else { resolve(JSON.parse(data)) }
      });
    });
  },
  // TODO: delete this i gues
  getMetaDataByID:function(wtkPath, metaData){
    return metaData.collection.items.find((item) => {
      return item.href==wtkPath
    })
  },
  getTextItemByID(wtkDir, wtkID){
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'yourContent', wtkDir, wtkID+'.html');
      var data = fs.readFile(filePath, {encoding: 'utf8'}, function (err, data) {
        if (err) { reject(err); }
        else { resolve(data) }
      });
    });
  },
  getImgItemByName(wtkCont){
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, settings.galeryPath, wtkCont);
      var data = fs.readFile(filePath, function (err, data) {
        if (err) { reject(err); }
        else { resolve(data) }
      });
    });
  },
  getVisibleItems(metaData){
    const items = metaData._embedded.items
    return Object.keys(items).map(key => { 
      if (items[key].wtkVisible) return items[key]
    })
  },
  // TODO: sort object
  sortItemsData(metaData){
    return metaData._embedded.items.sort((itemA, itemB) => {
      return itemA.wtkPosition - itemB.wtkPosition
    })
  },
  addTextItem:function(data, wtkDir) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'yourContent', wtkDir, data.wtkID+'.html');
      fs.writeFile(filePath, data.wtkCont, function(err, data) {
        if (err) { return reject(err) }
        else{ return resolve(null) };
      });
    });
  },
  addNewDir:function(wtkDir) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, './yourContent/', wtkDir);
      fs.mkdir(filePath, function(err, data) {
        if (err) { reject(err) }
        else{ resolve(null) };
      });
    });
  },
  addMetaData:function(cj, wtkDir) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'yourContent', wtkDir, 'wtkMetaData.json');
      fs.writeFile(filePath, JSON.stringify(cj), function(err, data) {
        if (err) { return reject(err) }
        else{ return resolve(cj) };
      });
    });
  },
  addItemsData:function(cj, wtkDir) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, 'yourContent', wtkDir, 'wtkItemsData.json');
      fs.writeFile(filePath, JSON.stringify(cj), function(err, data) {
        if (err) { return reject(err) }
        else{ return resolve(cj) };
      });
    });
  },
  editAlocData:function(alocData) {
    return new Promise((resolve, reject) => {
      var filePath=path.resolve(__dirname, './alocData.json')
      fs.writeFile(filePath, JSON.stringify(alocData), function(err, data) {
        if (err) { reject(err) }
        else{ resolve(null) };
      });
    });
  },
  // nameGlobalReg
  // textGlobalReg
  // regExpGlobalReg
  validateUser:function(data, user){
    return new Promise((resolve, reject) => {
      /*
      DataSet
      ----------------------
      { wtkLoginName: 'jarkovsky.d@poskytuj.cz' }

      { wtkSecQ1: 'Jaká je vaše oblíbená barva?',
        wtkSecA1: 'sd',
        wtkSecQ2: 'Jak se jmenoval váš první mazlíček?',
        wtkSecA2: 'asdasd' }
      { wtkLoginPswdOld: '2a17ade560795127c956a2ca3e6599c5cdf7332aa067cc0c7e5d1ab219c2b9d0',
        wtkLoginPswdNew: '2a17ade560795127c956a2ca3e6599c5cdf7332aa067cc0c7e5d1ab219c2b9d0',
        wtkLoginPswdNewAgain: 'Dada_144_1993' }
      */

      
      const dataReg={
        wtkLoginName:{
          reg:mailGlobalReg,
          msg:"USER NAME is wrong!"
        },
        wtkSecQ1:{
          reg:textGlobalReg,
          msg:"USER SEC. QUESTION 1 is wrong!"
        },
        wtkSecA1:{
          reg:textGlobalReg,
          msg:"USER SEC. ANSWER 1 is wrong!"
        },
        wtkSecQ2:{
          reg:textGlobalReg,
          msg:"USER SEC. QUESTION 2 is wrong!"
        },
        wtkSecA2:{
          reg:textGlobalReg,
          msg:"USER SEC. ANSWER 2 is wrong!"
        },
        wtkLoginPswdOld:{
          reg:pswdGlobalReg,
          msg:"USER OLD PASSWORD is wrong!"
        },
        wtkLoginPswdNew:{
          reg:pswdGlobalReg,
          msg:"USER NEW PASSWORD is wrong!"
        },
        wtkLoginPswdNewAgain:{
          reg:pswdGlobalReg,
          msg:"USER NEW AGAIN PASSWORD is wrong!"
        },
      }
      // console.log(data)

      for (let key in data){
        data[key]=xss(data[key], filterEverything)
        if (!dataReg[key].reg.test(data[key])) { return reject(dataReg[key].msg) }
      }
      // console.log(user)
      return resolve(data)
    });
  },
  validateLogin:function(user){
    return new Promise((resolve, reject) => {
      /*
      DataSet
      ----------------------
      { 
        wtkLoginName: 'jarkovsky.d@poskytuj.cz',
        wtkLoginPswd: '2a17ade560795127c956a2ca3e6599c5cdf7332aa067cc0c7e5d1ab219c2b9d0',
        '': 'ZAPOMĚL JSEM HESLO' 
      }
      */
      const wtkLoginNameReg = mailGlobalReg
      const wtkLoginPswdReg = pswdGlobalReg
      console.log(user.wtkLoginPswd.length)
      user.wtkLoginName = xss(user.wtkLoginName, filterEverything)
      user.wtkLoginPswd = xss(user.wtkLoginPswd, filterEverything)

      if ( !wtkLoginNameReg.test(user.wtkLoginName) ) return reject("LOGIN NAME is wrong!")
      if ( !wtkLoginPswdReg.test(user.wtkLoginPswd) ) return reject("LOGIN PASSWORD is wrong!")

      console.log('vlaidateUser')
      console.log(user)
      return resolve(user)
    });
  },
  validateI:function(data, img){
    return new Promise((resolve, reject) => {
      /*
      DataSet
      ----------------------
      text------------------
      [ 
        { name: 'wtkCont', value: '<p>olaxcv</p>' },
        { name: 'wtkType', value: 'text' } 
      ]
      img------------------
      img:{ 
        fieldname: 'img',
        originalname: '9.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: 'D:\\node\\workFor\\net-kovo\\app\\public\\img\\wtkGalery',
        filename: '9.jpg',
        path: 'D:\\node\\workFor\\net-kovo\\app\\public\\img\\wtkGalery\\9.jpg',
        size: 8643007 
      }
      data:[ 
        { name: 'wtkType', value: 'img' },
        { name: 'wtkWidth', value: '' },
        { name: 'wtkHeight', value: '' },
        { name: 'wtkPosition', value: 2 },
        { name: 'wtkCont', value: '9.jpg' } 
      ]


      */
      console.log('img ->',img)
      console.log('data ->',data)
      // img
      const imgNameReg = new RegExp(/^([a-zA-Z0-9])+(\.(jpg|png|JPG|PNG))$/)
      const imgPathReg = pathGlobalReg

      // data
      const dataReg={
        wtkType:{
          reg:new RegExp(/^(text|img)$/),
          msg:"WTK TYPE is wrong!"
        },
        wtkPosition:{
          reg:new RegExp(/^([0-9])+$/),
          msg:"WTK POSITION is wrong!"
        },
        wtkWidth:{
          reg:new RegExp(/^(([0-9])+( )?(px|%|vw|vh)|(auto|none|initial|inherit))$/),
          msg:"WTK WIDTH is wrong!"
        },
        wtkHeight:{
          reg:new RegExp(/^(([0-9])+( )?(px|%|vw|vh)|(auto|none|initial|inherit))$/),
          msg:"WTK HEIGHT is wrong!"
        },
        wtkCont:{
          reg:imgNameReg,
          msg:"WTK HEIGHT is wrong!"
        },
      }

      return resolve(data)
      // TODO: edit for object 
      let type=data.find((data) => {
        return data.name=="wtkType"
      }).value

      for (let val of data) {
        console.log('***********')
          console.log(val)
        if (val.name=="wtkCont") { val.value=xss(val.value) }
        else{ val.value = xss(val.value, filterEverything) }

        if (val.name=="wtkCont" && type=="text") { continue }

        if (!dataReg[val.name].reg.test(val.value)) { return reject(dataReg[val.name].msg) }
      }
      console.log('all good')


      // test img
      if (img) {
        img.originalname = xss(img.originalname, filterEverything)
        img.path = xss(img.path, filterEverything)

        if ( !imgNameReg.test(img.originalname) ) return reject("IMG NAME is wrong!")
        if ( !imgPathReg.test(img.path) ) return reject("IMG PATH is wrong!")
        if ( img.size > settings.uploadMaxSize ) return reject("IMG SIZE is too big!")
      }

      return resolve(data)
    });
  },
  validateC: function(data, img){
    return new Promise((resolve, reject) => {
      /*
      DataSet
      ----------------------
      { 
        wtkMetaName: 'novinky/contents/1511351558120',
        wtkMetaTitle: 'Lorem ipsum dolor',
        wtkMetaAuthor: 'Dan Jarkovský',
        wtkMetaDescription: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Fusce tellus. Integer malesuada. Fusce wisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
        wtkMetaUrl: 'http://localhost:4011/cz/novinky',
        wtkMetaOgLocale: 'cs_CZ',
        wtkMetaOgSitename: 'NET-KOVO s.r.o.',
        wtkMetaTwitterSite: ''. 
        groupAttrs:[ 
          { 
            wtkMetaName: 'link',
            wtkMetaValue: 'loremIpsumDolor',
            wtkMetaAttr: 'text',
            wtkMetaAttrName: '' 
          } 
        ],
        link: 'loremIpsumDolor',
      }
      */

      //////////////////////////////
      //////////////////////////////
      //////////////////////////////
      //////////////////////////////
      // console.log(data)
      // console.log(img)
      const wtkNameReg = nameGlobalReg
      const wtkMetaTitleReg = textGlobalReg
      const wtkMetaAuthorReg = textGlobalReg
      const wtkMetaDescriptionReg = textGlobalReg
      const wtkMetaUrlReg = urlGlobalReg
      const wtkMetaOgLocaleReg = new RegExp(/^([a-z]){2}(\_)([A-Z]){2}$/)
      const wtkMetaOgSitenameReg = textGlobalReg
      const wtkMetaTwitterSiteReg = urlGlobalReg

      const wtkAttrNameReg = nameGlobalReg
      const wtkAttrTypeReg = new RegExp(/^(text|password|email|tel|checkbox|select|date)$/)

      // img regex
      const imgNameReg = new RegExp(/^([a-zA-Z0-9])+(\.(jpg|png|JPG|PNG))$/)
      const imgPathReg = pathGlobalReg
      const wtkMetaThumbnailReg = pathGlobalReg

      data.wtkMetaName = xss(data.wtkMetaName, filterEverything)
      data.wtkMetaTitle = xss(data.wtkMetaTitle, filterEverything)
      data.wtkMetaAuthor = xss(data.wtkMetaAuthor, filterEverything)
      data.wtkMetaDescription = xss(data.wtkMetaDescription, filterEverything)
      data.wtkMetaUrl = xss(data.wtkMetaUrl, filterEverything)
      data.wtkMetaOgLocale = xss(data.wtkMetaOgLocale, filterEverything)
      data.wtkMetaOgSitename = xss(data.wtkMetaOgSitename, filterEverything)
      data.wtkMetaTwitterSite = xss(data.wtkMetaTwitterSite, filterEverything)
      data.wtkMetaThumbnail = xss(data.wtkMetaThumbnail, filterEverything)

      if ( !wtkNameReg.test(data.wtkMetaName) ) return reject("WTK NAME is wrong!")
      if ( !wtkMetaTitleReg.test(data.wtkMetaTitle) ) return reject("Content TITLE is wrong!")
      if ( !wtkMetaAuthorReg.test(data.wtkMetaAuthor) ) return reject("Content AUTHOR is wrong!")
      if ( !wtkMetaDescriptionReg.test(data.wtkMetaDescription) ) return reject("Content DESCRIPTION is wrong!")
      if ( !wtkMetaUrlReg.test(data.wtkMetaUrl) ) return reject("Content URL is wrong!")
      if ( data.wtkMetaOgLocale!="" && !wtkMetaOgLocaleReg.test(data.wtkMetaOgLocale) ) return reject("Content og:LOCALE is wrong!")
      if ( data.wtkMetaOgSitename != "" && !wtkMetaOgSitenameReg.test(data.wtkMetaOgSitename) ) return reject("Content og:SITE NAME is wrong!")
      if ( data.wtkMetaTwitterSite != "" && !wtkMetaTwitterSiteReg.test(data.wtkMetaTwitterSite) ) return reject("Content twitter:SITE is wrong!")
      if ( data.wtkMetaThumbnail != "" && !wtkMetaThumbnailReg.test(data.wtkMetaThumbnail)) return reject("Content twitter:SITE is wrong!")

      // test img
      if (img){
        img.originalname = xss(img.originalname, filterEverything)
        img.path = xss(img.path, filterEverything)
        
        if ( !imgNameReg.test(img.originalname) ) return reject("IMG NAME is wrong!")
        if ( !imgPathReg.test(img.path) ) return reject("IMG PATH is wrong!")
        if ( img.size > settings.uploadMaxSize ) return reject("IMG SIZE is too big!")
      }
        
        
      
      // TODO: revisit
      let groupName=data.wtkMetaName.split('/contents/')[0] 
      if (data.groupAttrs) {
        return resolve(data)
        this.getAlocDataByName(groupName)
        .then((alocData) => {
          return this.getMetaDataByDir(alocData.wtkDir)
        })
        .then((metaData) => {
          data.groupAttrs.forEach((valAttr, keyAttr) => {
            valAttr.wtkMetaName=xss(valAttr.wtkMetaName, filterEverything)
            valAttr.wtkMetaValue=xss(valAttr.wtkMetaValue, filterEverything)
            valAttr.wtkMetaAttr=xss(valAttr.wtkMetaAttr, filterEverything)
            valAttr.wtkMetaAttrName=xss(valAttr.wtkMetaAttrName, filterEverything)

            // let attrMeta = metaData.collection.items.find((item) => {
            //   return item.href==`${valAttr.wtkMetaName}/`
            // }).data
            // let attrMetaTitle = attrMeta.find((dataItem) => {
            //   return dataItem.name=="wtkAttrLabel"
            // }).value
            // let attrMetaRegEx = attrMeta.find((dataItem) => {
            //   return dataItem.name=="wtkAttrRegex"
            // }).value
            // let attrMetaReq = attrMeta.find((dataItem) => {
            //   return dataItem.name=="wtkAttrReq"
            // }).value


            if ( !wtkAttrTypeReg.test(valAttr.wtkMetaAttr) ) return reject("Attribute TYPE is wrong!")
            if ( !wtkAttrNameReg.test(valAttr.wtkMetaName) ) return reject("Attribute NAME is wrong!")

            // valAttr.wtkMetaName=xss(valAttr.wtkMetaName, filterEverything)
              
            let attrValueReg = new RegExp(attrMetaRegEx)
            if (attrMetaReq=="required" && valAttr.wtkMetaValue=="") return reject("All required values must be filled!")
            if (attrMetaReq=="required" && valAttr.wtkMetaValue!="" && !attrValueReg.test(valAttr.wtkMetaValue)) return reject(`Attribute ${attrMetaTitle} is wrong!`)
            if (attrMetaReq=="required" && data[valAttr.wtkMetaName]!="" && !attrValueReg.test(data[valAttr.wtkMetaName])) return reject(`Attribute ${attrMetaTitle} is wrong!`)
          })
          console.log('validateC ok');
          return resolve(data)
        })
        .catch((err) => {
          console.log('err:',err)
          return reject(err)
        });
      }
      return resolve(data)


    });
  },
  validateG:function(data){
    return new Promise((resolve, reject) => {
      /*
      DataSet
      ----------------------
      { wtkName: 'T001',
        groupAttrs:
         [ { wtkAttrType: 'text',
             wtkAttrName: 'link',
             wtkAttrLabel: 'link',
             wtkAttrRegex: '',
             wtkAttrReq: 'required' } ] }

      const filterEverything={
        whiteList:[], 
        stripIgnoreTag:true, 
        stripIgnoreTagBody:['script']
      }
      */

      const wtkNameReg = nameGlobalReg //new RegExp(/^[0-9A-Za-z_-]+$/)

      const wtkAttrTypeReg = new RegExp(/^(text|password|email|tel|checkbox|select|date)$/)
      const wtkAttrNameReg = nameGlobalReg //new RegExp(/^[0-9A-Za-z_-]+$/)
      const wtkAttrLabelReg = textGlobalReg //new RegExp(/^[a-zA-ZěščřžýáíéúůďťňóĚŠČŘŽÝÁÍÉÚŮĎŤŇÚÓ \-\_\!\?\:\/\\\'\(\)\[\]\{\}]+$/)
      const wtkAttrRegExReg = regExpGlobalReg //new RegExp(/^[a-zA-ZěščřžýáíéúůďťňóĚŠČŘŽÝÁÍÉÚŮĎŤŇÚÓ \-\_\!\?\:\/\\\']*$/)
      const wtkAttrReqReg = new RegExp(/^(required)*$/)

      // test wtkName
      if ( !wtkNameReg.test(data.wtkName) ) return reject("Group NAME is wrong!")
      data.wtkName=xss(data.wtkName, filterEverything)

      // test groupAttrs
      const attrs = data.groupAttrs
      Object.keys(attrs)
      .forEach((val, key) => {
        // filter html and script
        attrs[val].wtkAttrType=xss(attrs[val].wtkAttrType, filterEverything)
        attrs[val].wtkAttrName=xss(attrs[val].wtkAttrName, filterEverything)
        attrs[val].wtkAttrLabel=xss(attrs[val].wtkAttrLabel, filterEverything)
        attrs[val].wtkAttrRegEx=xss(attrs[val].wtkAttrRegEx, filterEverything)
        attrs[val].wtkAttrReq=xss(attrs[val].wtkAttrReq, filterEverything)

        if ( !wtkAttrTypeReg.test(attrs[val].wtkAttrType) ) return reject("Attribute TYPE is wrong!")
        if ( !wtkAttrNameReg.test(attrs[val].wtkAttrName) ) return reject("Attribute NAME is wrong!")
        if ( !wtkAttrLabelReg.test(attrs[val].wtkAttrLabel) ) return reject("Attribute LABEL is wrong!")
        if ( !wtkAttrRegExReg.test(attrs[val].wtkAttrRegEx) ) return reject("Attribute REGEXP is wrong!")
        if ( !wtkAttrReqReg.test(attrs[val].wtkAttrReq) ) return reject("Attribute REQUIRED is wrong!")
      })

      return resolve(data)
    });
  },
  createHAL: function (self, properties={}, links={}, embedded={}){
    const HAL = {
      _links:{
        "self": {"href":self},
        ...links
      },
      ...properties,
      _embedded: embedded
    }
    return HAL
  },
  // TODO: remove all below
  renderGroupAttrs:function (groupAttrs) {
    const groupAttributes = []
    for (val in groupAttrs) {
      groupAttributes.push(
        this.createHAL(`${cjBase}${val.wtkAttrName}/`, val)
      )
    }
    return groupAttributes
  },
  createCjTemplate:function(wtkDir) {
    
    // var cType = 'application/vnd.collection+json';
    // var pathfilter = '/favicon.ico /sortbyemail /sortbyname /filterbyname';
    let cj = {};
    let path = wtkDir;
    
    cj.collection = {};
    cj.collection.version = "1.0";
    cj.collection.href = cjBase + path;

    cj.collection.links = [];
    cj.collection.links.push({'rel':'self', 'href' : cjBase+path});

    cj.collection.items = [];
    cj.collection.queries = [];
    cj.collection.template = {};

    return cj;
  },
  renderItems_groupItemsData:function(coll){
    let item;
    let items=[]
    console.log('coll',coll)
    coll.forEach((val, key) => {
      // if(path==='/' || path==='/'+val.name) {
        item = {};
        item.href = `${cjBase}${val.wtkContentName}`;
        item.data = [
          {name:"wtkName", value:val.wtkContentName, prompt:"name"},
          {name:"wtkVisible", value:val.wtkContentVisible, prompt:"visible"},
        ];
        item.links = [
          // {name:"notifications", href:item.href + '/notifications', prompt:"notifikace"},
          // {name:"zpravy", "href" : cjBase + path+ "/zpravy", "prompt" : "zprávy"}

        ];
        items.push(item)
      // }
    });
    console.log(items)
    console.log(typeof items)
    return items
  },
  renderItems_groupMetaData:function(coll){
    let item;
    let items=[]
    coll.forEach((val, key) => {
      // if(path==='/' || path==='/'+val.name) {
        item = {};
        item.href = `${cjBase}${val.wtkAttrName}/`;
        item.data = [
          {name:"wtkAttrName", value:val.wtkAttrName, prompt:"name"},
          {name:"wtkAttrLabel", value:val.wtkAttrLabel, prompt:"Label"},
          {name:"wtkAttrType", value:val.wtkAttrType, prompt:"Type"},
          {name:"wtkAttrRegex", value:val.wtkAttrRegex, prompt:"Regex"},
          {name:"wtkAttrReq", value:val.wtkAttrReq, prompt:"Req"},

          // hal:
        
          // {name:"wtkMetaTitle", value:val.wtkMetaTitle, prompt:"id"},
          // {name:"wtkMetaDescription", value:val.wtkMetaDescription, prompt:"type"},
          // {name:"wtkMetaAuthor", value:val.wtkMetaAuthor, prompt:"content"},

          // {name:"wtkMetaOgUrl", value:val.wtkMetaOgUrl, prompt:"og:url"},
          // {name:"wtkMetaOgType", value:val.wtkMetaOgType, prompt:"og:type"},
          // {name:"wtkMetaOgLocale", value:val.wtkMetaOgLocale, prompt:"og:locale"},
          // {name:"wtkMetaOgImage", value:val.wtkMetaOgImage, prompt:"og:image"},
          // {name:"wtkMetaOgTitle", value:val.wtkMetaOgTitle, prompt:"og:title"},
          // {name:"wtkMetaOgSiteName", value:val.wtkMetaOgSiteName, prompt:"og:site_name"},
          // {name:"wtkMetaOgDescription", value:val.wtkMetaOgDescription, prompt:"og:description"},

          // {name:"wtkMetaTwitterCard", value:val.wtkMetaTwitterCard, prompt:"twitter:card"},
          // {name:"wtkMetaTwitterSite", value:val.wtkMetaTwitterSite, prompt:"twitter:site"},
          // {name:"wtkMetaTwitterTitle", value:val.wtkMetaTwitterTitle, prompt:"twitter:title"},
          // {name:"wtkMetaTwitterDescription", value:val.wtkMetaTwitterDescription, prompt:"twitter:description"},
          // {name:"wtkMetaTwitterImage", value:val.wtkMetaTwitterImage, prompt:"twitter:image"},
          // {name:"wtkMetaTwitterUrl", value:val.wtkMetaTwitterUrl, prompt:"twitter:url"},
        ];
        item.links = [
          // {name:"notifications", href:item.href + '/notifications', prompt:"notifikace"},
          // {name:"zpravy", "href" : cjBase + path+ "/zpravy", "prompt" : "zprávy"}

        ];
        items.push(item)
      // }
    });
    console.log(items)
    console.log(typeof items)
    return items
  },
  renderItems_contentMetaData:function(coll){
    let item;
    let items=[]
    coll.forEach((val, key) => {
      // if(path==='/' || path==='/'+val.name) {
        item = {};
        item.href = `${cjBase}${val.wtkMetaName}/`;
        item.data = [
          {name:"wtkMetaAttr", value:val.wtkMetaAttr, prompt:"attr"},
          {name:"wtkMetaAttrName", value:val.wtkMetaAttrName, prompt:"name"},
          {name:"wtkMetaValue", value:val.wtkMetaValue, prompt:"value"},

        
          // {name:"wtkMetaTitle", value:val.wtkMetaTitle, prompt:"id"},
          // {name:"wtkMetaDescription", value:val.wtkMetaDescription, prompt:"type"},
          // {name:"wtkMetaAuthor", value:val.wtkMetaAuthor, prompt:"content"},

          // {name:"wtkMetaOgUrl", value:val.wtkMetaOgUrl, prompt:"og:url"},
          // {name:"wtkMetaOgType", value:val.wtkMetaOgType, prompt:"og:type"},
          // {name:"wtkMetaOgLocale", value:val.wtkMetaOgLocale, prompt:"og:locale"},
          // {name:"wtkMetaOgImage", value:val.wtkMetaOgImage, prompt:"og:image"},
          // {name:"wtkMetaOgTitle", value:val.wtkMetaOgTitle, prompt:"og:title"},
          // {name:"wtkMetaOgSiteName", value:val.wtkMetaOgSiteName, prompt:"og:site_name"},
          // {name:"wtkMetaOgDescription", value:val.wtkMetaOgDescription, prompt:"og:description"},

          // {name:"wtkMetaTwitterCard", value:val.wtkMetaTwitterCard, prompt:"twitter:card"},
          // {name:"wtkMetaTwitterSite", value:val.wtkMetaTwitterSite, prompt:"twitter:site"},
          // {name:"wtkMetaTwitterTitle", value:val.wtkMetaTwitterTitle, prompt:"twitter:title"},
          // {name:"wtkMetaTwitterDescription", value:val.wtkMetaTwitterDescription, prompt:"twitter:description"},
          // {name:"wtkMetaTwitterImage", value:val.wtkMetaTwitterImage, prompt:"twitter:image"},
          // {name:"wtkMetaTwitterUrl", value:val.wtkMetaTwitterUrl, prompt:"twitter:url"},
        ];
        item.links = [
          // {name:"notifications", href:item.href + '/notifications', prompt:"notifikace"},
          // {name:"zpravy", "href" : cjBase + path+ "/zpravy", "prompt" : "zprávy"}

        ];
        items.push(item)
      // }
    });
    console.log(items)
    console.log(typeof items)
    return items
  },
  renderItems_contentItemsData:function(coll){
    let item;
    let items=[]
    coll.forEach((val, key) => {
      // if(path==='/' || path==='/'+val.name) {
        item = {};
        item.href = cjBase + val.wtkName + '/items/' + val.wtkID;
        item.data = [
          {name:"wtkID", value:val.wtkID, prompt:"id"},
          {name:"wtkType", value:val.wtkType, prompt:"type"},
          {name:"wtkCont", value:val.wtkCont, prompt:"content"},
          {name:"wtkWidth", value:val.wtkWidth, prompt:"width"},
          {name:"wtkHeight", value:val.wtkHeight, prompt:"height"},
          {name:"wtkPosition", value:val.wtkPosition, prompt:"position"},
          {name:"wtkVisible", value:val.wtkVisible, prompt:"visible"},
          {name:"wtkInsertDate", value:val.wtkIndesrtDate, prompt:"insertDate"}
        ];
        item.links = [
          // {name:"notifications", href:item.href + '/notifications', prompt:"notifikace"},
          // {name:"zpravy", "href" : cjBase + path+ "/zpravy", "prompt" : "zprávy"}

        ];
        items.push(item)
      // }
    });
    console.log(items)
    console.log(typeof items)
    return items
  },
  renderItems_contents:function(coll) {
    let item;
    let items=[]
    coll.forEach((val, key) => {
      // if(path==='/' || path==='/'+val.name) {
        item = {};
        item.href = cjBase + '/' + val.wtkMetaName;
        item.data = [
          {name:"wtkMetaName", value:val.wtkMetaName, prompt:"name"},
          {name:"wtkMetaTitle", value:val.wtkMetaTitle, prompt:"title"},
          {name:"wtkMetaDescription", value:val.wtkMetaDescription, prompt:"description"},
          {name:"wtkInsertDate", value:new Date(), prompt:"insertDate"}
        ];
        item.links = [
          // {name:"notifications", href:item.href + '/notifications', prompt:"notifikace"},
          // {name:"zpravy", "href" : cjBase + path+ "/zpravy", "prompt" : "zprávy"}

        ];
        items.push(item)
      // }
    });
    return items
  }
};
