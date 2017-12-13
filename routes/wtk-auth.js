'use strict';
let express = require('express');
let serverSettings = require('../wtk/serverSettings.json');
let wtk = require('../wtk/wtk-ctrl.js');
let wtkIndex = require('../wtk/wtk-index.js');
let path = require('path');
let imgDestination = path.resolve(__dirname, serverSettings.galeryPath)
let multer  = require('multer')
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let path1=path.resolve(__dirname, serverSettings.galeryPath)
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
let upload = multer({ storage: storage })
// let multiparty = require('connect-multiparty');
// let multipartyMiddleware = multiparty();
let router = express.Router();
// router.post('/saveNewCont', function(req, res, next) {
//   let wtkData=req.body.wtkData;
//   let wtkThumbnail=req.body.wtkData.wtkThumbnail;
//   let wtkCont="";
//   async.series({
//     getAlocData: function(callback){
//       wtk.getAlocData(callback);
//     }
//   },
//   function(err, results) {
//     if (err) { return res.send(400, err) };
//     let getAlocData=results.getAlocData;
//     console.log('getAlocData',getAlocData)
//     if (getAlocData.alocData.length==0) { let lastID=0 }
//     else{ let lastID=_.last(_.sortBy(getAlocData.alocData, 'wtkID')).wtkID+1 };
//     async.series({
//       addNewDir: function(callback){
//         //callback(null)
//         wtk.addNewDir(callback, wtkData.wtkDir, lastID);
//       }
//     },
//     function(err, results) {
//       if (err) { return res.send(400, err) };
//       async.parallel({
//         addNewContJson: function(callback){
//           //callback(null)
//           wtk.addNewContJson(callback, wtkData, wtkData.wtkDir, lastID);
//         },
//         addNewContHtml: function(callback){
//           //callback(null)
//           wtk.addNewContHtml(callback, wtkCont, wtkData.wtkDir, lastID);
//         },
//       },
//       function(err, results) {
//         console.log('err',err)
//         if (err) { return res.send(400, err) };
//         async.parallel({
//           editAlocData: function(callback){
//             //callback(null)
//             getAlocData.alocData.push({
//               "wtkName":wtkData.wtkName, 
//               "wtkDir":wtkData.wtkDir+"/"+lastID, 
//               "wtkID":lastID, 
//               "wtkGroup":wtkData.wtkGroup
//             });
//             wtk.editAlocData(callback, getAlocData);
//           }
//         },
//         function(err, results) {
//           if (err) { return res.send(400, err) };
//           console.log(results)
//           return res.json(200, results);
//         });
//       });
//     });
//   });
// });

// router.post('/saveCont', function(req, res, next) {
//   let wtkName=req.body.wtkName;
//   let wtkCont=req.body.wtkCont;
//   console.log('------------------name')
//   console.log(wtkCont)
//   async.series({
//     getAlocDataByName: function(callback){
//       wtk.getAlocDataByName(callback, wtkName);
//     }
//   },
//   function(err, results) {
//     if (err) { return res.send(400, err) };
//     let getAlocDataByName=results.getAlocDataByName;
//     if (getAlocDataByName.length==0) { return res.send(400, 'Error: Aloc Data is empty') };
//     async.series({
//       addNewContHtml: function(callback){
//         let dir=getAlocDataByName.wtkDir.split("/")[0];
//         wtk.addNewContHtml(callback, wtkCont, dir, getAlocDataByName.wtkID);
//       },
//     },
//     function(err, results) {
//       if (err) { return res.send(400, err) };
//       return res.send(200, results);
       
//     }); 
//   });
// });
// router.delete('/trashCont', function(req, res, next) {
//   let wtkName=req.body.wtkName;
//   async.series({
//     getAlocData: function(callback){
//       wtk.getAlocData(callback);
//     }
//   },
//   function(err, results) {
//     if (err) { return res.send(400, err) };
//     let alocData=results.getAlocData.alocData;
//     let wtkDir=_.findWhere(alocData, {wtkName:wtkName}).wtkDir;
//     let getAlocData={alocData:_.without(alocData, _.findWhere(alocData, {wtkName:wtkName}))};

//     console.log('newAlocData')
//     console.log(getAlocData)
//     async.series({
//       dropCont: function(callback){
//         wtk.dropCont(callback, wtkDir);
//       },
//       editAlocData: function(callback){
//         //callback(null)
//         wtk.editAlocData(callback, getAlocData);
//       }
//     },
//     function(err, results) {
//       if (err) { return res.send(400, err) };
//       return res.send(200, results);
       
//     }); 
//   });
// });


// vanila
// admin

router.put('/user', function(req, res, next) {
  let user=req.user
  let data=req.body
console.log(user)
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
  let data=req.body
  // validate name 
  // console.log(typeof data)
  // if (true) { data=JSON.parse(data) }
    // console.log(data)
  // return res.status(200).send(data)
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
  console.log('***************************************')
  console.log('***************************************')
  // return
  wtk.addGroups(data)
  .then((data) => {
    return res.status(200).send(data)
  })
  .catch((err) => {
    if (err==null) { return res.status(204).send(data) }
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
      data=JSON.parse(data.bodyData)
      console.log(data)
      // return
  // validate name 
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