const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { HuggingFaceTransformersEmbeddings } = require("@langchain/community/embeddings/hf_transformers");
// ถ้าใช้ Ollama embeddings ให้ใช้: 
// const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { Document } = require("langchain/document");

// 2. เลือก Embeddings
// --- HuggingFace ---
const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "sentence-transformers/all-MiniLM-L6-v2", // หรือเปลี่ยนเป็น model ที่ต้องการ
  // ถ้าใช้ model local, เพิ่ม modelPath
  // modelPath: "/path/to/model"
});

// --- Ollama (ถ้าต้องการ) ---
// const embeddings = new OllamaEmbeddings({
//   model: "nomic-embed-text", // หรือ model ที่ Ollama รองรับ
//   baseUrl: "http://localhost:11434"
// });

// 3. ฟังก์ชันฝังข้อมูล
async function upsertDisasterReportsToVectorStore(reports) {
  const docs = reports.map(r => ({
    pageContent: r.description,
    metadata: {
      id: r._id?.toString?.() || r.id,
      location: r.location,
      disasterType: r.disasterType,
      severityLevel: r.severityLevel,
      reportedAt: r.reportedAt,
    }
  }));

  // ใช้ fromDocuments เพื่อสร้างหรืออัปเดต collection
  await Chroma.fromDocuments(
    docs,
    embeddings,
    {
      collectionName: "disaster_reports",
      // url: "http://localhost:8000" // ถ้าใช้ chroma server, ถ้า local ไม่ต้องใส่
    }
  );
}

// 4. ฟังก์ชัน semantic search
async function searchDisasterReports(query, topK = 5) {
  // โหลด collection ที่มีอยู่แล้ว
  const vectorStore = await Chroma.fromExistingCollection(
    embeddings,
    {
      collectionName: "disaster_reports",
      // url: "http://localhost:8000" // ถ้าใช้ chroma server, ถ้า local ไม่ต้องใส่
    }
  );
  const results = await vectorStore.similaritySearch(query, topK);
  return results;
}

module.exports = {
  upsertDisasterReportsToVectorStore,
  searchDisasterReports,
};
