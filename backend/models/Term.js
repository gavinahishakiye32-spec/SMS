const mongoose = require('mongoose');

const termSchema = mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['Term 1', 'Term 2', 'Term 3'],
      required: true,
    },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

termSchema.index({ isActive: 1 });

module.exports = mongoose.model('Term', termSchema);
