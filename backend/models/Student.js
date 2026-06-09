const mongoose = require('mongoose');

const studentSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentCode: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    dateOfBirth: { type: Date },
    NIN: { type: String },
    address: { type: String },
    phoneNumber: { type: String },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    enrollmentDate: { type: Date, default: Date.now },
    profilePhoto: { type: String, default: '' },
  },
  { timestamps: true }
);

studentSchema.index({ classId: 1 });
studentSchema.index({ sectionId: 1 });
studentSchema.index({ academicYearId: 1 });
studentSchema.index({ userId: 1 });
studentSchema.index({ parentId: 1 });
studentSchema.index({ firstName: 'text', lastName: 'text', studentCode: 'text' });

module.exports = mongoose.model('Student', studentSchema);
