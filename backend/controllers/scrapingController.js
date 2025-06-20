const { 
  scrapeDisasterData, 
  getScrapedReports, 
  cleanupOldScrapedData,
  checkDuplicateData,
  searchGoogleNewsRSS
} = require('../services/dataScrapingService');
const DisasterReport = require('../models/DisasterReport');

// ฟังก์ชันทดสอบการเชื่อมต่อ Google News RSS
const testGoogleNewsConnection = async () => {
  try {
    const testQuery = 'น้ำท่วม เชียงราย';
    const articles = await searchGoogleNewsRSS(testQuery);
    return articles.length > 0 ? 'active' : 'inactive';
  } catch (error) {
    console.error('Google News RSS connection test failed:', error);
    return 'inactive';
  }
};

// เริ่มการกวาดข้อมูลการแจ้งเหตุน้ำท่วม
const startScraping = async (req, res) => {
  try {
    console.log('🚨 เริ่มการกวาดข้อมูลการแจ้งเหตุน้ำท่วมเชียงราย...');
    
    const results = await scrapeDisasterData();
    
    console.log(`✅ กวาดข้อมูลการแจ้งเหตุเสร็จสิ้น: ${results.length} รายการ`);
    
    res.json({
      success: true,
      message: `กวาดข้อมูลการแจ้งเหตุเสร็จสิ้น: ${results.length} รายการ`,
      data: results
    });
  } catch (error) {
    console.error('❌ Error in startScraping:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการกวาดข้อมูลการแจ้งเหตุ',
      error: error.message
    });
  }
};

// ดึงข้อมูลการแจ้งเหตุที่กวาดมาแล้ว
const getScrapedData = async (req, res) => {
  try {
    const { limit = 50, severityLevel } = req.query;
    const filters = { limit: parseInt(limit) };
    
    if (severityLevel) {
      filters.severityLevel = severityLevel;
    }
    
    const reports = await getScrapedReports(filters);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error getting scraped data:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเหตุ',
      error: error.message
    });
  }
};

// ดึงสถานะการกวาดข้อมูล
const getScrapingStatus = async (req, res) => {
  try {
    // ทดสอบการเชื่อมต่อ Google News RSS
    const googleApiStatus = await testGoogleNewsConnection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayScrapedCount = await DisasterReport.countDocuments({
      disasterType: { $regex: /น้ำท่วม|flood/i },
      location: { $regex: /เชียงราย|chiang rai/i },
      createdAt: { $gte: today }
    });
    
    // นับข้อมูลการแจ้งเหตุทั้งหมด
    const totalScrapedCount = await DisasterReport.countDocuments({
      disasterType: { $regex: /น้ำท่วม|flood/i },
      location: { $regex: /เชียงราย|chiang rai/i }
    });
    
    res.json({
      success: true,
      data: {
        googleApi: googleApiStatus,
        todayScrapedCount,
        totalScrapedCount
      }
    });
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถานะการกวาดข้อมูล',
      error: error.message
    });
  }
};

// ลบข้อมูลการแจ้งเหตุเก่า
const cleanupData = async (req, res) => {
  try {
    const { daysOld = 7 } = req.body;
    
    const result = await cleanupOldScrapedData(daysOld);
    
    res.json({
      success: true,
      message: `ลบข้อมูลการแจ้งเหตุเก่าแล้ว: ${result.deletedCount} รายการ`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up data:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบข้อมูลการแจ้งเหตุ',
      error: error.message
    });
  }
};

// ลบข้อมูลการแจ้งเหตุที่เลือก
const deleteSelectedData = async (req, res) => {
  try {
    const { itemIds } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุรายการที่ต้องการลบ'
      });
    }
    
    const result = await DisasterReport.deleteMany({
      _id: { $in: itemIds },
      disasterType: { $regex: /น้ำท่วม|flood/i },
      location: { $regex: /เชียงราย|chiang rai/i }
    });
    
    res.json({
      success: true,
      message: `ลบข้อมูลการแจ้งเหตุที่เลือกแล้ว: ${result.deletedCount} รายการ`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting selected data:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบข้อมูลการแจ้งเหตุที่เลือก',
      error: error.message
    });
  }
};

module.exports = {
  startScraping,
  getScrapedData,
  getScrapingStatus,
  cleanupData,
  deleteSelectedData
}; 