const mongoose = require('mongoose');

const reportSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
    midtermTotal: { type: Number, default: 0 },
    midtermAverage: { type: Number, default: 0 },
    endTermTotal: { type: Number, default: 0 },
    endTermAverage: { type: Number, default: 0 },
    combinedTotal: { type: Number, default: 0 },
    overallAverage: { type: Number, default: 0 },
    grade: { type: String, default: '' },
    remarks: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' },
    teacherRemark: { type: String, default: '' },
    headTeacherSignature: { type: String, default: '' },
    classRank: { type: Number, default: 0 },
    schoolRank: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reportSchema.index({ studentId: 1, termId: 1, academicYearId: 1 }, { unique: true });
reportSchema.index({ classId: 1, termId: 1, academicYearId: 1 });
reportSchema.index({ termId: 1, academicYearId: 1 });
reportSchema.index({ overallAverage: -1 });

module.exports = mongoose.model('Report', reportSchema);
