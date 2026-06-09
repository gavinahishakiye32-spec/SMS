const mongoose = require('mongoose');

const sectionSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  },
  { timestamps: true }
);

sectionSchema.index({ classId: 1 });
sectionSchema.index({ name: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
