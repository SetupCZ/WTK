'use strict';
const wtkIndex = require('../wtk/wtk-index.js');
const settings = require('./serverSettings.json');
// const userSettings = require('./userSettings.json');

const CryptoJS = require("crypto-js")
const jwt=require('jsonwebtoken');

module.exports={
  // TODO: pswds
  newPswd:function(formData){
    return new Promise((resolve, reject) => {
      wtkIndex.validateUser(formData)
      .then((validatedFormData) => {
        let pr1= wtkIndex.getResetPswd()
        let pr2= wtkIndex.getUserSettings()

        return Promise.all([pr1, pr2])
      })
      .then((prAll) => {
        let resetData=prAll[0]
        let userSettings=prAll[1]

        if (resetData[formData.hash]==undefined) { return reject("Ups! Něco se nepovedlo.") }
        if (new Date(resetData[formData.hash].expirationDate).getTime() < new Date().getTime()) { return reject("Ups! Vypršela vám platnost!") }

        resetData[formData.hash].step="finished"

        let user=userSettings[resetData[formData.hash].email]

        let salt=CryptoJS.SHA256(CryptoJS.lib.WordArray.random(128/8)).toString(CryptoJS.enc.Hex)
        let saltedPswdNew=CryptoJS.PBKDF2(formData.wtkLoginPswdNew, salt).toString(CryptoJS.enc.Hex)

        console.log(userSettings)  

        userSettings[resetData[formData.hash].email].pswd=saltedPswdNew
        userSettings[resetData[formData.hash].email].salt=salt

        return wtkIndex.saveUserSettings(JSON.stringify(userSettings))
      })
      .then((data) => {
        return resolve("vše ok")
      })
      .catch((err) => {
        return reject(err)
      });
    });
  },
  resetPswd:function(formData){
    return new Promise((resolve, reject) => {
      
      wtkIndex.validateUser(formData)
      .then((validatedFormData) => {
        formData=validatedFormData
        console.log(formData)
        let pr1= wtkIndex.getResetPswd()
        let pr2= wtkIndex.getUserSettings()

        return Promise.all([pr1, pr2])
      })
      .then((prAll) => {
        let resetData=prAll[0]
        let userSettings=prAll[1]

        // console.log(new Date(resetData[formData.hash].expirationDate).getTime())
        // console.log(new Date(resetData[formData.hash].expirationDate))
        // console.log(new Date().getTime())
        // console.log(new Date().getTime() - new Date(resetData[formData.hash].expirationDate).getTime())
        if (resetData[formData.hash]==undefined) { return reject("Ups! Něco se nepovedlo.") }
        if (new Date(resetData[formData.hash].expirationDate).getTime() < new Date().getTime()) { return reject("Ups! Vypršela vám platnost!") }
          

        let user=userSettings[resetData[formData.hash].email]

        let secQValid=false
        if (formData.wtkSecQ1==user.secQ1) {
          if (formData.wtkSecA1!=user.secA1) { return reject("Ups! Něco se nepovedlo.") }
        }
        if (formData.wtkSecQ1==user.secQ2) {
          if (formData.wtkSecA1!=user.secA2) { return reject("Ups! Něco se nepovedlo.") }
        }
        if (formData.wtkSecQ2==user.secQ1) {
          if (formData.wtkSecA2!=user.secA1) { return reject("Ups! Něco se nepovedlo.") }
        }
        if (formData.wtkSecQ2==user.secQ2) {
          if (formData.wtkSecA2!=user.secA2) { return reject("Ups! Něco se nepovedlo.") }
        }


        resetData[formData.hash].step="pswd reset"
        userSettings[resetData[formData.hash].email].pswd=""
        return wtkIndex.saveUserSettings(JSON.stringify(userSettings))
      })
      .then((data) => {
        return resolve("Vše ok")
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });
    });
  },
  forgotPswd:function(formData){
    return new Promise((resolve, reject) => {

      console.log('s')
      wtkIndex.validateUser(formData)
      .then((data) => {
        formData=data
        console.log('sss')
        let pr1= wtkIndex.getUserSettings()
        let pr2= wtkIndex.getResetPswd()
        return Promise.all([pr1,pr2])
      })
      .then((prAll) => {
        let userSettings=prAll[0]
        let resetPswdJson=prAll[1]
        console.log('ssss')

        let hash=CryptoJS.lib.WordArray.random(128/8).toString();
        let today= new Date()
        // console.log(today.setDate(today.getDate() + 1))
        resetPswdJson[hash]={
          insertDate: today,
          expirationDate: today.setDate(today.getDate() + 1),
          step:"sendHash",
          email:formData.wtkLoginName
        }
        
        if (userSettings[formData.wtkLoginName]==undefined) { return resolve("Ověřovací e-mail byl zaslán.") }
          console.log(resetPswdJson)
        let pr1= wtkIndex.saveResetPswd(JSON.stringify(resetPswdJson))
        let pr2= wtkIndex.sendMail({
          email:formData.wtkLoginName, 
          msg:`${hash}`
        })
      })
      .then((data) => {
        return resolve(data)
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });

      
    });
  },
  editUser:function(formData, user) {
    return new Promise((resolve, reject) => {
      let userSettings={}
      wtkIndex.getUserSettings()
      .then((data) => {
        userSettings=data
        return wtkIndex.validateUser(formData, user)
      })
      .then((validatedFormData) => {
        // if (user.email==formData.wtkLoginName) { throw("Ups! Neco se nepovedlo")}
        let userSett = userSettings[user.email]
        if (userSett==undefined) { return reject("Ups! Neco se nepovedlo")}
        if (formData.length==1 && formData.wtkLoginName!=undefined) {
          // měním jméno
          userSettings[formData.wtkLoginName]=userSettings[user.email]
          delete userSettings[user.email]
        }
        else if (formData.wtkSecQ1!=undefined) {
          // měním secQ / pswd
          userSettings[user.email].secQ1=formData.wtkSecQ1
          userSettings[user.email].secA1=formData.wtkSecA1
          userSettings[user.email].secQ2=formData.wtkSecQ2
          userSettings[user.email].secA2=formData.wtkSecA2
        }
        else if(formData.wtkLoginPswdOld!=undefined){

          let salt=userSettings[user.email].salt

          let saltedPswdOld=CryptoJS.PBKDF2(formData.wtkLoginPswdOld, salt).toString(CryptoJS.enc.Hex)
          let saltedPswdNew=CryptoJS.PBKDF2(formData.wtkLoginPswdNew, salt).toString(CryptoJS.enc.Hex)
          console.log(saltedPswdOld)
          console.log(userSettings[user.email].pswd)
          if (userSettings[user.email].pswd!=saltedPswdOld) { return reject("Špatné heslo") }
          console.log(userSettings)  
          userSettings[user.email].pswd=saltedPswdNew
        }

        return wtkIndex.saveUserSettings(JSON.stringify(userSettings))
      })
      .then((data) => {
        console.log('asd',data)
        let userName= formData.wtkLoginName!=undefined?formData.wtkLoginName:user.email
        let userForWeb={
          email:userName,
          secQ1:userSettings[userName].secQ1,
          secQ2:userSettings[userName].secQ2,
        }
        let userInfo={
          email:userName,
          secQ1:userSettings[userName].secQ1,
          secQ2:userSettings[userName].secQ2,
        }

        let token = jwt.sign(userInfo, settings.jwtPswd);
        return resolve({token:token, userForWeb:userForWeb})
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });
    });
  },

  getMetaData:function() {
    return new Promise((resolve, reject) => {
      wtkIndex.getAlocData()
      .then((alocData) => {
        // for each alocData.alocData promise
        // get metaData from group content
        return Promise.all(data.map((val) => {
          return wtkIndex.getMetaDataByDir(val.wtkDir)
        }))
      })
      // response from promise.all
      .then((metaData) => {
        console.log('allmetaData')
        console.log(metaData)
        // vratime rest api
        resolve(metaData)
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  getGroups:function() {
    return new Promise((resolve, reject) => {
      // TODO: show only visible items 

      wtkIndex.getAlocData()
      .then((alocData) => {
        let groups = wtkIndex.getGroups()
        return Promise.all(groups.map((val) => {
          return wtkIndex.getMetaDataByDir(val.wtkDir)
        }))
      })
      .then((groupData) => {
        resolve(groupData)
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  addGroups: async function (formData) {
    return new Promise(async (resolve, reject) => {

      // validate input
      // get aloc data
      // get aloc data by name
      // check if exists
      // add new dir 
      // edit aloc data
      // add new metaData
      // return cj
      // return
      let wtkDir
      let cjMetaData
      let cjItemsData
      let vData = {}
      let groupMetaData = {}
      wtkIndex.validateG(formData)
      .then((vGroup) => {
        vData = vGroup
        const alocDataPromise = wtkIndex.getAlocData()
        const alocDataByNamePromise = wtkIndex.getAlocDataByName(vData.wtkName, true)
        return Promise.all([alocDataPromise, alocDataByNamePromise])
      })
      .then(([alocData, alocDataByName]) => {
        // check if alocData is empty
        if (alocData == null) { alocData = {} }//alocData.alocData = { alocData: [] } }
        // check if name exists
        if (alocDataByName != null) { throw ('This name allready exists!') }

        // set wtkDir
        wtkDir = vData.wtkName // <=prepsat!!!
        // push new alocData
        groupMetaData = {
          wtkName: vData.wtkName,
          wtkDir: wtkDir,
          wtkVisible: true,
          wtkType: 'group',
          wtkInsertDate: new Date()
        }
        alocData[vData.wtkName] = groupMetaData
        // alocData.alocData.push(groupMetaData)
        // edit aloc data
        // crate new dir
        const editAlocDataPromise = wtkIndex.editAlocData(alocData)
        const newDirPromise = wtkIndex.addNewDir(wtkDir)
        return Promise.all([editAlocDataPromise, newDirPromise])
      })
      .then(([editAlocData, newDir]) => {
        const halMetaData = wtkIndex.createHAL(
          wtkDir,
          {
            "groupAttributes": vData.groupAttrs,
            "wtkVisible": groupMetaData.wtkVisible,
            "wtkInsertDate": groupMetaData.wtkInsertDate
          },
          {
            "items": { "href": `${wtkDir}/contents` }
          },
          {
            "items":{}
          }
        )

        const halItemsData = wtkIndex.createHAL(
          `${wtkDir}/contents`,
          {},
          {},
          {
            "items":{}
          }
        )
        console.log(halMetaData);
        console.log(halItemsData);
        const metaDataPromise =
          wtkIndex.addMetaData(halMetaData, wtkDir)
        const itemsDataPromise =
          wtkIndex.addItemsData(halItemsData, wtkDir)
        return Promise.all([metaDataPromise, itemsDataPromise])
      })
      .then(([metaData, itemsData]) => {
        resolve({ location: metaData._links.self.href })
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  editGroup:function(wtkName, formData){
    return new Promise((resolve, reject) => {
      let selfDir
      let vData
      wtkIndex.validateG(formData)
      .then((vGroup) => {
        console.log(vGroup);
        vData = vGroup
        return wtkIndex.getAlocDataByName(wtkName)
      })
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getMetaDataByDir(selfDir)
      })
      .then((metaData) => {
        
        console.log('metadata',metaData)
        metaData.groupAttributes = formData.groupAttrs
        return wtkIndex.addMetaData(metaData, metaData._links.self.href)
      })
      .then((metaData) => {
        return resolve({location: metaData._links.self.href})
      })
      .catch((err) => {
        return reject(err)
      });
    });
  },
  dropGroup:function(wtkName) {
    return new Promise((resolve, reject) => {
      let selfDir
      return wtkIndex.getAlocData()
      .then((alocData) => {
        console.log(alocData);
        delete alocData[wtkName]
        // for (let val of alocData.alocData) {
        //   console.log(val);
        //   if (val.wtkName == wtkName) {
        //     val.wtkVisible = false
        //     break
        //   }
        // }
        return wtkIndex.editAlocData(alocData)
      })
      .then((response) => {
        return resolve()
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      })
    })
  },
  addContentToGroup:function(wtkName, location){
    return new Promise((resolve, reject) => {
      let selfDir
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getMetaDataByDir(selfDir)
      })
      .then((itemsData) => {
        const newGroupItem = wtkIndex.createHAL(
          `${location}`,
          {
            wtkVisible:true
          }
        )

        itemsData._embedded.items[location] = newGroupItem
        return wtkIndex.addMetaData(itemsData, selfDir)
      })
      .then((itemsData) => {
        return resolve({location: location})
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });
    });
  },
  getContentsMetaData: function (vData) {
    return {
      // metaAttr doesn't apply
      "wtkMetaLink": {
        wtkMetaValue: vData.wtkMetaLink, wtkMetaAttr: "id", wtkMetaAttrName: "name"
      },
      "wtkMetaName": {
        wtkMetaValue: vData.wtkMetaName, wtkMetaAttr: "id", wtkMetaAttrName: "name"
      },
      "wtkMetaTitle": {
        wtkMetaValue: vData.wtkMetaTitle, wtkMetaAttr: "id", wtkMetaAttrName: "name"
      },
      // metaAttr apply
      "wtkMetaDescription": {
        wtkMetaValue: vData.wtkMetaDescription, wtkMetaAttr: "type", wtkMetaAttrName: "name"
      },
      "wtkMetaAuthor": {
        wtkMetaValue: vData.wtkMetaAuthor, wtkMetaAttr: "content", wtkMetaAttrName: "name"
      },
      "wtkMetaThumbnail": {
        wtkMetaValue: vData.wtkMetaThumbnail, wtkMetaAttr: "content", wtkMetaAttrName: "name"
      },
      // FB, TWIITER META
      "wtkMetaOgUrl": {
        wtkMetaValue: vData.wtkMetaUrl, wtkMetaAttr: "og:url", wtkMetaAttrName: "name"
      },
      "wtkMetaOgType": {
        wtkMetaValue: "website", wtkMetaAttr: "og:type", wtkMetaAttrName: "name"
      },
      "wtkMetaOgLocale": {
        wtkMetaValue: vData.wtkMetaOgLocale, wtkMetaAttr: "og:locale", wtkMetaAttrName: "name"
      },
      "wtkMetaOgImage": {
        wtkMetaValue: vData.wtkMetaThumbnail, wtkMetaAttr: "og:image", wtkMetaAttrName: "name"
      },
      "wtkMetaOgTitle": {
        wtkMetaValue: vData.wtkMetaTitle, wtkMetaAttr: "og:title", wtkMetaAttrName: "name"
      },
      "wtkMetaOgSiteName": {
        wtkMetaValue: vData.wtkMetaOgSiteName, wtkMetaAttr: "og:site_name", wtkMetaAttrName: "name"
      },
      "wtkMetaOgDescription": {
        wtkMetaValue: vData.wtkMetaDescription, wtkMetaAttr: "og:description", wtkMetaAttrName: "name"
      },

      "wtkMetaTwitterCard": {
        wtkMetaValue: "summary", wtkMetaAttr: "twitter:card", wtkMetaAttrName: "name"
      },
      "wtkMetaTwitterSite": {
        wtkMetaValue: vData.wtkMetaSite, wtkMetaAttr: "twitter:site", wtkMetaAttrName: "name"
      },
      "wtkMetaTwitterTitle": {
        wtkMetaValue: vData.wtkMetaTitle, wtkMetaAttr: "twitter:title", wtkMetaAttrName: "name"
      },
      "wtkMetaTwitterDescription": {
        wtkMetaValue: vData.wtkMetaDescription, wtkMetaAttr: "twitter:description", wtkMetaAttrName: "name"
      },
      "wtkMetaTwitterImage": {
        wtkMetaValue: vData.wtkMetaThumbnail, wtkMetaAttr: "twitter:image", wtkMetaAttrName: "name"
      },
    }
  },
  getContents:function (wtkName) {
    return new Promise((resolve, reject) => {
      wtkIndex.getAlocData()
      .then((alocData) => {
        // console.log(alocData)
        let Content = wtkIndex.getContents(wtkName)
        return Promise.all(Content.map((val) => {
          return wtkIndex.getMetaDataByDir(val.wtkDir)
        }))
      })
      .then((contentData) => {
        let sorted = contentData.sort((data) => {
          //...
        })
        resolve(contentData)
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  addContent:function (formData, imgFile) {
    // validate input
    // get aloc data
    // get aloc data by name
    // check if exists
    // add new dir 
    // edit aloc data
    // add new metaData
    // return cj
    // return
    return new Promise((resolve, reject) => {
      let staleAlocData={};
      let selfDir
      let selfHref
      let cjMetaData
      let cjItemsData
      let formMetaData
      let vData
      let contentMetaData
      wtkIndex.validateC(formData, imgFile)
      .then((vCont) => {
        vData = vCont
        const alocDataPromise = wtkIndex.getAlocData()
        const alocDataByNamePromise = 
          wtkIndex.getAlocDataByName(vData.wtkMetaName, true)
        return Promise.all([alocDataPromise, alocDataByNamePromise])
      })
      .then(([alocData, alocDataByName]) => {
        // check if alocData is empty
        if (alocData == null) { alocData = {} }//alocData.alocData = []
        // check if name exists
        if (alocDataByName != null) { throw('This name allready exists!') }
        // save alocData if err
        selfHref = vData.wtkMetaName
        selfDir = vData.wtkMetaName.replace('contents/','') 
        //////////////////////////////////////
        // Save alocData
        // push new alocData
        contentMetaData = {
          wtkName: selfHref,
          wtkDir: selfDir,
          wtkVisible: true,
          wtkType: 'content',
          wtkInsertDate: new Date()
        }
        alocData[selfHref] = contentMetaData
        // alocData.alocData.push(contentMetaData)

        //////////////////////////////////////
        // Save metaData
        formMetaData = this.getContentsMetaData(vData)
        console.log(vData.groupAttrs);
        // vData.groupAttrs = 
        Object.keys(vData.groupAttrs)
        .forEach(key => {
          vData.groupAttrs[key].wtkMetaValue = vData[key]
        })
        
        // formMetaData = Object.assign({}, formMetaDataPrep, vData)

        console.log(vData.groupAttrs);
        // return
        // edit aloc data
        // crate new dir
        let editAlocDataPromise = wtkIndex.editAlocData(alocData)
        let newDirPromise = wtkIndex.addNewDir(selfDir)
        return Promise.all([editAlocDataPromise, newDirPromise])
      })
      .then(([alocData, newDir]) => {
        const halMetaData = wtkIndex.createHAL(
          selfHref,
          {
            "groupAttributes": vData.groupAttrs?vData.groupAttrs:[],
            "wtkVisible": contentMetaData.wtkVisible,
            "wtkInsertDate": contentMetaData.wtkInsertDate,
            ...formMetaData
          },
          {
            "items": { "href": `${selfHref}/items` }
          },
          {
            "items": {}
          }
        )

        const halItemsData = wtkIndex.createHAL(
          `${selfDir}/items`,
          {},
          {},
          {
            "items": {}
          }
        )
        console.log(halMetaData);
        console.log(halItemsData);
        const metaDataPromise =
          wtkIndex.addMetaData(halMetaData, selfDir)
        const itemsDataPromise =
          wtkIndex.addItemsData(halItemsData, selfDir)
        return Promise.all([metaDataPromise, itemsDataPromise])
      })
      .then(([metaData,itemsData]) => {
        resolve({location:metaData._links.self.href})
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  editContent:function(wtkName, formData, imgFile){
    return new Promise((resolve, reject) => {
      let vData
      let selfDir
      let formMetaData
      wtkIndex.validateC(formData, imgFile)
      .then((vCont) => {
        vData=vCont
        return wtkIndex.getAlocDataByName(wtkName)
      })
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getMetaDataByDir(selfDir)
      })
      .then((metaData) => {
        // formMetaData = this.getContentsMetaData(vData)

        for( let key in vData) {
          metaData[key] = vData[key]
        }

        return wtkIndex.addMetaData(metaData, selfDir)
      })
      .then((metaData) => {
        return resolve({ location: metaData._links.self.href})
      })
      .catch((err) => {
        return reject(err)
      });
    });
  },
  dropContent: function(wtkName){
    return new Promise((resolve, reject) => {
      wtkIndex.getAlocData()
      .then((alocData) => {
        delete alocData[wtkName]
        // for (let val of alocData.alocData) {
        //   if (val.wtkName == wtkName) {
        //     val.wtkVisible = false
        //     break
        //   }
        // }

        return wtkIndex.editAlocData(alocData)
      })
      .then((alocData) => {
        // TODO: resolve object everywhere
        return resolve()
      })
      .catch((err) => {
        return reject(err)
      });
    });
  },
  dropContentInGroup: function (wtkName, groupName) {
    return new Promise((resolve, reject) => {
      let alocDataTemp
      let selfDir

      const alocDataPromise = wtkIndex.getAlocData()
      const alocDataByNamePromise = wtkIndex.getAlocDataByName(groupName)
      Promise.all([alocDataPromise, alocDataByNamePromise])
        .then(([alocData, alocDataByName]) => {
          alocDataTemp = alocData
          selfDir = alocDataByName.wtkDir
          return wtkIndex.getMetaDataByDir(selfDir)
        })
        .then((metaData) => {
          delete metaData._embedded.items[wtkName.replace('/contents', '')]
          delete alocDataTemp[wtkName]

          const alocDataTempPromise = wtkIndex.editAlocData(alocDataTemp)
          const metaDataPromise = wtkIndex.addMetaData(metaData, selfDir)
          // return
          return Promise.all([alocDataTempPromise, metaDataPromise])
        })
        .then(([alocData, metaData]) => {
          // TODO: resolve object everywhere
          return resolve({location: metaData._links.self.href})
        })
        .catch((err) => {
          return reject(err)
        });
    });
  },
  getItem:function (wtkName, wtkID){
    return new Promise((resolve, reject) => {
      let wtkSelfDir
      let selfDir
      let itemHref
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getMetaDataByDir(selfDir)
      })
      .then((itemsData) => {
        itemHref = `${wtkName}/items/${wtkID}`
        let item = itemsData._embedded.items[itemHref]
        
        if (item.wtkType=="text") {
          return wtkIndex.getTextItemByID(selfDir, wtkID)
        }
        if (item.wtkType=="img") {
          return wtkIndex.getImgItemByName(item.wtkCont)
        }
      })
      .then((contData) => {
        resolve(contData)
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  addItem:function (wtkName, formData, wtkImgCont){
    return new Promise((resolve, reject) => {
    // validateI
    // get metaData by name
    // pridat do metaData
    // vytvorit soubor html
      let vData
      let itemHref
      let selfDir
      let itemMetaData
      wtkIndex.validateI(formData, wtkImgCont)
      .then((vItem) => {
        vData = vItem
        return wtkIndex.getAlocDataByName(wtkName)
      })
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getMetaDataByDir(selfDir)
      })
      .then((itemsData) => {
        console.log(itemsData)
        
        itemMetaData = {
          wtkID: new Date().getTime(),
          wtkType: vData.wtkType,
          wtkCont: vData.wtkCont,
          wtkPosition: vData.wtkPosition,
          wtkWidth: vData.wtkWidth,
          wtkHeight: vData.wtkHeight,
          wtkVisible: true,
          wtkName: wtkName,
          wtkIndesrtDate: new Date(),
          wtkEditDate: new Date(),
        }
        itemHref = `${wtkName}/items/${itemMetaData.wtkID}`

        const halItemsData = wtkIndex.createHAL(
          itemHref,
          {
            ...itemMetaData
          },
          {
            content:{href:`${itemHref}/contents`}
          }
        )

        ///////////////////////////////
        // add item to content metaData
        itemsData._embedded.items[itemHref]=halItemsData

        const editItemPromiseChain = [
          wtkIndex.addMetaData(itemsData, selfDir)
        ]
        if (vData.wtkType=="text") {
          editItemPromiseChain.push(wtkIndex.addTextItem(itemMetaData, selfDir))
        }

        return Promise.all(editItemPromiseChain)
      })
      .then(([editedItemsData, textContent]) => {
        resolve({location:itemHref})
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    }); 
    
    // {"collection":{"version":"1.0","href":"","links":[{"rel":"home","href":"/"},{"rel":"self","href":"/ad"}],"items":[],"queries":[],"template":{}}}
  },
  editItem:function (wtkName, wtkID, data, wtkImgCont){
    return new Promise((resolve, reject) => {
      // get aloc data by name
      // get metaData
      // editMetadata
      // save metaData
      let vData
      let itemHref
      let selfDir
      wtkIndex.validateI(data, wtkImgCont)
      .then((vItem) => {
        vData = vItem
        return wtkIndex.getAlocDataByName(wtkName)
      })
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getMetaDataByDir(selfDir)
      })
      .then((itemsData) => {
        console.log('itemsData',itemsData)
        itemHref = `${wtkName}/items/${wtkID}`

        let editItem = itemsData._embedded.items[itemHref] 
        
        for (const key in vData) {
          editItem[key] = vData[key]
        }
        editItem.wtkEditDate = new Date()

        console.log(itemsData)
        console.log(itemsData._embedded.items[itemHref].wtkCont)

        const editItemPromiseChain = [
          wtkIndex.addMetaData(itemsData, selfDir)
        ]
        if (editItem.wtkType=="text") {
          editItemPromiseChain.push(
            wtkIndex.addTextItem(editItem, selfDir)
          )
        }
        return Promise.all(editItemPromiseChain)
      })
      .then(([editedItemsData, textContent]) => {
        resolve({ location: itemHref })
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  dropItem:function (wtkName, wtkID){
    return new Promise((resolve, reject) => {
      let itemHref
      let selfDir
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getMetaDataByDir(selfDir)
      })
      .then((itemsData) => {
        itemHref = `${wtkName}/items/${wtkID}`

        itemsData._embedded.items[itemHref].wtkVisible = false
        return wtkIndex.addMetaData(itemsData, selfDir)
      })
      .then((editedItemsData) => {
        resolve()
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },

  getItemsDataByName:function (name, sort) {
    return new Promise((resolve, reject) => {
      wtkIndex.getAlocDataByName(name)
      .then((alocData) => {
        if (alocData == null ) return resolve(204) 
        return wtkIndex.getMetaDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        console.log(itemsData);
        let visItems = wtkIndex.getVisibleItems(itemsData)
        console.log(`${visItems}`);
        itemsData._embedded.items = visItems
        // TODO: visit sort
        if (sort) {
          let sortedItemsData = wtkIndex.sortItemsData(itemsData)
          console.log(sortedItemsData);
          // visibleItemsData.collection.items=sortedItemsData
        }
        console.log(`itemsData: ${JSON.stringify(itemsData)}`);
        return resolve(itemsData)
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });
    });
  },
  getMetaDataByName:function (name) {
    return new Promise((resolve, reject) => {
      wtkIndex.getAlocDataByName(name)
      .then((alocData) => {
        return wtkIndex.getMetaDataByDir(alocData.wtkDir)
      })
      .then((metaData) => {
        
        // let visibleMetaData=wtkIndex.getVisibleItems(metaData)
        // let sortedMetaData=wtkIndex.sortMetaData(visibleMetaData)
        // visibleMetaData.collection.items=sortedMetaData
        resolve(metaData)
      })
      .catch((err) => {
        console.log(err)
        reject(err)
      });
    });
  },
  getMetaDataByID:function (wtkName, wtkID){
    return new Promise((resolve, reject) => {
      
      let itemHref=wtkName+"/"+wtkID
      console.log('getMetaDataByID')
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        console.log(alocData)
        return wtkIndex.getMetaDataByDir(alocData.wtkDir)
      })
      .then((metaData) => {
        console.log(metaData)
        return wtkIndex.getMetaDataByID(itemHref, metaData)
      })
      .then((item) => {
        console.log('item',item)
        if (item==undefined || items.length==0) { return resolve(null)}
        let cj = wtkIndex.createCjTemplate(itemHref)
            cj.collection.items.push(item)
        return resolve(cj)
      })
      .catch((err) => {
        return reject(err)
      });
    });
  },
  // TODO: delete this i gues
  getItemsDataByID:function (wtkName, wtkID){
    return new Promise((resolve, reject) => {
      
      console.log('getMetaDataByID')
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        console.log(alocData)
        return wtkIndex.getItemsDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        console.log(itemsData)
        let itemHref = wtkName + "/items/" + wtkID
        itemsData._embedded.items[itemHref]
        // return wtkIndex.getItemsDataByID(itemHref, itemsData)
      })
      .then((item) => {
        console.log('item',item)
        if (item==undefined || item.length==0) { return resolve(null)}
        let cj = wtkIndex.createCjTemplate(itemHref)
            cj.collection.items.push(item)
        return resolve(cj)
      })
      .catch((err) => {
        return reject(err)
      });
    });
  },

  searchQuery: function (wtkName, query, options){
    return new Promise((resolve, reject) => {
      let wtkTypeCont
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        wtkTypeCont = alocData.wtkType
        return wtkIndex.getMetaDataByDir(alocData.wtkDir)
      })
      .then((metaData) => {
        if (wtkTypeCont=="content") {
          return searchContent(metaData, options, query)
        }
        else {
          return searchGroup(metaData, options, query)
        }
      })
      .then((pushThis) => {
        return resolve(pushThis)
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });
    });

    function searchGroup(metaDataGroup, options, query){
      return new Promise((resolve, reject) => {
        const items = metaDataGroup._embedded.items
        const searchAll = 
          Object.keys(items)
          .map(key => {
            // Push promise for each item
            return new Promise((resolve, reject) => {
              wtkIndex.getAlocDataByName(items[key]._links.self.href)
              .then((alocData) => {
                return wtkIndex.getMetaDataByDir(alocData.wtkDir)
              })
              .then((metaData) => {
                return resolve(searchContent(metaData, options, query))
              })
              .catch((err) => {
                console.log('errg',err)
                return reject(err)
              });
            }) // search all
          }) // map items

        return Promise.all(searchAll)
        .then((searchedItems) => {
          return resolve(
            searchedItems
            .filter(data => { return data.length })
            .reduce((first, second) => { return first.concat(second) })
          )
        })
        .catch((err) => {
          return reject(err)
        });
      }); //promise
    }
    function searchContent(metaData, options, query){
      return options
        .map(valOpt => { 
          return searchContentMeta(metaData, valOpt, query) 
        })
        .filter(data => { return data })
    } 
    function searchContentMeta(metaData, valOpt, query){
      // data can be hal metadata or hal _embedded.items
      if (valOpt=="wtkCont") {
        const items = metaData._embedded.items
        const itemMetaData = 
          Object.keys(items)
          .find(key => {
            if (String(items[key].wtkCont)
                .toLowerCase()
                .indexOf(String(query).toLowerCase()) !== -1) {
              return true
            }
          })
        return itemMetaData ? metaData : null
      }
      if (!metaData[valOpt]) return null
      if (String(metaData[valOpt].wtkMetaValue)
          .toLowerCase()
          .indexOf(String(query).toLowerCase()) !== -1) {
        return metaData 
      }
      return null
    }
  }
}


/*
wtk-group name="sluzby"
1) get alocData
2) fing sluzby in collection.items
3) get item.metaData
4) each list item.metaData

wtk-content name="clanek1"
1) get alocData
2) find
*/