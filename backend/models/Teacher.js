const mongoose = require('mongoose');

const teacherSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'] },
    NIN: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    level: { type: String, enum: ['O-Level', 'A-Level'] },
    subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    profilePhoto: { type: String, default: '' },
  },
  { timestamps: true }
);

teacherSchema.index({ userId: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ subjectIds: 1 });
teacherSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

module.exports = mongoose.model('Teacher', teacherSchema);
