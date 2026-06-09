function calculateGrade(average) {
  if (average >= 80) return 'A';
  if (average >= 70) return 'B';
  if (average >= 60) return 'C';
  if (average >= 50) return 'D';
  if (average >= 40) return 'E';
  return 'F';
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
