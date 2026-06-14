const mongoose = require('mongoose');

const parentSchema = mongoose.Schema(
  {
    fullName: { type: String, required: true },
    parentType: { type: String, enum: ['Mother', 'Father'] },
    nationalId: { type: String },
    NIN: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    address: { type: String },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

parentSchema.index({ email: 1 });
parentSchema.index({ phoneNumber: 1 });
parentSchema.index({ studentIds: 1 });
parentSchema.index({ fullName: 'text', email: 'text', phoneNumber: 'text' });

module.exports = mongoose.model('Parent', parentSchema);
