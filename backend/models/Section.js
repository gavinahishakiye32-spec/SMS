const mongoose = require('mongoose');

const sectionSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: ['O-Level', 'A-Level'], required: true },
  },
  { timestamps: true }
);

sectionSchema.index({ level: 1 });
sectionSchema.index({ name: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
