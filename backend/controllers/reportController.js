const fetch = require('node-fetch');
const DisasterReport = require('../models/DisasterReport');
const { upsertDisasterReportsToVectorStore } = require('../services/vectorStoreService');

async function analyzeDescriptionWithOllama(description) {
  const prompt = `
    คุณได้รับข้อความแจ้งภัยพิบัติ: "${description}"
    โปรดแยกข้อมูลต่อไปนี้:

    1. ประเภทภัยพิบัติ (disasterType) - เน้นเฉพาะน้ำท่วม:
       - น้ำท่วม (flood) - หากเป็นเรื่องน้ำท่วม
       - อื่นๆ (other) - หากไม่ใช่เรื่องน้ำท่วม

    2. สถานที่เกิดเหตุ (location) - เน้นเฉพาะเชียงราย:
       - หากเป็นพื้นที่ในเชียงราย ให้ระบุชื่อพื้นที่
       - หากไม่ใช่เชียงราย ให้ระบุ "ไม่ใช่เชียงราย"

    3. ระดับความรุนแรง (severityLevel) ให้เลือกจาก:
       - low: น้ำท่วมเล็กน้อย ไม่มีผู้บาดเจ็บ
       - medium: น้ำท่วมปานกลาง อาจมีผู้บาดเจ็บเล็กน้อย
       - high: น้ำท่วมรุนแรง มีผู้บาดเจ็บหรือเสียชีวิต

    4. เหตุผลที่ประเมินระดับความรุนแรง (severityReasoning)

    ตอบกลับเป็น JSON เท่านั้นในรูปแบบนี้:
    {
      "disasterType": "ประเภทภัยพิบัติ",
      "location": "สถานที่เกิดเหตุ",
      "severityLevel": "ระดับความรุนแรง",
      "severityReasoning": "เหตุผลที่ประเมินระดับความรุนแรง"
    }

    หมายเหตุ: เน้นวิเคราะห์เฉพาะเรื่องน้ำท่วมในเชียงราย หากไม่ใช่ให้เลือก "other"
    `;

  try {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3',
        messages: [
          { 
            role: 'system', 
            content: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์ข้อมูลน้ำท่วมในเชียงราย
            คุณต้องวิเคราะห์เฉพาะเรื่องน้ำท่วมในเชียงรายเท่านั้น
            หากไม่ใช่เรื่องน้ำท่วมในเชียงราย ให้เลือก "other"
            คุณต้องวิเคราะห์ระดับความรุนแรงโดยพิจารณาจากความเสียหายและผลกระทบต่อชีวิตและทรัพย์สิน` 
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 500, // ลดจำนวน tokens เพื่อความเร็ว
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content;

    const jsonMatch = aiReply.match(/```json([\s\S]*?)```/i);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : aiReply.trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    return null;
  }
}

exports.createReport = async (req, res) => {
  const { description, lat, lng } = req.body;

  if (!description || description.trim() === '') {
    return res.status(400).json({ success: false, message: 'ไม่มีรายละเอียดภัยพิบัติ' });
  }

  try {
    const analysis = await analyzeDescriptionWithOllama(description);
    if (!analysis) {
      return res.status(500).json({ success: false, message: 'วิเคราะห์ข้อความล้มเหลว' });
    }

    // ตรวจสอบว่าเป็นเรื่องน้ำท่วมในเชียงรายหรือไม่
    const isFloodInChiangRai = analysis.disasterType === 'flood' && 
                               analysis.location && 
                               analysis.location.toLowerCase().includes('เชียงราย');

    const newReport = new DisasterReport({
      disasterType: analysis.disasterType || 'other',
      location: analysis.location || 'ไม่ระบุ',
      severityLevel: analysis.severityLevel || 'low',
      severityReasoning: analysis.severityReasoning || '',
      description,
      locationCoordinates: (lat && lng) ? { lat, lng } : undefined,
    });

    await newReport.save();
    await upsertDisasterReportsToVectorStore([newReport]);

    res.json({ 
      success: true, 
      message: 'บันทึกข้อมูลสำเร็จ',
      isFloodInChiangRai: isFloodInChiangRai
    });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

exports.getReports = async (req, res) => {
  try {
    // เน้นเฉพาะรายงานน้ำท่วมในเชียงราย
    const reports = await DisasterReport.find({
      disasterType: { $regex: /น้ำท่วม|flood/i },
      location: { $regex: /เชียงราย|chiang rai/i }
    }).sort({ createdAt: -1 }); 
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'ไม่สามารถดึงข้อมูลรายงานได้' });
  }
};
