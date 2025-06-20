const mongoose = require('mongoose');

const DisasterReportSchema = new mongoose.Schema({
  disasterType: String,
  location: String,
  severityLevel: String,
  severityReasoning: String,
  description: String,
  locationCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true  },
  },
}, { timestamps: true });

DisasterReportSchema.index({ createdAt: -1 });
DisasterReportSchema.index({ location: 1 });
DisasterReportSchema.index({ disasterType: 1 });
DisasterReportSchema.index({ severityLevel: 1 });

module.exports = mongoose.model('DisasterReport', DisasterReportSchema);
