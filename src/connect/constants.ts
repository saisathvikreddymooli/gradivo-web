export const DEFAULT_COUNTRY = "India";

export const COUNTRIES = ["India"];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const CONNECT_INTERESTS = [
  "Coding",
  "Cybersecurity",
  "Artificial Intelligence",
  "Machine Learning",
  "Cloud Computing",
  "Web Development",
  "App Development",
  "Data Science",
  "UI/UX",
  "DevOps",
  "Blockchain",
  "Startups",
  "Hackathons",
  "Projects",
  "Research",
  "Placements",
];

export const CONNECT_SKILLS = [
  "Python",
  "Java",
  "C / C++",
  "JavaScript",
  "TypeScript",
  "React",
  "HTML / CSS",
  "SQL",
  "Git",
  "Linux",
  "DSA",
  "AI",
  "Machine Learning",
  "Cloud",
  "Cybersecurity",
  "Docker",
  "Node.js",
];

export const SENIOR_HELP_AREAS = [
  "Career Guidance",
  "Internships",
  "Projects",
  "Coding",
  "Cybersecurity",
  "AI/ML",
  "Cloud",
  "Hackathons",
  "Placements",
  "College Life",
  "Higher Studies",
];

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];

export const BRANCH_EXAMPLES = [
  "CSE",
  "ISE",
  "ECE",
  "EEE",
  "AIML",
  "Mechanical",
  "Civil",
  "IT",
];

export const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Fake profile",
  "Inappropriate content",
  "Scam",
  "Other",
];

export const DEFAULT_GROUPS: {
  id: string;
  name: string;
  description: string;
  category: string;
  country: string;
  state: string;
}[] = [
  {
    id: "india-students",
    name: "India Students",
    description: "A nationwide space for Indian students to connect, ask, and grow.",
    category: "National",
    country: "India",
    state: "",
  },
  {
    id: "first-year",
    name: "First Year Students",
    description: "For students just starting college.",
    category: "Year",
    country: "India",
    state: "",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity Community",
    description: "Labs, CTFs, and security learning — legally and together.",
    category: "Interest",
    country: "India",
    state: "",
  },
  {
    id: "ai-ml",
    name: "AI & ML Community",
    description: "Projects, papers, and practical AI applications.",
    category: "Interest",
    country: "India",
    state: "",
  },
  {
    id: "web-dev",
    name: "Web Development",
    description: "Frontend, backend, and full-stack builders.",
    category: "Interest",
    country: "India",
    state: "",
  },
  {
    id: "cloud",
    name: "Cloud Computing",
    description: "Cloud fundamentals, labs, and certifications discussion.",
    category: "Interest",
    country: "India",
    state: "",
  },
  {
    id: "hackathons",
    name: "Hackathon Community",
    description: "Find teammates and share upcoming hackathons.",
    category: "Interest",
    country: "India",
    state: "",
  },
  {
    id: "project-partners",
    name: "Project Partners",
    description: "Find people to build with.",
    category: "Projects",
    country: "India",
    state: "",
  },
  {
    id: "internships",
    name: "Internship Discussions",
    description: "Applications, resumes, and interview prep — no guaranteed jobs.",
    category: "Career",
    country: "India",
    state: "",
  },
  {
    id: "startups",
    name: "Startup Community",
    description: "Campus founders and product builders.",
    category: "Interest",
    country: "India",
    state: "",
  },
  {
    id: "cse",
    name: "CSE Students",
    description: "Computer Science and Engineering students.",
    category: "Branch",
    country: "India",
    state: "",
  },
  {
    id: "ise",
    name: "ISE Students",
    description: "Information Science and Engineering students.",
    category: "Branch",
    country: "India",
    state: "",
  },
  {
    id: "ece",
    name: "ECE Students",
    description: "Electronics and Communication students.",
    category: "Branch",
    country: "India",
    state: "",
  },
  ...INDIAN_STATES.map((state) => ({
    id: `state-${state.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: `${state} Students`,
    description: `Connect with students in ${state}.`,
    category: "State",
    country: "India",
    state,
  })),
];
