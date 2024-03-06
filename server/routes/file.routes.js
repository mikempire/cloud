// роуты маршруты
const Router = require('express');
const router = new Router;
const authCheck = require("../utils/authCheck");
const fileController = require("../controllers/fileController");


router.post('', authCheck, fileController.createDir)
router.post('/upload', authCheck, fileController.uploadFile)
router.post('/avatar', authCheck, fileController.uploadAvatar)
router.get('', authCheck, fileController.getFiles)
router.get('/download', authCheck, fileController.downloadFile)
router.get('/search', authCheck, fileController.searchFile)
router.delete('/', authCheck, fileController.deleteFile)
router.delete('/avatar', authCheck, fileController.deleteAvatar)


module.exports = router;

