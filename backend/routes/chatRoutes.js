const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');


router.get('/:userId', chatController.getChatHistory);
router.post('/chat', chatController.sendMessage);

module.exports = router;
