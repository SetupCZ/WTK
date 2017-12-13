'use strict';
var express = require('express');
var expressJwt=require('express-jwt');
var jwt=require('jsonwebtoken');
var CryptoJS = require("crypto-js")
var userSettings = require("../wtk/userSettings.json")
var serverSettings = require("../wtk/serverSettings.json")
var wtkIndex = require('../wtk/wtk-index.js');
const { generateTokens, setTokens, getUser } = require('../authentication');

// var async = require('async');
// var _ = require('underscore');
var wtk = require('../wtk/wtk-ctrl.js');
var router = express.Router();
/* GET home page. */


router.get('/wtk-login', function(req, res, next) {
  res.render('wtk-login', { title: 'WTK login' });
});
router.get('/wtk-admin', function(req, res, next) {
  res.render('wtk-admin', { title: 'WTK admin' });
});

router.post('/wtk-login', async function(req, res, next) {
  let data=req.body;
  wtkIndex.validateLogin(data)
  .then(async (validatedData) => {

    let user=userSettings[validatedData.wtkLoginName]
    if (user==undefined) { return res.status(401).send('Wrong user or password.') }
    // let genSalt=CryptoJS.SHA256(CryptoJS.lib.WordArray.random(128/8)).toString(CryptoJS.enc.Hex)

    let userPswd=userSettings[validatedData.wtkLoginName].pswd
    let salt=userSettings[validatedData.wtkLoginName].salt
    let saltedPswd=CryptoJS.PBKDF2(validatedData.wtkLoginPswd, salt).toString(CryptoJS.enc.Hex)

    //if invalid, return 401
    if (saltedPswd !== userPswd) { return res.status(401).send('Wrong user or password.') }

    // let userInfo = {
    //   first_name: 'John',
    //   last_name: 'Doe',
    //   email: validatedData.wtkLoginName,
    //   id_u: 0
    // };
    // let userForWeb={
    //   email:validatedData.wtkLoginName,
    //   secQ1:userSettings[validatedData.wtkLoginName].secQ1,
    //   secQ2:userSettings[validatedData.wtkLoginName].secQ2,
    // }
    // const user = getUser(validatedData.wtkLoginName)

    const refreshSecret = saltedPswd + process.env.SECRET2

    const [accessToken, refreshToken] = await generateTokens(user, process.env.SECRET, refreshSecret)
    setTokens(accessToken, refreshToken, validatedData.wtkLoginName, res)
    //jwtPswd==/wtk/serverSettings.json
    // let token = jwt.sign(userInfo, serverSettings.jwtPswd);
    
    return res.status(200).send()//.send({token: token, userForWeb:userForWeb});
  })
  .catch((err) => {
    console.log(err)
    res.status(400).send(err)
  });
});
router.post('/wtk-forgotPswd', function(req, res, next) {

});

router.get('/getMetaData', function(req, res, next) {
  wtk.getMetaData()
  .then((data) => {
    console.log('-------------------')
    console.log(res.location())
    // res.location()
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});

// get groups
router.get('/groups', function(req, res, next) {
  wtk.getGroups()
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
router.get('/groups/:name', function(req, res, next) {
  let name=req.params.name
  // validate name 
  wtk.getMetaDataByName(name)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// get list of all contents(meta)
router.get('/groups/:name/contents', function(req, res, next) {
  let name=req.params.name
  // validate name 
  console.log(name)

  // wtk.getContents(name)
  wtk.getItemsDataByName(name, false)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// get metadata for content by name
router.get('/groups/:name/contents/:contName', function(req, res, next) {
  let name=req.params.name
  let contName=req.params.contName
  // validate name 
  console.log(name)
  console.log(contName)
  console.log('1')
  wtk.getMetaDataByName(name+'/contents/'+contName)
  .then((data) => {
        console.log(res.location)
    console.log('-------------------')

    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// get list of items from content by name
router.get('/groups/:name/contents/:contName/items', function(req, res, next) {
  let name=req.params.name
  let contName=req.params.contName
  // validate name 
  console.log('2')
  wtk.getItemsDataByName(name+'/contents/'+contName, true)
  .then((data) => {
        console.log(res.location)
    console.log('-------------------')

    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// get items content from content by name and id
router.get('/groups/:name/contents/:contName/items/:id/content', function(req, res, next) {
  let name=req.params.name
  let contName=req.params.contName
  let id=req.params.id
  console.log(name, id)
  // validate name 

  console.log('1')
  wtk.getItem(name+'/contents/'+contName, id)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// get items metadata from content by name and id
router.get('/groups/:name/contents/:contName/items/:id', function(req, res, next) {
  let name=req.params.name
  let contName=req.params.contName
  let id=req.params.id
  console.log(name, id)
  // validate name 

  console.log('1')
  wtk.getItemsDataByID(name+'/contents/'+contName, id)
  .then((data) => {
    console.log('data >>>',data)
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});



// get list of all contents(meta)
router.get('/contents', function(req, res, next) {
  wtk.getContents()
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// get metadata for content by name
router.get('/contents/:name/', function(req, res, next) {
  let name=req.params.name
  // validate name 
  console.log('1')
  wtk.getMetaDataByName(name)
  .then((data) => {
        console.log(res.location)
    console.log('-------------------')

    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// get list of items from content by name
router.get('/contents/:name/items', function(req, res, next) {
  let name=req.params.name
  // validate name 
  console.log('2')
  wtk.getItemsDataByName(name, true)
  .then((data) => {
        console.log(res.location)
    console.log('-------------------')

    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});

// get items content from content by name and id
router.get('/contents/:name/items/:id/content', function(req, res, next) {
  let name=req.params.name
  let id=req.params.id
  console.log(name, id)
  // validate name 

  console.log('1')
  wtk.getItem(name, id)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// get items metadata from content by name and id
router.get('/contents/:name/items/:id', function(req, res, next) {
  let name=req.params.name
  let id=req.params.id
  console.log(name, id)
  // validate name 

  console.log('1')
  wtk.getMetaDataByID(name, id)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});


// /////////////////////////////////////
// search
router.get('/search', function(req, res, next) {
  console.log(req.query.wtkName)
  let wtkName=req.query.wtkName
  let query=req.query.query
  let wtkOpt=req.query.wtkOpt.split(',')
  wtk.searchQuery(wtkName, query, wtkOpt)
  .then((data) => {
    if (data==null) { return res.status(204).send() }

    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});


/*
  router.post('/getAlocDataByGroup', function(req, res, next) {
    var wtkName=req.body.wtkName;
    async.series({
      getAlocGroupData: function(callback){
        wtk.getAlocDataByGroup(callback, wtkName);
      }
    },
    function(err, results) {
      if (err) { return res.send(400, err) };
      return res.send(200, results.getAlocGroupData);
    });
  });
  router.post('/getAlocDataByName', function(req, res, next) {
    var wtkName=req.body.wtkName;
    async.series({
      getAlocData: function(callback){
        wtk.getAlocDataByName(callback, wtkName);
      }
    },
    function(err, results) {
      if (err) { return res.send(400, err) };
      return res.send(200, results.getAlocData);
    });
  });
  router.post('/getDataByName', function(req, res, next) {
    var wtkName=req.body.wtkName;
    async.series({
      getAlocData: function(callback){
        wtk.getAlocData(callback);
      }
    },
    function(err, results) {
      if (err) { return res.send(400, err) };
      var alocData=_.findWhere(results.getAlocData.alocData, {wtkName:wtkName});
      if (alocData==undefined) { return res.send(200, undefined); };  
      async.parallel({
        getDataByDir: function(callback){
          wtk.getContDataByDir(callback, alocData.wtkDir);
        },
        getHtmlByDir: function(callback){
          wtk.getContHtmlByDir(callback, alocData.wtkDir);
        }
      },
      function(err, results) {
        if (err) { return res.send(400, err) };
        var data={
          data:results.getDataByDir,
          html:results.getHtmlByDir
        }
        return res.send(200, data);
      });
    });
  });
*/
module.exports = router;
