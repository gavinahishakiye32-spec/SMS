const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const connectCloudinary = require('./config/cloudinary');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://sms-so54.onrender.com',
  /^https:\/\/.*\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => (o instanceof RegExp ? o.test(origin) : o === origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();
connectCloudinary();

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/parents', require('./routes/parentRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/marks', require('./routes/markRoutes'));
app.use('/api/academic-years', require('./routes/academicYearRoutes'));
app.use('/api/terms', require('./routes/termRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/suggestions', require('./routes/suggestionRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));

app.get('/run-seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const admins = [
      { name: 'Super Admin', email: 'super@admin.com', password: 'admin123', role: 'superadmin' },
      { name: 'School Admin', email: 'school@admin.com', password: 'admin123', role: 'schooladmin' },
    ];
    for (const admin of admins) {
      const exists = await User.findOne({ email: admin.email });
      if (!exists) {
        await User.create(admin);
      }
    }
    res.json({ message: 'Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Seed failed', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'SMS API is running' });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
