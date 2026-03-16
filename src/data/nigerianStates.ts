export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
] as const;

export const AGE_BRACKETS = [
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-55', min: 46, max: 55 },
  { label: '56+', min: 56, max: 120 },
] as const;

export const COMMON_OCCUPATIONS = [
  'Farmer', 'Student', 'Teacher', 'Civil Servant', 'Trader', 'Engineer',
  'Doctor', 'Nurse', 'Lawyer', 'Artisan', 'Business Owner', 'Unemployed', 'Retired', 'Other'
] as const;

export const GENDERS = [
  'Male', 'Female', 'Other', 'Prefer not to say'
] as const;

export const DISABILITIES = [
  'None',
  'Visual impairment',
  'Hearing impairment',
  'Physical/mobility disability',
  'Cognitive/intellectual disability',
  'Speech impairment',
  'Multiple disabilities',
  'Prefer not to say',
  'Other'
] as const;

export const HEALTH_CHALLENGES = [
  'None',
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Sickle cell disease',
  'Heart condition',
  'Epilepsy',
  'Chronic pain',
  'Mental health condition',
  'HIV/AIDS',
  'Prefer not to say',
  'Other'
] as const;
