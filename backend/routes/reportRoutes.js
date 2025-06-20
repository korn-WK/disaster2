const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const rateLimit = require('express-rate-limit');
const reportLimiter = rateLimit({
  windowMs: 30 * 1000, 
  max: 1, 
  message: { success: false, message: 'คุณส่งรายงานบ่อยเกินไป กรุณารอสักครู่' }
});

router.post('/report', reportLimiter, reportController.createReport);
router.get('/report', reportController.getReports);

module.exports = router;
