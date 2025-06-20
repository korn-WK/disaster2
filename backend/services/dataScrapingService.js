const axios = require('axios');
const DisasterReport = require('../models/DisasterReport');
const { upsertDisasterReportsToVectorStore } = require('./vectorStoreService');

// Google News RSS Feed - เน้นข้อมูลการแจ้งเหตุและรายงานสถานการณ์
async function searchGoogleNewsRSS(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=th&gl=TH&ceid=TH:th`;
    
    const response = await axios.get(url, {
      timeout: 10000, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const text = response.data;
    const articles = [];
    
    const titleMatches = text.match(/<title>(.*?)<\/title>/g);
    const linkMatches = text.match(/<link>(.*?)<\/link>/g);
    const pubDateMatches = text.match(/<pubDate>(.*?)<\/pubDate>/g);
    
    if (titleMatches && linkMatches) {
      for (let i = 1; i < Math.min(titleMatches.length, 20); i++) { // เพิ่มเป็น 8 รายการ
        const title = titleMatches[i].replace(/<\/?title>/g, '').trim();
        const link = linkMatches[i].replace(/<\/?link>/g, '').trim();
        const pubDate = pubDateMatches ? pubDateMatches[i]?.replace(/<\/?pubDate>/g, '').trim() : new Date().toISOString();
        
        // ตรวจสอบว่าเป็นข้อมูลการแจ้งเหตุหรือรายงานสถานการณ์น้ำท่วมในเชียงรายหรือไม่
        const isEmergencyReport = (
          title.toLowerCase().includes('น้ำท่วม') && 
          title.toLowerCase().includes('เชียงราย') &&
          (
            title.toLowerCase().includes('แจ้งเหตุ') ||
            title.toLowerCase().includes('รายงาน') ||
            title.toLowerCase().includes('สถานการณ์') ||
            title.toLowerCase().includes('ประกาศ') ||
            title.toLowerCase().includes('เตือนภัย') ||
            title.toLowerCase().includes('อพยพ') ||
            title.toLowerCase().includes('ช่วยเหลือ') ||
            title.toLowerCase().includes('เสียหาย') ||
            title.toLowerCase().includes('ผู้ประสบภัย') ||
            title.toLowerCase().includes('น้ำป่า') ||
            title.toLowerCase().includes('น้ำหลาก') ||
            title.toLowerCase().includes('ถนนถูกตัด') ||
            title.toLowerCase().includes('สะพาน') ||
            title.toLowerCase().includes('ไฟฟ้า') ||
            title.toLowerCase().includes('โทรศัพท์') ||
            title.toLowerCase().includes('โรงเรียน') ||
            title.toLowerCase().includes('โรงพยาบาล') ||
            title.toLowerCase().includes('ตลาด') ||
            title.toLowerCase().includes('หมู่บ้าน') ||
            title.toLowerCase().includes('ชุมชน')
          )
        );
        
        if (isEmergencyReport) {
          articles.push({
            title,
            link,
            pubDate,
            description: title 
          });
        }
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Google News RSS Error:', error.message);
    return [];
  }
}

// ฟังก์ชันวิเคราะห์ข้อความด้วย AI - เน้นข้อมูลการแจ้งเหตุและสถานการณ์
async function analyzeDescriptionWithOllama(description) {
  const prompt = `วิเคราะห์รายงานสถานการณ์: "${description}"
  ตอบเป็น JSON เท่านั้น:
  {
    "disasterType": "flood" หรือ "other",
    "location": "ชื่อสถานที่ในเชียงราย" หรือ "ไม่ใช่เชียงราย",
    "severityLevel": "low" (เล็กน้อย) หรือ "medium" (ปานกลาง) หรือ "high" (รุนแรง),
    "severityReasoning": "เหตุผลการประเมินความรุนแรง"
  }
  
  เกณฑ์การประเมิน:
  - low: น้ำท่วมเล็กน้อย ไม่มีผู้ประสบภัย
  - medium: น้ำท่วมปานกลาง มีผู้ประสบภัยหรือเสียหาย
  - high: น้ำท่วมรุนแรง มีผู้เสียชีวิตหรือเสียหายมาก`;

  try {
    const response = await axios.post('http://localhost:11434/v1/chat/completions', {
      model: 'gemma3',
      messages: [
        { 
          role: 'system', 
          content: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์รายงานสถานการณ์น้ำท่วมในเชียงราย 
          เน้นวิเคราะห์ข้อมูลการแจ้งเหตุ รายงานสถานการณ์ และการช่วยเหลือผู้ประสบภัย
          ตอบเป็น JSON เท่านั้น` 
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 250, 
    }, {
      timeout: 15000 
    });

    const data = response.data;
    const aiReply = data.choices?.[0]?.message?.content;

    const jsonMatch = aiReply.match(/```json([\s\S]*?)```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : aiReply.trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    return null;
  }
}

// ฟังก์ชันหลักสำหรับกวาดข้อมูลการแจ้งเหตุและรายงานสถานการณ์น้ำท่วม
async function scrapeDisasterData() {
  const searchQueries = [
    'แจ้งเหตุ น้ำท่วม เชียงราย',
    'รายงานสถานการณ์ น้ำท่วม เชียงราย',
    'ประกาศเตือนภัย น้ำท่วม เชียงราย',
    'อพยพ น้ำท่วม เชียงราย',
    'ช่วยเหลือ ผู้ประสบภัย น้ำท่วม เชียงราย',
    'น้ำป่าไหลหลาก เชียงราย',
    'ถนนถูกตัด น้ำท่วม เชียงราย',
    'ไฟฟ้าขัดข้อง น้ำท่วม เชียงราย'
  ];

  const results = [];
  const processedTitles = new Set(); 

  console.log('🚨 เริ่มการกวาดข้อมูลการแจ้งเหตุและรายงานสถานการณ์น้ำท่วม...');

  for (const query of searchQueries) {
    try {
      console.log(`🔍 กำลังค้นหา: ${query}`);
      const articles = await searchGoogleNewsRSS(query);
      
      for (const article of articles) {
        // ตรวจสอบข้อมูลซ้ำ
        if (processedTitles.has(article.title)) {
          continue;
        }
        processedTitles.add(article.title);
        
        console.log(`📊 กำลังวิเคราะห์: ${article.title.substring(0, 50)}...`);
        const analysis = await analyzeDescriptionWithOllama(article.description);
        
        // ตรวจสอบว่าเป็นเรื่องน้ำท่วมในเชียงรายหรือไม่
        if (analysis && analysis.disasterType === 'flood' && 
            analysis.location && analysis.location.toLowerCase().includes('เชียงราย')) {
          
          const newReport = new DisasterReport({
            disasterType: 'flood',
            location: analysis.location || 'เชียงราย',
            severityLevel: analysis.severityLevel || 'medium',
            severityReasoning: analysis.severityReasoning || 'รายงานสถานการณ์น้ำท่วม',
            description: `[รายงานสถานการณ์] ${article.description}`,
            source: article.link,
            locationCoordinates: { lat: 19.9061, lng: 99.8305 }, // พิกัดเชียงราย
            reportedAt: new Date(article.pubDate)
          });

          await newReport.save();
          await upsertDisasterReportsToVectorStore([newReport]);
          results.push(newReport);
          console.log(`✅ บันทึกข้อมูล: ${article.title.substring(0, 30)}...`);
        }
      }
    } catch (error) {
      console.error(`❌ Error scraping for query "${query}":`, error);
    }
  }

  console.log(`🎯 กวาดข้อมูลการแจ้งเหตุเสร็จสิ้น: ${results.length} รายการ`);
  return results;
}

// ฟังก์ชันสำหรับดึงข้อมูลการแจ้งเหตุที่กวาดมาแล้ว
async function getScrapedReports(filters = {}) {
  const query = {
    disasterType: { $regex: /น้ำท่วม|flood/i },
    location: { $regex: /เชียงราย|chiang rai/i }
  };
  
  if (filters.severityLevel) query.severityLevel = filters.severityLevel;

  return await DisasterReport.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 50);
}

// ฟังก์ชันสำหรับลบข้อมูลการแจ้งเหตุเก่า
async function cleanupOldScrapedData(daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await DisasterReport.deleteMany({
    disasterType: { $regex: /น้ำท่วม|flood/i },
    location: { $regex: /เชียงราย|chiang rai/i },
    createdAt: { $lt: cutoffDate }
  });
}

// ฟังก์ชันสำหรับตรวจสอบข้อมูลซ้ำ
async function checkDuplicateData(description) {
  const existingReport = await DisasterReport.findOne({
    description: description
  });
  
  return existingReport !== null;
}

module.exports = {
  scrapeDisasterData,
  getScrapedReports,
  cleanupOldScrapedData,
  checkDuplicateData,
  searchGoogleNewsRSS,
  analyzeDescriptionWithOllama
}; 