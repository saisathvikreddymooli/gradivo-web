export type SpokenLanguage = "en" | "hi" | "te" | "kn";
export type ProgrammingLanguageId =
  | "c"
  | "cpp"
  | "java"
  | "python"
  | "javascript"
  | "web"
  | "sql"
  | "dsa"
  | "css"
  | "html";

export type LearningPlaylist = {
  language: ProgrammingLanguageId;
  spoken: SpokenLanguage;
  channel: string;
  title: string;
  playlistId?: string;
  firstVideoId?: string;
  url?: string;
  thumbnail?: string;
  thumbnailFallback?: string;
  videoCount?: number;
};

/** Only playlists opened and checked against their public YouTube page belong here. */
export const LEARNING_PLAYLISTS: LearningPlaylist[] = [
  {
    language: "c",
    spoken: "hi",
    channel: "Apna College",
    title: "C Language Full Course (Hindi)",
    url: "https://youtu.be/irqbmMNs2Bo",
    thumbnail: "https://img.youtube.com/vi/irqbmMNs2Bo/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/irqbmMNs2Bo/hqdefault.jpg",
  },
  {
    language: "c",
    spoken: "hi",
    channel: "CodeWithHarry",
    title: "C Language Tutorial for Beginners (with Notes & Practice Questions)",
    url: "https://youtu.be/aZb0iu4uGwA",
    thumbnail: "https://img.youtube.com/vi/aZb0iu4uGwA/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/aZb0iu4uGwA/hqdefault.jpg",
  },
  {
    language: "c",
    spoken: "kn",
    channel: "Engineering in Kannada",
    title: "[ ಕನ್ನಡ ] C Programming Crash Course in Kannada | Intro, Input/Output , Data Types and Operators 👨‍💻",
    url: "https://youtu.be/0sd6OpPG2UM",
    thumbnail: "https://img.youtube.com/vi/0sd6OpPG2UM/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/0sd6OpPG2UM/hqdefault.jpg",
  },
  {
    language: "c",
    spoken: "te",
    channel: "MSquare",
    title: "C Language Course (Telugu)",
    url: "https://youtu.be/m8Dpqwi7-lk",
    thumbnail: "https://img.youtube.com/vi/m8Dpqwi7-lk/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/m8Dpqwi7-lk/hqdefault.jpg",
  },
  {
    language: "c",
    spoken: "en",
    channel: "ProgrammingWithHarry",
    title: "C Language Tutorial for Beginners (With Notes) 🔥",
    url: "https://youtu.be/_MF8L7ZxwRE",
    thumbnail: "https://img.youtube.com/vi/_MF8L7ZxwRE/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/_MF8L7ZxwRE/hqdefault.jpg",
  },
  {
    language: "c",
    spoken: "en",
    channel: "Bro Code",
    title: "C Programming Full Course for free ⚙️",
    url: "https://youtu.be/xND0t1pr3KY",
    thumbnail: "https://img.youtube.com/vi/xND0t1pr3KY/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/xND0t1pr3KY/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "en",
    channel: "ProgrammingWithHarry",
    title: "Python Tutorial For Beginners (With Notes) 🔥",
    url: "https://youtu.be/EyEqWFvLDT8",
    thumbnail: "https://img.youtube.com/vi/EyEqWFvLDT8/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/EyEqWFvLDT8/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "en",
    channel: "Programming with Mosh",
    title: "Python Full Course for Beginners",
    url: "https://youtu.be/_uQrJ0TkZlc",
    thumbnail: "https://img.youtube.com/vi/_uQrJ0TkZlc/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/_uQrJ0TkZlc/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "te",
    channel: "Code With Swaroop",
    title: "Python Course (Telugu)",
    url: "https://youtu.be/fHKPQEVCX-s",
    thumbnail: "https://img.youtube.com/vi/fHKPQEVCX-s/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/fHKPQEVCX-s/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "te",
    channel: "rupaalife ",
    title: "Python Full Course in *Telugu* |Zero to Hero by Rupa |one shot | 10 HOURS |  Female Tech ",
    url: "https://youtu.be/fpeXg5zLulY",
    thumbnail: "https://img.youtube.com/vi/fpeXg5zLulY/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/fpeXg5zLulY/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "te",
    channel: "PythonLife",
    title: "Python Full Course in Telugu | Python Tutorials in Telugu | Python in Telugu | Python for Beginners",
    url: "https://youtu.be/h1WdbfoHeac",
    thumbnail: "https://img.youtube.com/vi/h1WdbfoHeac/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/h1WdbfoHeac/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "kn",
    channel: "Engineering in Kannada",
    title: "Python in Kannada - Introduction to Coding and Python | Full Course for Beginners - #1",
    url: "https://youtu.be/8c74mXV2lJ0",
    thumbnail: "https://img.youtube.com/vi/8c74mXV2lJ0/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/8c74mXV2lJ0/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "kn",
    channel: "MicroDegree ಕನ್ನಡ",
    title: "Python Tutorial for Beginners in Kannada 2026 | Python Full Course | MicroDegree",
    url: "https://youtu.be/i5B9JPq3MbI",
    thumbnail: "https://img.youtube.com/vi/i5B9JPq3MbI/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/i5B9JPq3MbI/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "hi",
    channel: "CodeWithHarry",
    title: "Python Course (Hindi)",
    url: "https://youtu.be/UrsmFxEIp5k",
    thumbnail: "https://img.youtube.com/vi/UrsmFxEIp5k/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/UrsmFxEIp5k/hqdefault.jpg",
  },
  {
    language: "python",
    spoken: "hi",
    channel: "Apna College",
    title: "Python Course (Hindi)",
    url: "https://youtu.be/ERCMXc8x7mc",
    thumbnail: "https://img.youtube.com/vi/ERCMXc8x7mc/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/ERCMXc8x7mc/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "kn",
    channel: "Engineering in Kannada",
    title: "Data Structures and Algorithms in Kannada | Introduction to DSA, Types of Data Structures | [ಕನ್ನಡ]",
    url: "https://youtu.be/iDe1fWnneCA",
    thumbnail: "https://img.youtube.com/vi/iDe1fWnneCA/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/iDe1fWnneCA/hqdefault.jpg",
  },
  {
    language: "cpp",
    spoken: "hi",
    channel: "Apna College",
    title: "1. Introduction to C++ | Data Structures and Algorithms | College Placement Course | Lecture 1",
    url: "https://youtu.be/z9bZufPHFLU",
    thumbnail: "https://img.youtube.com/vi/z9bZufPHFLU/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/z9bZufPHFLU/hqdefault.jpg",
  },
  {
    language: "cpp",
    spoken: "te",
    channel: "Vamsi Bhavani",
    title: "Day 1 : Introduction & Installation | C++/Cpp Course in Telugu | Vamsi Bhavani",
    url: "https://youtu.be/dewbCtuNv-s",
    thumbnail: "https://img.youtube.com/vi/dewbCtuNv-s/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/dewbCtuNv-s/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "te",
    channel: "Harsha Verse",
    title: "Complete DSA CRASH Course in TELUGU to get 20/30/40 LPA Jobs in 3 Months 🔥",
    url: "https://youtu.be/IK63UfMh9E8",
    thumbnail: "https://img.youtube.com/vi/IK63UfMh9E8/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/IK63UfMh9E8/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "te",
    channel: "MSquare",
    title: "Launching Java + DSA MasterOne Course🔥 in Telugu | A TO Z Course",
    url: "https://youtu.be/jd53pei5538",
    thumbnail: "https://img.youtube.com/vi/jd53pei5538/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/jd53pei5538/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "te",
    channel: "engineering animuthyam",
    title: "JAVA + DSA | DSA  in Java in Telugu Best course for free  | Part - 1 | Engineering Animuthyam",
    url: "https://youtu.be/iTTQaq22o1g",
    thumbnail: "https://img.youtube.com/vi/iTTQaq22o1g/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/iTTQaq22o1g/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "te",
    channel: "engineering animuthyam",
    title: "Python + DSA  | DSA in python in telugu The best course for free | Part - 1 | ENGINEERING ANIMUTHYAM",
    url: "https://youtu.be/Kp22-yzUkbQ",
    thumbnail: "https://img.youtube.com/vi/Kp22-yzUkbQ/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/Kp22-yzUkbQ/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "te",
    channel: "PythonLife",
    title: "DSA with Python in Telugu | Complete DSA with Python in 12 Hours | Python Telugu | PythonLife",
    url: "https://youtu.be/25z0Gtz7PUg",
    thumbnail: "https://img.youtube.com/vi/25z0Gtz7PUg/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/25z0Gtz7PUg/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "hi",
    channel: "CodeWithHarry",
    title: "Introduction to Data Structures & Algorithms",
    url: "https://youtu.be/5_5oE5lgrhw",
    thumbnail: "https://img.youtube.com/vi/5_5oE5lgrhw/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/5_5oE5lgrhw/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "hi",
    channel: "DataFlair",
    title: "What is Data Structures & Algorithm | Introduction to Data Structure & Algorithm | Learn DSA [Hindi]",
    url: "https://youtu.be/0UZ_G2mcYVQ",
    thumbnail: "https://img.youtube.com/vi/0UZ_G2mcYVQ/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/0UZ_G2mcYVQ/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "hi",
    channel: "Apna College",
    title: "Lecture 1 : Flowchart & Pseudocode + Installation | DSA Series by Shradha Khapra Ma'am | C++",
    url: "https://youtu.be/VTLCoHnyACE",
    thumbnail: "https://img.youtube.com/vi/VTLCoHnyACE/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/VTLCoHnyACE/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "en",
    channel: "Jenny's Lectures CS IT",
    title: "1.1 Arrays in Data Structure | Declaration, Initialization, Memory representation",
    url: "https://youtu.be/AT14lCXuMKI",
    thumbnail: "https://img.youtube.com/vi/AT14lCXuMKI/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/AT14lCXuMKI/hqdefault.jpg",
  },
  {
    language: "dsa",
    spoken: "en",
    channel: "Jenny's Lectures CS IT",
    title: "Introduction to Data Structure and Algorithm | DSA for Beginners",
    url: "https://youtu.be/SGDS6NFN-_U",
    thumbnail: "https://img.youtube.com/vi/SGDS6NFN-_U/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/SGDS6NFN-_U/hqdefault.jpg",
  },
  {
    language: "java",
    spoken: "te",
    channel: "Swaroop Talks",
    title: "Java Full Course in Telugu 2026: Zero to Hero (Complete Roadmap)",
    playlistId: "PLS8lzSv6JRJ2KspLhGk73WQLc-SPMaV85",
    firstVideoId: "d530rd7m_1E",
    videoCount: 16,
  },
  {
    language: "java",
    spoken: "te",
    channel: "Swaroop Talks",
    title: "Complete Java Course In Telugu | From Basics To Advanced",
    url: "https://youtu.be/d530rd7m_1E",
    thumbnail: "https://img.youtube.com/vi/d530rd7m_1E/maxresdefault.jpg",
    thumbnailFallback: "https://img.youtube.com/vi/d530rd7m_1E/hqdefault.jpg",
  },
];

export const CSS_LANGUAGE_RESOURCES: Record<SpokenLanguage, Omit<LearningPlaylist, "language" | "spoken">[]> = {
  en: [
    {
      title: "Learn CSS in 1 hour 🎨",
      channel: "Bro Code",
      url: "https://youtu.be/wRNinF7YQqQ",
      thumbnail: "https://img.youtube.com/vi/wRNinF7YQqQ/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/wRNinF7YQqQ/hqdefault.jpg",
    },
    {
      title: "CSS Introduction and Tutorial for Beginners",
      channel: "Dave Gray",
      url: "https://youtu.be/0W6qz0-aDaM",
      thumbnail: "https://img.youtube.com/vi/0W6qz0-aDaM/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/0W6qz0-aDaM/hqdefault.jpg",
    },
  ],
  hi: [
    {
      title: "CSS Full COURSE for Beginners in 4 HOURS | Learn CSS in 2026 with Practical🔥",
      channel: "WsCube Tech",
      url: "https://youtu.be/B9FvD1L2hAQ",
      thumbnail: "https://img.youtube.com/vi/B9FvD1L2hAQ/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/B9FvD1L2hAQ/hqdefault.jpg",
    },
  ],
  te: [
    {
      title: "CSS Full Course in Telugu | From a ZERO to HERO | Code With Swaroop",
      channel: "Swaroop Talks",
      url: "https://youtu.be/Oi9QvyK8zvk",
      thumbnail: "https://img.youtube.com/vi/Oi9QvyK8zvk/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/Oi9QvyK8zvk/hqdefault.jpg",
    },
    // CSS videos: add entries here
    // { title: "", channel: "", url: "", thumbnail: "" }
  ],
  kn: [
    {
      title: "Chapter - 1 CSS Introduction in ಕನ್ನಡದಲ್ಲಿ",
      channel: "DEBUG CODING",
      url: "https://youtu.be/wAqQScpoOMQ",
      thumbnail: "https://img.youtube.com/vi/wAqQScpoOMQ/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/wAqQScpoOMQ/hqdefault.jpg",
    },
  ],
};

export const HTML_LANGUAGE_RESOURCES: Record<SpokenLanguage, Omit<LearningPlaylist, "language" | "spoken">[]> = {
  en: [
    {
      title: "Learn HTML – Full Tutorial for Beginners",
      channel: "freeCodeCamp.org",
      url: "https://youtu.be/kUMe1FH4CHE",
      thumbnail: "https://img.youtube.com/vi/kUMe1FH4CHE/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/kUMe1FH4CHE/hqdefault.jpg",
    },
    // HTML videos: add entries here
    // { title: "", channel: "", url: "", thumbnail: "" }
  ],
  hi: [],
  te: [],
  kn: [],
};

export const SQL_LANGUAGE_RESOURCES: Record<SpokenLanguage, Omit<LearningPlaylist, "language" | "spoken">[]> = {
  te: [
    {
      title: "SQL Full Course in Telugu | Zero to Hero 🔥",
      channel: "Kaarthik For U",
      url: "https://youtu.be/A9SavjIHNPo",
      thumbnail: "https://img.youtube.com/vi/A9SavjIHNPo/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/A9SavjIHNPo/hqdefault.jpg",
    },
    {
      title: "SQL Full Course in Telugu | Free Notes, Practice Questions & Interview Questions",
      channel: "Dodagatta Nihar",
      url: "https://youtu.be/4yEIZ9KZ_aQ",
      thumbnail: "https://img.youtube.com/vi/4yEIZ9KZ_aQ/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/4yEIZ9KZ_aQ/hqdefault.jpg",
    },
    {
      title: "SQL Full Course in Telugu | Complete SQL in 3.5 Hours | Vamsi Bhavani",
      channel: "Vamsi Bhavani",
      url: "https://youtu.be/XEqTRwT9cW4",
      thumbnail: "https://img.youtube.com/vi/XEqTRwT9cW4/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/XEqTRwT9cW4/hqdefault.jpg",
    },
  ],
  hi: [
    {
      title: "Master SQL in One Video 💻 | Full SQL Course in Hindi (Beginner to Advanced 2026)",
      channel: "Learn More",
      url: "https://youtu.be/a4xjpxzqN1Q",
      thumbnail: "https://img.youtube.com/vi/a4xjpxzqN1Q/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/a4xjpxzqN1Q/hqdefault.jpg",
    },
    {
      title: "Lec-59: Introduction to Structured Query Language | All Points regarding its Features and Syllabus",
      channel: "Gate Smashers",
      url: "https://youtu.be/323H_mOOWQ4",
      thumbnail: "https://img.youtube.com/vi/323H_mOOWQ4/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/323H_mOOWQ4/hqdefault.jpg",
    },
  ],
  en: [
    {
      title: "SQL Full Course In 10 Hours | SQL Tutorial | Complete SQL Course For Beginners | Edureka",
      channel: "edureka!",
      url: "https://youtu.be/q_JsgpiuY98",
      thumbnail: "https://img.youtube.com/vi/q_JsgpiuY98/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/q_JsgpiuY98/hqdefault.jpg",
    },
    {
      title: "SQL Course for Beginners [Full Course]",
      channel: "Programming with Mosh",
      url: "https://youtu.be/7S_tz1z_5bA",
      thumbnail: "https://img.youtube.com/vi/7S_tz1z_5bA/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/7S_tz1z_5bA/hqdefault.jpg",
    },
    {
      title: "SQL Full Course for free 🐬",
      channel: "Bro Code",
      url: "https://youtu.be/5OdVJbNCSso",
      thumbnail: "https://img.youtube.com/vi/5OdVJbNCSso/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/5OdVJbNCSso/hqdefault.jpg",
    },
  ],
  kn: [
    {
      title: "MySQL Full Course for Beginners | SQL Tutorial in Kannada | MicroDegree",
      channel: "MicroDegree ಕನ್ನಡ",
      url: "https://youtu.be/exqFMNJKDOE",
      thumbnail: "https://img.youtube.com/vi/exqFMNJKDOE/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/exqFMNJKDOE/hqdefault.jpg",
    },
    {
      title: "Introduction to SQL | Structured Query Language - Complete Tutorial | Kaliyona | In Kannada",
      channel: "Kaliyona - ಕಲಿಯೊಣ",
      url: "https://youtu.be/qC753Ab8T4U",
      thumbnail: "https://img.youtube.com/vi/qC753Ab8T4U/maxresdefault.jpg",
      thumbnailFallback: "https://img.youtube.com/vi/qC753Ab8T4U/hqdefault.jpg",
    },
  ],
};

/** Extract a real playlist id from a pasted YouTube playlist URL. */
export function playlistIdFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) return null;
    if (url.pathname !== "/playlist") return null;
    const id = url.searchParams.get("list");
    return id && /^[\w-]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
