export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email address is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePhone(phone) {
  if (!phone || !phone.trim()) return 'Phone number is required.';
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return 'Enter a valid phone number.';
  }
  return null;
}

export function validateOpportunityAmount(amount) {
  if (amount === '' || amount === null || amount === undefined) {
    return 'Opportunity Amount is required.';
  }
  const val = parseFloat(amount);
  if (isNaN(val) || val <= 0) {
    return 'Opportunity Amount must be greater than 0.';
  }
  return null;
}

export function validateProbability(prob) {
  if (prob === '' || prob === null || prob === undefined) {
    return 'Probability is required.';
  }
  const val = parseInt(prob, 10);
  if (isNaN(val) || val < 0 || val > 100) {
    return 'Probability must be between 0 and 100.';
  }
  return null;
}

export function validateExpectedCloseDate(dateStr, stage = 'Qualification') {
  if (!dateStr) return 'Expected Close Date is required.';
  if (stage !== 'Won' && stage !== 'Lost') {
    const targetDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return 'Expected Close Date cannot be in the past.';
    }
  }
  return null;
}

export function validateFollowUpDate(dateStr, status = 'Planned') {
  if (!dateStr) return 'Follow-up date is required.';
  if (status === 'Planned') {
    const targetDate = new Date(dateStr);
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    if (targetDate < now) {
      return 'Follow-up date cannot be earlier than today.';
    }
  }
  return null;
}
