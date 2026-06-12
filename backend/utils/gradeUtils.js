function calculateSubjectAverage(ca, exam) {
  if (ca != null && exam != null) return ca * 0.2 + exam * 0.8;
  if (ca != null) return ca * 0.2;
  if (exam != null) return exam * 0.8;
  return 0;
}

function calculateGrade(average, level) {
  if (level === 'A-Level') {
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 50) return 'D';
    if (average >= 40) return 'E';
    return 'F';
  }
  if (average >= 80) return 'A';
  if (average >= 70) return 'B';
  if (average >= 60) return 'C';
  if (average >= 50) return 'D';
  return 'E';
}

function calculateGradePoints(average, level) {
  if (level === 'A-Level') {
    if (average >= 80) return 6;
    if (average >= 70) return 5;
    if (average >= 60) return 4;
    if (average >= 50) return 3;
    if (average >= 40) return 2;
    return 1;
  }
  if (average >= 80) return 5;
  if (average >= 70) return 4;
  if (average >= 60) return 3;
  if (average >= 50) return 2;
  return 1;
}

function calculateOverallResult(averagePoints, level) {
  if (level === 'A-Level') {
    return averagePoints >= 3 ? 'Principal Pass' : 'Subsidiary Pass';
  }
  if (averagePoints >= 4.5) return 'Division I';
  if (averagePoints >= 3.5) return 'Division II';
  if (averagePoints >= 2.5) return 'Division III';
  return 'Division IV';
}

module.exports = { calculateGrade, calculateSubjectAverage, calculateGradePoints, calculateOverallResult };
