const mongoose = require('mongoose');
const { calculateGrade, calculateSubjectAverage } = require('../utils/gradeUtils');

const markSchema = mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
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
    midtermMarks: { type: Number, min: 0, max: 100 },
    endTermMarks: { type: Number, min: 0, max: 100 },
    subjectAverage: { type: Number, default: 0 },
    grade: { type: String, default: '' },
  },
  { timestamps: true }
);

markSchema.pre('save', function (next) {
  this.subjectAverage = calculateSubjectAverage(this.midtermMarks, this.endTermMarks);
  this.grade = calculateGrade(this.subjectAverage);
  next();
});

markSchema.index({ studentId: 1, subjectId: 1, termId: 1, academicYearId: 1 }, { unique: true });
markSchema.index({ classId: 1, subjectId: 1, termId: 1 });
markSchema.index({ classId: 1, termId: 1 });
markSchema.index({ subjectId: 1, termId: 1, academicYearId: 1 });
markSchema.index({ studentId: 1, termId: 1, academicYearId: 1 });

module.exports = mongoose.model('Mark', markSchema);
