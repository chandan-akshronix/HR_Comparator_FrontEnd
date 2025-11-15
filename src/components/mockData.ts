export interface Candidate {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  experience: number;
  skills: string[];
  matchScore: number;
  stabilityScore: number;
  source: 'LinkedIn' | 'Indeed' | 'Naukri.com';
  status: 'new' | 'reviewing' | 'contacted' | 'rejected';
  matchBreakdown: {
    skills: number;
    experience: number;
    location: number;
    stability: number;
    overqualified: number;
  };
  selectionReason?: string; // AI-generated recommendation text
}

export const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    title: 'Senior Full Stack Developer',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    experience: 6,
    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'GraphQL', 'Redux'],
    matchScore: 92,
    stabilityScore: 85,
    source: 'LinkedIn',
    status: 'reviewing',
    matchBreakdown: {
      skills: 95,
      experience: 90,
      location: 100,
      stability: 85,
      overqualified: 0,
    },
  },
  {
    id: '2',
    name: 'Rahul Verma',
    title: 'Frontend Developer',
    email: 'rahul.v@email.com',
    phone: '+91 98123 45678',
    location: 'Mumbai, India',
    experience: 4,
    skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Tailwind', 'Next.js'],
    matchScore: 78,
    stabilityScore: 72,
    source: 'Naukri.com',
    status: 'new',
    matchBreakdown: {
      skills: 80,
      experience: 75,
      location: 70,
      stability: 72,
      overqualified: 0,
    },
  },
  {
    id: '3',
    name: 'Anita Desai',
    title: 'React Native Developer',
    email: 'anita.desai@email.com',
    phone: '+91 98234 56789',
    location: 'Pune, India',
    experience: 5,
    skills: ['React Native', 'JavaScript', 'TypeScript', 'Redux', 'Firebase', 'iOS', 'Android'],
    matchScore: 85,
    stabilityScore: 90,
    source: 'Indeed',
    status: 'new',
    matchBreakdown: {
      skills: 85,
      experience: 83,
      location: 85,
      stability: 90,
      overqualified: 0,
    },
  },
  {
    id: '4',
    name: 'Amit Patel',
    title: 'Full Stack Engineer',
    email: 'amit.patel@email.com',
    phone: '+91 98345 67890',
    location: 'Ahmedabad, India',
    experience: 7,
    skills: ['React', 'Node.js', 'Python', 'Django', 'PostgreSQL', 'Redis', 'Kubernetes'],
    matchScore: 88,
    stabilityScore: 88,
    source: 'LinkedIn',
    status: 'reviewing',
    matchBreakdown: {
      skills: 90,
      experience: 92,
      location: 80,
      stability: 88,
      overqualified: 15,
    },
  },
  {
    id: '5',
    name: 'Sneha Reddy',
    title: 'Software Developer',
    email: 'sneha.reddy@email.com',
    phone: '+91 98456 78901',
    location: 'Hyderabad, India',
    experience: 3,
    skills: ['React', 'JavaScript', 'Node.js', 'Express', 'MySQL'],
    matchScore: 72,
    stabilityScore: 65,
    source: 'Naukri.com',
    status: 'new',
    matchBreakdown: {
      skills: 70,
      experience: 65,
      location: 85,
      stability: 65,
      overqualified: 0,
    },
  },
  {
    id: '6',
    name: 'Karthik Iyer',
    title: 'Senior Software Engineer',
    email: 'karthik.iyer@email.com',
    phone: '+91 98567 89012',
    location: 'Chennai, India',
    experience: 8,
    skills: ['React', 'TypeScript', 'Node.js', 'Microservices', 'AWS', 'Terraform', 'CI/CD'],
    matchScore: 94,
    stabilityScore: 92,
    source: 'LinkedIn',
    status: 'contacted',
    matchBreakdown: {
      skills: 98,
      experience: 95,
      location: 90,
      stability: 92,
      overqualified: 25,
    },
  },
  {
    id: '7',
    name: 'Meera Nair',
    title: 'Frontend Engineer',
    email: 'meera.nair@email.com',
    phone: '+91 98678 90123',
    location: 'Kochi, India',
    experience: 4,
    skills: ['React', 'Vue.js', 'TypeScript', 'Sass', 'Webpack', 'Jest'],
    matchScore: 76,
    stabilityScore: 78,
    source: 'Indeed',
    status: 'new',
    matchBreakdown: {
      skills: 75,
      experience: 70,
      location: 75,
      stability: 78,
      overqualified: 0,
    },
  },
  {
    id: '8',
    name: 'Vikram Singh',
    title: 'Full Stack Developer',
    email: 'vikram.singh@email.com',
    phone: '+91 98789 01234',
    location: 'Delhi, India',
    experience: 5,
    skills: ['React', 'Angular', 'Node.js', 'MongoDB', 'Express', 'TypeScript'],
    matchScore: 82,
    stabilityScore: 80,
    source: 'Naukri.com',
    status: 'reviewing',
    matchBreakdown: {
      skills: 85,
      experience: 80,
      location: 82,
      stability: 80,
      overqualified: 0,
    },
  },
];
