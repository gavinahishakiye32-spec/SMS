const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: String, enum: ['O-Level', 'A-Level'], required: true },
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
  },
  { timestamps: true }
);

subjectSchema.index({ level: 1 });
subjectSchema.index({ name: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
