const mongoose = require('mongoose');
const { calculateGrade, calculateSubjectAverage, calculateGradePoints } = require('../utils/gradeUtils');
const Class = require('./Class');

const markSchema = mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    termId: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    midtermMarks: { type: Number, min: 0, max: 100 },
    endTermMarks: { type: Number, min: 0, max: 100 },
    subjectAverage: { type: Number, default: 0 },
    grade: { type: String, default: '' },
    gradePoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

markSchema.pre('save', async function (next) {
  try {
    this.subjectAverage = calculateSubjectAverage(this.midtermMarks, this.endTermMarks);
    if (this.classId) {
      const classDoc = await Class.findById(this.classId).select('level').lean();
      if (classDoc) {
        this.grade = calculateGrade(this.subjectAverage, classDoc.level);
        this.gradePoints = calculateGradePoints(this.subjectAverage, classDoc.level);
        return next();
      }
    }
    this.grade = calculateGrade(this.subjectAverage, 'O-Level');
    this.gradePoints = calculateGradePoints(this.subjectAverage, 'O-Level');
  } catch (error) {
    console.error('Error in Mark pre-save hook:', error);
    this.grade = calculateGrade(this.subjectAverage, 'O-Level');
    this.gradePoints = calculateGradePoints(this.subjectAverage, 'O-Level');
  }
  next();
});

markSchema.index({ studentId: 1, subjectId: 1, termId: 1, academicYearId: 1 }, { unique: true });
markSchema.index({ classId: 1, subjectId: 1, termId: 1 });
markSchema.index({ classId: 1, termId: 1 });
markSchema.index({ subjectId: 1, termId: 1, academicYearId: 1 });
markSchema.index({ studentId: 1, termId: 1, academicYearId: 1 });

module.exports = mongoose.model('Mark', markSchema);
