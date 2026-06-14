const mongoose = require('mongoose');

const classSchema = mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
      required: true,
    },
    level: { type: String, enum: ['O-Level', 'A-Level'], required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  },
  { timestamps: true }
);

classSchema.pre('validate', function (next) {
  const oLevel = ['S1', 'S2', 'S3', 'S4'];
  this.level = oLevel.includes(this.name) ? 'O-Level' : 'A-Level';
  next();
});

classSchema.index({ level: 1 });
classSchema.index({ name: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
