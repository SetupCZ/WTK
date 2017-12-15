'use strict';
var wtkIndex = require('../wtk/wtk-index.js');
var settings = require('./serverSettings.json');
// var userSettings = require('./userSettings.json');

var CryptoJS = require("crypto-js")
var jwt=require('jsonwebtoken');

module.exports={
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
      .then((data) => {
        // for each data.alocData promise
        // get metaData from group content
        return Promise.all(data.map((val) => {
          return wtkIndex.getMetaDataByDir(val.wtkDir)
        }))
      })
      // response from promise.all
      .then((data) => {
        console.log('allData')
        console.log(data)
        // vratime rest api
        resolve(data)
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
        if (alocData == null) { alocData.alocData = { alocData: [] } }
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
        alocData.alocData.push(groupMetaData)
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
            "items":[]
          }
        )

        const halItemsData = wtkIndex.createHAL(
          `${wtkDir}/contents`,
          {},
          {},
          {
            "items":[]
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
        resolve(metaData)
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
      .then((cj) => {
        return resolve(cj)
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
        for (let val of alocData.alocData) {
          console.log(val);
          if (val.wtkName == wtkName) {
            val.wtkVisible = false
            break
          }
        }
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
  // TODO: 
  addContentToGroup:function(wtkName, location){
    return new Promise((resolve, reject) => {
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        return wtkIndex.getItemsDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        // let visibleitemsData=wtkIndex.getVisibleItems(itemsData)
        // let sorteditemsData=wtkIndex.sortitemsData(visibleitemsData)
        // visibleitemsData.collection.items=sorteditemsData
        // resolve(itemsData)
        // {"href":"test7/contents/[object Object]","data":[],"links":[]}
        console.log(itemsData.collection.items)
        console.log('location',location)
        let newGroupItems=wtkIndex.renderItems_groupItemsData([{wtkName:wtkName, wtkContentName:location, wtkContentVisible:true}])
        itemsData.collection.items=itemsData.collection.items.concat(newGroupItems)
        console.log('metaItems',itemsData.collection.items)

        return wtkIndex.addItemsData(itemsData, wtkName)
      })
      .then((itemsData) => {
        return resolve(location)
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });
    });
  },
  // TODO: 
  editContentInGroup:function(wtkName, location){
    let editedMetaItem=wtkIndex.editItem(metaData, itemHref, validatedFormData)
  },
  getContentsMetaData: function (vData) {
    return {
      "wtkMetaName": {
        wtkMetaValue: vData.wtkMetaName, wtkMetaAttr: "id", wtkMetaAttrName: "name"
      },
      "wtkMetaTitle": {
        wtkMetaValue: vData.wtkMetaTitle, wtkMetaAttr: "id", wtkMetaAttrName: "name"
      },
      "wtkMetaDescription": {
        wtkMetaValue: vData.wtkMetaDescription, wtkMetaAttr: "type", wtkMetaAttrName: "name"
      },
      "wtkMetaAuthor": {
        wtkMetaValue: vData.wtkMetaAuthor, wtkMetaAttr: "content", wtkMetaAttrName: "name"
      },
      "wtkMetaThumbnail": {
        wtkMetaValue: vData.wtkMetaThumbnail, wtkMetaAttr: "content", wtkMetaAttrName: "name"
      },

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
        console.log('*-----------------------')
        console.log('contentData',contentData)
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
    console.log('formData',formData)
    // return
    return new Promise((resolve, reject) => {
      let staleAlocData={};
      let selfDir
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
        if (alocData == null) { alocData = {alocData:[]} }
        // check if name exists
        if (alocDataByName != null) { throw('This name allready exists!') }
        // save alocData if err
        selfDir = vData.wtkMetaName.replace('contents/','') 

        // push new alocData
        contentMetaData = {
          wtkName: vData.wtkMetaName,
          wtkDir: selfDir,
          wtkVisible: true,
          wtkType: 'content',
          wtkInsertDate: new Date()
        }
        alocData.alocData.push(contentMetaData)

        formMetaData = this.getContentsMetaData(vData)
        // edit aloc data
        // crate new dir
        let editAlocDataPromise = wtkIndex.editAlocData(alocData)
        let newDirPromise = wtkIndex.addNewDir(selfDir)
        return Promise.all([editAlocDataPromise, newDirPromise])
      })
      .then(([alocData, newDir]) => {
        const halMetaData = wtkIndex.createHAL(
          selfDir,
          {
            "groupAttributes": vData.groupAttrs?vData.groupAttrs:[],
            "wtkVisible": contentMetaData.wtkVisible,
            "wtkInsertDate": contentMetaData.wtkInsertDate,
            ...formMetaData
          },
          {
            "items": { "href": `${selfDir}/items` }
          },
          {
            "items": []
          }
        )

        const halItemsData = wtkIndex.createHAL(
          `${selfDir}/items`,
          {},
          {},
          {
            "items": []
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
      .then((cj) => {
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
        for (let val of alocData.alocData) {
          if (val.wtkName == wtkName) {
            val.wtkVisible = false
            break
          }
        }

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
  getItem:function (wtkName, wtkID){
    return new Promise((resolve, reject) => {

      let wtkSelfDir
      let itemType
      let wtkDir
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        wtkDir=alocData.wtkDir
        return wtkIndex.getItemsDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        let selfDir=`${wtkName}/items/${wtkID}`
        let item=wtkIndex.getItemsDataByID(selfDir, itemsData)
        itemType=item.data.find((data) => {
          return data.name=="wtkType"
        })

        if (itemType.value=="text") {
          return wtkIndex.getTextItemByID(wtkDir, wtkID)
        }
        if (itemType.value=="img") {
          let wtkImgName=item.data.find((data) => {
            return data.name=="wtkCont"
          })
          return wtkIndex.getImgItemByName(wtkImgName.value)
        }
      })
      .then((contData) => {
        resolve(contData)
      })
      .catch((err) => {
        console.log(err)
        reject(err)
        //...
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
      console.log('wtkImgCont',wtkImgCont)
      wtkIndex.validateI(formData, wtkImgCont)
      .then((vItem) => {
        vData = vItem
        return wtkIndex.getAlocDataByName(wtkName)
      })
      .then((alocData) => {
        selfDir = alocData.wtkDir
        return wtkIndex.getItemsDataByDir(selfDir)
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
          }
        )
        itemsData._embedded.items.push(halItemsData)



        // return


        const editItemPromiseChain = [
          wtkIndex.addItemsData(itemsData, selfDir)
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
      let validatedFormData
      let itemHref
      let selfDir
      let pathToItemsJson
      let itemsDataObj
      wtkIndex.validateI(data, wtkImgCont)
      .then((data) => {
        validatedFormData=data
        return wtkIndex.getAlocDataByName(wtkName)
      })
      .then((alocData) => {
        selfDir=alocData.wtkDir
        // console.log(alocData)
        return wtkIndex.getItemsDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        console.log('itemsData',itemsData)
        itemHref=`${wtkName}/items/${wtkID}`
        pathToItemsJson=`${selfDir}`

        itemsDataObj={
          wtkID:wtkID,
          wtkType:"",
          wtkCont:"",
          wtkPosition:"",
          wtkVisible:"",
          wtkName:"",
          wtkWidth:"",
          wtkHeight:"",
          wtkInsertDate:"",
          wtkEditDate:new Date(),
        }

        let editTinyMCE=false

        // console.log('editTinyMCE',editTinyMCE)
        let itemsDataItem=wtkIndex.getItemsDataByID(itemHref, itemsData)
        let itemType=itemsDataItem.data.find((data) => {
          return data.name=="wtkType"
        })
        
        console.log(itemsDataItem)
        console.log(itemsDataObj)
        itemsDataItem.data.forEach((val, key) => {
          itemsDataObj[val.name]=val.value
        })
        validatedFormData.forEach((val, key) => {
          if (val.name=="wtkType" && val.value=="text") { editTinyMCE=true }
          itemsDataObj[val.name]=val.value
        })

        console.log('validatedFormData',validatedFormData)
        console.log('itemsDataObj',itemsDataObj)
        if (!editTinyMCE && itemType.value=="text") {
          let itemsDataItem = itemsData.collection.items.find((valI) => {
            return valI.href==itemHref
          })
          // console.log('itemsDataItem',itemsDataItem)
          let wtkContFromItemsData = itemsDataItem.data.find((val) => {
            return val.name=="wtkCont"
          })
          itemsDataObj.wtkCont=wtkContFromItemsData.value
        }

        console.log(itemsDataObj)
        let editedMetaItem=wtkIndex.editItem(itemsData, itemHref, validatedFormData)

        let editedItemsData=wtkIndex.addItemsData(editedMetaItem, pathToItemsJson)

        let wtkCont
        if (itemType.value=="img") {
          wtkCont = new Promise((resolve, reject) => {
            resolve('null')
          });
          // wtkCont=wtkIndex.addImgItem(wtkImgCont, selfDir.href, itemsDataObj.wtkID)
        }
        else{
          wtkCont=wtkIndex.addTextItem(itemsDataObj, pathToItemsJson)
        }

        return Promise.all([editedItemsData, wtkCont])
        // return wtkIndex.addItemsData(editedItemsData, editedItemsData.collection.href)
      })
      .then((editedItemsData) => {
        console.log('here')
        console.log(editedItemsData)
        let cj=wtkIndex.getVisibleItems(editedItemsData[0])
        console.log(itemHref)
        resolve(itemHref)
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
      let pathToItemsJson
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        // return wtkIndex.getTextItemByID(alocData.wtkDir, wtkID)
        selfDir=alocData.wtkDir
        console.log(alocData)
        return wtkIndex.getItemsDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        itemHref=`${wtkName}/items/${wtkID}`
        pathToItemsJson=`${selfDir}`

        let editedItemsData=wtkIndex.editItem(itemsData, itemHref, [{name:"wtkVisible", value:false}])
        console.log('editedMetaData',editedItemsData)
        return wtkIndex.addItemsData(editedItemsData, pathToItemsJson)
      })
      .then((editedItemsData) => {
        let cj=wtkIndex.getVisibleItems(editedItemsData)
        resolve(cj)
      })
      .catch((err) => {
        console.log(err)
        reject(err)
        //...
      });
    });
  },

  getItemsDataByName:function (name, sort) {
    return new Promise((resolve, reject) => {
      wtkIndex.getAlocDataByName(name)
      .then((alocData) => {
        return wtkIndex.getItemsDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        itemsData["_embedded"].items = wtkIndex.getVisibleItems(itemsData)
        // TODO: visit sort
        if (sort) {
          let sortedItemsData = wtkIndex.sortItemsData(itemsData)
          console.log(sortedItemsData);
          // visibleItemsData.collection.items=sortedItemsData
        }
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
      console.log('hns');
      wtkIndex.getAlocDataByName(name)
      .then((alocData) => {
        
        return wtkIndex.getMetaDataByDir(alocData.wtkDir)
      })
      .then((metaData) => {
        
        console.log(metaData);
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
  getItemsDataByID:function (wtkName, wtkID){
    return new Promise((resolve, reject) => {
      
      let itemHref=wtkName+"/items/"+wtkID
      console.log('getMetaDataByID')
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        console.log(alocData)
        return wtkIndex.getItemsDataByDir(alocData.wtkDir)
      })
      .then((itemsData) => {
        console.log(itemsData)
        return wtkIndex.getItemsDataByID(itemHref, itemsData)
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
      let wtkTypeCont=true
      let cj={}
      wtkIndex.getAlocDataByName(wtkName)
      .then((alocData) => {
        console.log(alocData)

        if (alocData.wtkType=="content") {
          return wtkIndex.getMetaDataByDir(alocData.wtkDir)
        }
        else{
          wtkTypeCont=false
          return wtkIndex.getItemsDataByDir(alocData.wtkDir)
        }
      })
      .then((metaData) => {
        cj=metaData
        if (wtkTypeCont) {
          return searchContent(metaData)
        }
        else {
          return searchGroup(metaData)
        }
      })
      .then((pushThis) => {
        // cj.collection.items=pushThis
        console.log('pushThis', pushThis)
        return resolve(pushThis)
      })
      .catch((err) => {
        console.log(err)
        return reject(err)
      });
    });
     function searchGroup(metaDataGroup){

      return new Promise((resolve, reject) => {
        // let searchedItems=[]
        let searchAll=[]
        let searchAllCont=[]
        metaDataGroup.collection.items.forEach((valC, key) => {
          searchAll.push(new Promise((resolve, reject) => {
            wtkIndex.getAlocDataByName(valC.href)
            .then((alocData) => {
              return wtkIndex.getMetaDataByDir(alocData.wtkDir)
            })
            .then((metaData) => {
              return searchContent(metaData)
            })
            .then((data) => {
              console.log('data<-', data)
              // console.log('data<-', data)
              return resolve(data)
            })
            .catch((err) => {
              console.log('errg',err)

              return reject(err)
            });
          })) // search all
          // console.log('end each')
        }) // each items


        return Promise.all(searchAll)
        .then((searchedItems) => {
          console.log('cont')
          console.log(searchedItems)
          while (searchedItems.indexOf(null) !== -1) {  
            searchedItems.splice(searchedItems.indexOf(null),1)
          }
          if (searchedItems.length==0) { return resolve(null)}
          return resolve([].concat.apply([], searchedItems))
          // return resolve(searchedItems)
        })
        .catch((err) => {
          return reject(err)
        });
      }); //promise
    }
    function searchContent(metaData){
      return new Promise((resolve, reject) => {
        let searchedItems=[]
        let found=false
        let searchAll=[]
        // console.log(metaData)
        options.forEach((val, key) => {
          if (val=="wtkCont") {
            searchAll.push(searchContentItems(metaData.collection.href, val, metaData))  
          }
          else{
            searchAll.push(searchContentMeta(metaData, val))
          }
        })
        return Promise.all(searchAll)
        .then((searchedItems) => {
          // console.log('searchedItems',searchedItems)
          while (searchedItems.indexOf(null) !== -1) {  
            searchedItems.splice(searchedItems.indexOf(null),1)
          }
          searchedItems=[].concat.apply([], searchedItems)
          // console.log('searchedItems ------')
          // console.log(searchedItems)
          if (searchedItems.length==0) { return resolve(null)}
          return resolve([searchedItems[0]])

        })
        .catch((err) => {
          console.log('errc',err)
          return reject(err)
        });


      //   metaData.collection.items.find((val, key) => {
      //     options.forEach((valOpt, keyOpt) => {
      //       // console.log(val.href)
      //       // console.log(val.data)

      //       if (val.href.replace('/','')==valOpt) {
      //         if (found) { return }
      //         if (val.data[2].value.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
      //           found=true
      //           return searchedItems.push(metaData)
      //         }
      //       }
      //     })
      //   })
      //   return resolve(searchedItems)

      });
    }
    
    function searchContentMeta(metaData, valOpt){
      return new Promise((resolve, reject) => {
        // console.log('--------------------------')
        // console.log('--------------------------')
        // console.log(metaData)
        let item=metaData.collection.items.find((val, key) => {
          // console.log('///////////////////////')
          // console.log(val)
          // console.log(valOpt)
          // console.log(val.data[2].value)
          // console.log(query)
          // // console.log(String(val.data[2].value).toLowerCase())
          // console.log(String(val.data[2].value).toLowerCase().indexOf(String(query).toLowerCase()))
          if (val.href==valOpt+'/' && String(val.data[2].value).toLowerCase().indexOf(String(query).toLowerCase()) !== -1) {
        // console.log('--------------------------')
            // console.log('this')
            return true
          }
        });
        // console.log('___---___')
        // console.log(item)
        if (item==undefined ) { return resolve(null) }
          let wtkMetaName=metaData.collection.href.split('/')
        metaData.collection.items.push({
          href:"wtkGroupName/",
          data:[
            {name: "wtkMetaAttr", value: "wtkGroupName", prompt: ""},
            {name: "wtkMetaAttrName", value: "wtkGroupName", prompt: "name"},
            {name: "wtkMetaValue", value: wtkMetaName[0], prompt: "value"}
          ]
        })
        return resolve(metaData)
      });
    }
    function searchContentItems(href, valOpt, metaData){
      return new Promise((resolve, reject) => {
        // href=href.split('/')
        // console.log(href[href.length-1])
        console.log('href',href)
        wtkIndex.getAlocDataByName(href)
        .then((alocData) => {
          // console.log('alocData')
          // console.log(alocData)
          return wtkIndex.getItemsDataByDir(alocData.wtkDir)
        })
        .then((itemsData) => {
          // console.log('itemsData')
          // console.log(itemsData)
          let l=itemsData.collection.items.find((val) => {
            // console.log('val',val)
            let dataItem=val.data.find((data) => {
              return data.name=="wtkCont"
            }).value
            // console.log('dataItem',dataItem)
            return String(dataItem).toLowerCase().indexOf(String(query).toLowerCase()) !== -1
          })
          // console.log('l',l)
          return l
          // return searchContentMeta(itemsData, valOpt)
        })
        .then((data) => {
          // console.log('data')
          // console.log(data)
          // let d=data.data.find((data) => {
          //   return data.name=="wtkCont"
          // })
          // d.name="wtkMetaCont"

          /*metaData.collection.items.push({
            href:"wtkCont/",
            data:[{name:"wtkMetaValue", value:d.value}]
          })*/
          // console.log('metaData',metaData.collection.items)
          if (data==undefined) { return resolve(null) }
          return resolve(metaData)
        })
        .catch((err) => {
          console.log('erri',err)
          return reject(err)
        });
      });
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