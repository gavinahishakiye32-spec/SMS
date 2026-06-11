function calculateGrade(average) {
  if (average >= 90) return 'Excellent';
  if (average >= 80) return 'V.Good';
  if (average >= 70) return 'Good';
  if (average >= 60) return 'F.Good';
  if (average >= 50) return 'Tried';
  if (average >= 40) return 'Improve';
  return 'Failed';
}

function calculateSubjectAverage(midterm, endTerm) {
  if (midterm != null && endTerm != null) return (midterm + endTerm) / 2;
  if (midterm != null) return midterm;
  if (endTerm != null) return endTerm;
  return 0;
}

function calculateReportRemarks(overallAverage) {
  return overallAverage >= 40 ? 'Pass' : 'Fail';
}

module.exports = { calculateGrade, calculateSubjectAverage, calculateReportRemarks };
