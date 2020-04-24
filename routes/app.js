var express = require('express');
var router = express.Router();
var appControllers = require('../controllers/app');


router.get('/getData',appControllers.cache,appControllers.getData);
router.put('/saveData',appControllers.saveData);
router.delete('/deleteData',appControllers.deleteData);
router.post('/updateData',appControllers.updateData);
router.post('/submitJob',appControllers.submitJob);
router.get('/getResult',appControllers.getResult);

module.exports = router;
