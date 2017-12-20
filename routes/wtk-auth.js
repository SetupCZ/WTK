'use strict';
const express = require('express');
const path = require('path');
const xss = require('xss');
const multer  = require('multer')
const wtk = require('../wtk/wtk-ctrl.js');
const wtkIndex = require('../wtk/wtk-index.js');
const serverSettings = require('../wtk/serverSettings.json');
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
const router = express.Router();

//////////////////////////
// admin
router.put('/user', function(req, res, next) {
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

//////////////////////////
// groups
// new group
router.post('/groups', function(req, res, next) {
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
router.put('/groups/:name', function(req, res, next) {
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
router.delete('/groups/:name', function (req, res, next) {
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
router.post('/groups/:name/contents', upload.single('img'), function(req, res, next) {
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
router.put('/groups/:name/contents/:contName', upload.single('img'), function(req, res, next) {

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
router.delete('/groups/:name/contents/:contName', function(req, res, next) {
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
router.post('/groups/:name/contents/:contName/items',upload.single('img'), function(req, res, next) {
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
router.put('/groups/:name/contents/:contName/items/:id', upload.single('img'), function(req, res, next) {
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
router.delete('/groups/:name/contents/:contName/items/:id', function(req, res, next) {
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
router.post('/contents', upload.single('img'), function(req, res, next) {
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
router.put('/contents/:name', upload.single('img'), function(req, res, next) {
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

router.delete('/contents/:name', function(req, res, next) {
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
router.post('/contents/:name/items',upload.single('img'), function(req, res, next) {
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
router.put('/contents/:name/items/:id', upload.single('img'), function(req, res, next) {
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
router.delete('/contents/:name/items/:id', function(req, res, next) {
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