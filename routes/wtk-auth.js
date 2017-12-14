'use strict';
const express = require('express');
const serverSettings = require('../wtk/serverSettings.json');
const wtk = require('../wtk/wtk-ctrl.js');
const wtkIndex = require('../wtk/wtk-index.js');
const path = require('path');
const imgDestination = path.resolve(__dirname, serverSettings.galeryPath)
const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path1=path.resolve(__dirname, serverSettings.galeryPath)
    // console.log('file destination', path1)
    cb(null, path1)
  },
  filename: function (req, file, cb) {
    // console.log(file);
    let fileExt=file.mimetype.split('/')
        fileExt=fileExt[1]
    let fileName=new Date().getTime()
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })
const router = express.Router();

// vanila
// admin

router.put('/user', function(req, res, next) {
  let user=req.user
  let data=req.body
  wtk.editUser(data, user)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// groups
// new group
router.post('/groups', function(req, res, next) {
  const data = req.body
  wtk.addGroups(data)
  .then((data) => {
    if (data==204) { return res.status(204).send() }
    return res.status(200).send(data)
  })
  .catch((err) => {
    return res.status(400).send(err)
  });
});
// edit group
router.put('/groups/:name', function(req, res, next) {
  let data=req.body
  let name=req.params.name
  console.log('***************************************')
  console.log('***************************************')
  console.log('***************************************')
  wtkIndex.validateG(data).then((data) => {
    console.log('validatedG Data: ')
    console.log(data)
  })
  .catch((err) => {
    console.log("err",err)
  });
  
  // return
  // validate name 
  wtk.editGroup(name, data)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// new content in group
router.post('/groups/:name/contents', function(req, res, next) {
  let data=req.body
  let name=req.params.name
  // validate name
  

  wtk.addContentToGroup(name, data.location)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// edit content in group
router.put('/groups/:name/contents/:contName', upload.single('img'), function(req, res, next) {

 

  // let data=req.body
  let name=req.params.name
  let contName=req.params.contName

  let img=req.file
  // console.log(img)
  let data=req.body
      data=JSON.parse(data.bodyData)


      console.log('***************************************')
      console.log('***************************************')
      console.log('***************************************')
      wtkIndex.validateC(data, img).then((data) => {
        console.log('validatedC Data: ')
        console.log(data)
      })
      .catch((err) => {
        console.log("err",err)
      });
      
      return
  if (img) return res.status(200).send({ wtkMetaThumbnail: `${imgDestination}/${img.originalname}` })
  
  // return 
  // validate name 
  wtk.editContent(name+'/contents/'+contName, data, img)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// drop content
router.delete('/groups/:name/contents/:contName', function(req, res, next) {
  let data=req.body
  let name=req.params.name
  let contName=req.params.contName
  // validate name 
  wtk.dropContent(name+'/contents/'+contName)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});

// new item
router.post('/groups/:name/contents/:contName/items',upload.single('img'), function(req, res, next) {
  console.log('------------------------------------------')

  let data=req.body
  let img=req.file
  let name=req.params.name
  let contName=req.params.contName
  // validate name
  console.log(req.hmultiparteaders)
  console.log('img',img) 
  console.log('data',data) 
  if (data.bodyData) { data=JSON.parse(data.bodyData) }
  console.log(data[0])

  // let dirty = 'some really tacky HTML';
  // let clean = sanitizeHtml(dirty);

  console.log('***************************************')
  console.log('***************************************')
  console.log('***************************************')
  wtkIndex.validateI(data, img).then((data) => {
    console.log('validatedI Data: ')
    console.log(data)
  })
  .catch((err) => {
    console.log("err",err)
  });
  
  return

  // return res.status(200).send(data)
  wtk.addItem(name+'/contents/'+contName, data, img)
  .then((data) => {
    console.log(data)
    res.location(data)
    return res.status(201).send()
  })
  .catch((err) => {
    if (err==null) { console.log('___________________null_________________')}
    if (err==null) { return res.status(204).send(data) }
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
  // validate name 
  console.log('edit item')
  console.log(img)
  console.log(data)
  console.log(typeof data)
  if (data.bodyData) { data=JSON.parse(data.bodyData) }
  console.log(typeof data)
  // if (img) { data=JSON.parse(data.bodyData) }

  console.log('***************************************')
  console.log('***************************************')
  console.log('***************************************')
  wtkIndex.validateI(data, img).then((data) => {
    console.log('validatedI Data: ')
    console.log(data)
  })
  .catch((err) => {
    console.log("err",err)
  });

  return
  wtk.editItem(name+'/contents/'+contName, id, data, img)
  .then((data) => {
    res.location(data)
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
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
  .then((data) => {
    console.log(data)
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});

// new content
router.post('/contents', upload.single('img'), function(req, res, next) {
  let img=req.file
  let data=req.body
  if (img) return res.status(200).send({wtkMetaThumbnail:`${imgDestination}/${img.originalname}`})
  wtk.addContent(data, img)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err);
    if (err==null) { return res.status(204).send(data) }
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
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// drop content
router.delete('/contents/:name', function(req, res, next) {
  let data=req.body
  let name=req.params.name
  // validate name 
  wtk.dropContent(name)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// dodelat

// new item
router.post('/contents/:name/items',upload.single('img'), function(req, res, next) {
  console.log('------------------------------------------')

  let data=req.body
  let img=req.file
  let name=req.params.name
  // validate name
  console.log(req.hmultiparteaders)
  console.log('img',img) 
  console.log('data',data) 
  if (data.bodyData!=undefined) { data=JSON.parse(data.bodyData) }
  console.log(data[0])

  // let dirty = 'some really tacky HTML';
  // let clean = sanitizeHtml(dirty);
  // return 

  // return res.status(200).send(data)
  wtk.addItem(name, data, img)
  .then((data) => {
    console.log(data)
    res.location(data)
    return res.status(201).send()
  })
  .catch((err) => {
    if (err==null) { console.log('___________________null_________________')}
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// edit item
router.put('/contents/:name/items/:id', upload.single('img'), function(req, res, next) {
  let data=req.body
  let img=req.file
  let name=req.params.name
  let id=req.params.id
  // validate name 
  console.log('edit item')
  console.log(img)
  console.log(data)
  if (data.bodyData!=undefined) { data=JSON.parse(data.bodyData) }
  console.log(data)
  // return
  wtk.editItem(name, id, data, img)
  .then((data) => {
    res.location(data)
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});
// drop item
router.delete('/contents/:name/items/:id', function(req, res, next) {
  let name=req.params.name
  let id=req.params.id
  // validate name 
  wtk.dropItem(name, id)
  .then((data) => {
    console.log(data)
    return res.status(200).send(data)
  })
  .catch((err) => {
    console.log(err)
    if (err==null) { return res.status(204).send(data) }
    return res.status(400).send(err)
  });
});

module.exports = router;