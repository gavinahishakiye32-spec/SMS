const mongoose = require('mongoose');

const academicYearSchema = mongoose.Schema(
  {
    year: { type: String, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

academicYearSchema.index({ isActive: 1 });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
