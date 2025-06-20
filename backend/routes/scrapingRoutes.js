const express = require('express');
const router = express.Router();
const { 
  startScraping, 
  getScrapedData, 
  getScrapingStatus, 
  cleanupData,
  deleteSelectedData
} = require('../controllers/scrapingController');

// เริ่มการกวาดข้อมูลการแจ้งเหตุน้ำท่วม
router.post('/start', startScraping);

// ดึงข้อมูลการแจ้งเหตุที่กวาดมาแล้ว
router.get('/data', getScrapedData);

// ดึงสถานะการกวาดข้อมูล
router.get('/status', getScrapingStatus);

// ลบข้อมูลการแจ้งเหตุเก่า
router.delete('/cleanup', cleanupData);

// ลบข้อมูลการแจ้งเหตุที่เลือก
router.delete('/delete-selected', deleteSelectedData);

module.exports = router; 