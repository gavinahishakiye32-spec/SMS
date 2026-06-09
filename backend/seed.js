const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const admins = [
      { name: 'Super Admin', email: 'super@admin.com', password: 'admin123', role: 'superadmin' },
      { name: 'School Admin', email: 'school@admin.com', password: 'admin123', role: 'schooladmin' },
    ];

    for (const admin of admins) {
      const exists = await User.findOne({ email: admin.email });
      if (!exists) {
        await User.create(admin);
        console.log(`Created ${admin.role}: ${admin.email}`);
      } else {
        console.log(`${admin.role} already exists: ${admin.email}`);
      }
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

seed();
