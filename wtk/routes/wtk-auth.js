'use strict';
const express = require('express');
const path = require('path');
const xss = require('xss');
const multer  = require('multer')
const wtk = require('../wtk-ctrl.js');
const wtkIndex = require('../wtk-index.js');
const serverSettings = require('../serverSettings.json');
const imgDestination = path.resolve(__dirname, serverSettings.galeryPath)

const filterEverything = {
  whitelist: [],
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path1=path.resolve(__dirname, serverSettings.galeryPath)
    // console.log('file destination', path1)
    cb(null, path1)
  },
  filename: function (req, file, cb) {
    const imgNameReg = new RegExp(/^([a-zA-Z0-9])+(\.(jpg|png|JPG|PNG))$/)
    const imgPathReg = new RegExp(/^((?!\.\.\/).)*(\.jpg|png|json|html)$/i)
    file.originalname = xss(file.originalname, filterEverything)
    if (!imgNameReg.test(file.originalname)) 
      return cb("IMG NAME is wrong!")
    cb(null, file.originalname)
  }
})
const upload = multer({ 
  storage: storage, 
  limits: { 
    fileSize: serverSettings.uploadMaxSize
  }
})
const authenticate = async (req, res, next) => {
  const [accessToken, refreshToken] = getTokens(req)
  if (!accessToken) return next()
  try {
    const { user } = jwt.verify(accessToken, process.env.SECRET)
    req.user = user
    console.log('inTokenVerified');

  } catch (err) {
    console.log('inError');
    if (err.name === "TokenExpiredError" && err.message === "jwt expired") {
      console.log('inTokenExpirated');
      const [newAccessToken, newRefreshToken, user] = await refreshTokens(accessToken, refreshToken, process.env.SECRET, process.env.SECRET2)
      if (newAccessToken && newRefreshToken) {
        console.log('inNewTokens');
        setTokens(newAccessToken, newRefreshToken, user.id, res)
        req.user = user
      }
    }
  }
  next()
}
const router = express.Router();
//////////////////////////
// JWT authentication
router.use(authenticate)
//////////////////////////
// admin
router.put('/wtk/auth/user', function(req, res, next) {
  let user=req.user
  let data=req.body
  wtk.editUser(data, user)
  .then((data) => {
    return res.status(201).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
router.post('/wtk/auth/logout', (req, res, next) => {
  console.log('logout');
  const user = req.user
  wtk.logoutUser(user, res)
  .then((data) => {
    console.log(req.cookies.Authorization);

    return res.status(200).send()
  })
  .catch((err) => {
    return res.status(400).send(err)
  })
})

//////////////////////////
// groups
// new group
router.post('/wtk/auth/groups', function(req, res, next) {
  const data = req.body
  wtk.addGroups(data)
  .then((location) => {
    return res.status(201).send(location)
  })
  .catch((err) => {
    return res.status(400).send(err)
  });
});
// edit group
router.put('/wtk/auth/groups/:name', function(req, res, next) {
  let data=req.body
  let name=req.params.name

  // validate name 
  wtk.editGroup(name, data)
  .then((location) => {
    return res.status(200).send(location)
  })
  .catch((err) => {
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// delete group
router.delete('/wtk/auth/groups/:name', function (req, res, next) {
  let name = req.params.name
  wtk.dropGroup(name)
  .then((location) => {
    return res.status(200).send(location)
  })
  .catch((err) => {
    if (err == 204) { return res.status(204).send() }
    return res.status(400).send(err)
  });

});

//////////////////////////
// TODO: edit this
// new content in group
router.post('/wtk/auth/groups/:name/contents', upload.single('img'), function(req, res, next) {
  let data=req.body
  let name=req.params.name
  let img = req.file
  // validate name
  
  if (img) return res.status(201).send({ wtkMetaThumbnail: `${imgDestination}/${img.originalname}` })
  
  wtk.addContentToGroup(name, data.location)
  .then((data) => {
    return res.status(201).send(data)
  })
  .catch((err) => {
    return res.status(400).send(err)
  });
});
// edit content in group
router.put('/wtk/auth/groups/:name/contents/:contName', upload.single('img'), function(req, res, next) {

  // let data=req.body
  let name=req.params.name
  let contName=req.params.contName
  let img=req.file
  let data=req.body

  // console.log(img)

  if (img) return res.status(200).send({ wtkMetaThumbnail: `${imgDestination}/${img.originalname}` })
  
  // return 
  // validate name 
  wtk.editContent(name+'/contents/'+contName, data, img)
  .then((ocation) => {
    return res.status(200).send(ocation)
  })
  .catch((err) => {
    if (err==204) { return res.status(204).send(ata) }
    return res.status(400).send(err)
  });
});
// drop content
router.delete('/wtk/auth/groups/:name/contents/:contName', function(req, res, next) {
  let name=req.params.name
  let contName=req.params.contName
  // validate name 
  wtk.dropContentInGroup(name+'/contents/'+contName, name)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});

//////////////////////////
// new item
router.post('/wtk/auth/groups/:name/contents/:contName/items',upload.single('img'), function(req, res, next) {
  console.log('------------------------------------------')

  let data=req.body
  let img=req.file
  let name=req.params.name
  let contName=req.params.contName

  if (img) return res.status(200).send({ wtkMetaThumbnail: `${imgDestination}/${img.originalname}` })

  wtk.addItem(name+'/contents/'+contName, data, img)
  .then((location) => {
    console.log(data)
    return res.status(201).send(location)
  })
  .catch((err) => {
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// edit item
router.put('/wtk/auth/groups/:name/contents/:contName/items/:id', upload.single('img'), function(req, res, next) {
  let data=req.body
  let img=req.file
  let name=req.params.name
  let contName=req.params.contName
  let id=req.params.id

  if (img) return res.status(200).send({ wtkMetaThumbnail: `${imgDestination}/${img.originalname}` })
  
  
  wtk.editItem(name+'/contents/'+contName, id, data, img)
  .then((location) => {
    return res.status(200).send(location)
  })
  .catch((err) => {
    console.log(err)
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// drop item
router.delete('/wtk/auth/groups/:name/contents/:contName/items/:id', function(req, res, next) {
  let name=req.params.name
  let id=req.params.id
  let contName=req.params.contName
  // validate name 
  wtk.dropItem(name+'/contents/'+contName, id)
  .then((loca) => {
    console.log(loca)
    return res.status(200).send(location)
  })
  .catch((err) => {
    console.log(err)
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});

//////////////////////////
// new content
router.post('/wtk/auth/contents', upload.single('img'), function(req, res, next) {
  let img=req.file
  let data=req.body
  
  if (img) return res.status(201).send({wtkMetaThumbnail:`${imgDestination}/${img.originalname}`})

  wtk.addContent(data, img)
  .then((data) => {
    return res.status(201).send(data)
  })
  .catch((err) => {
    console.log(err);
    return res.status(400).send(err)
  });
});
// edit content
router.put('/wtk/auth/contents/:name', upload.single('img'), function(req, res, next) {
  let name=req.params.name
  let img=req.file
  let data=req.body

  if (img) return res.status(200).send({ wtkMetaThumbnail: `${imgDestination}/${img.originalname}` })
  
  wtk.editContent(name, data, img)
  .then((location) => {
    return res.status(200).send(location)
  })
  .catch((err) => {
    console.log(err)
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// drop content

router.delete('/wtk/auth/contents/:name', function(req, res, next) {
  let name=req.params.name
  // validate name 
  wtk.dropContent(name)
  .then((location) => {
    return res.status(200).send(location)
  })
  .catch((err) => {
    console.log(err)
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});

//////////////////////////
// new item
router.post('/wtk/auth/contents/:name/items',upload.single('img'), function(req, res, next) {
  let data=req.body
  let img=req.file
  let name=req.params.name
  console.log(img);
  
  if (img) return res.status(201).send({ imgContent: `${imgDestination}/${img.originalname}` })
  
  wtk.addItem(name, data, img)
  .then((data) => {
    return res.status(201).send(data)
  })
  .catch((err) => {
    if (err == 204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// edit item
router.put('/wtk/auth/contents/:name/items/:id', upload.single('img'), function(req, res, next) {
  let data=req.body
  let img=req.file
  let name=req.params.name
  let id=req.params.id

  if (img) return res.status(200).send({ imgContent: `${imgDestination}/${img.originalname}` })
  
  wtk.editItem(name, id, data, img)
  .then((location) => {
    return res.status(200).send(location)
  })
  .catch((err) => {
    console.log(err)
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});
// drop item
router.delete('/wtk/auth/contents/:name/items/:id', function(req, res, next) {
  let name=req.params.name
  let id=req.params.id
  // validate name 
  wtk.dropItem(name, id)
  .then((location) => {
    console.log(location)
    return res.status(200).send(location)
  })
  .catch((err) => {
    console.log(err)
    if (err==204) { return res.status(204).send() }
    return res.status(400).send(err)
  });
});

module.exports = router;