const express = require('express');
const { getUnseenCount, markNotificationsAsSeen, getAllNotifications } = require('../controller/Notification');
const { verifyToken } = require('../middleware/auth'); 
const router = express.Router();

router.get('/unseen-count', verifyToken, getUnseenCount);
router.post('/mark-as-seen', verifyToken, markNotificationsAsSeen);
router.get('/', verifyToken, getAllNotifications); 

module.exports = router;