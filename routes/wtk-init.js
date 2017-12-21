'use strict';
const express = require('express');
const path = require('path');
const expressJwt=require('express-jwt');
const jwt=require('jsonwebtoken');
const CryptoJS = require("crypto-js")
const userSettings = require("../wtk/userSettings.json")
const serverSettings = require("../wtk/serverSettings.json")
const wtkIndex = require('../wtk/wtk-index.js');
const { generateTokens, setTokens, getUser } = require('../authentication');

const wtk = require('../wtk/wtk-ctrl.js');
const router = express.Router();


router.get('/wtk-login', function(req, res, next) {
  res.render('wtk-login', { title: 'WTK Login' });
});
router.get('/wtk-admin', function(req, res, next) {
  res.render('wtk-admin', { title: 'WTK Admin' });
});
router.get('/wtk-reset-password', (req, res, next) => {
  res.sendFile(path.resolve(__dirname, serverSettings.viewsPath,'wtk-reset-password.html'))
})
// TODO: pritiffy
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
// TODO: make this
router.post('/wtk-forgotPswd', function(req, res, next) {
  const data = req.body
  wtk.forgotPswd(data)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err == null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
router.post('/wtk-resetPswd', function (req, res, next) {
  const data = req.body
  wtk.resetPswd(data)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err == null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
router.post('/wtk-newPswd', function (req, res, next) {
  const data = req.body
  console.log(res);
  wtk.newPswd(data, res)
  .then((data) => {
    return res.status(200).send()
  })
  .catch((err) => {
    if (err == null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});

// TODO: remove i gues
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

////////////////////
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
    if (data == 204) { return res.status(204).send() }
    return res.status(200).send(data)
  })
  .catch((err) => {
    return res.status(400).send(err)
  });
});
// get metadata for content by name
router.get('/groups/:name/contents/:contName', function(req, res, next) {
  let name=req.params.name
  let contName=req.params.contName
  // validate name 
  wtk.getMetaDataByName(name+'/contents/'+contName)
  .then((data) => {
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
  wtk.getItemsDataByName(name+'/contents/'+contName, true)
  .then((data) => {
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
  // validate name 

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
// TODO: delete this i gues
router.get('/groups/:name/contents/:contName/items/:id', function(req, res, next) {
  let name=req.params.name
  let contName=req.params.contName
  let id=req.params.id
  // validate name 

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


//////////////////////////
// content
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
  wtk.getMetaDataByName(name)
  .then((data) => {
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
  wtk.getItemsDataByName(name, true)
  .then((data) => {
    if (data == 204) { return res.status(204).send() }
    return res.status(200).send(data)
  })
  .catch((err) => {
    return res.status(400).send(err)
  });
});

// get items content from content by name and id
router.get('/contents/:name/items/:id/content', function(req, res, next) {
  let name=req.params.name
  let id=req.params.id
  // validate name 
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
  // validate name 
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

module.exports = router;
