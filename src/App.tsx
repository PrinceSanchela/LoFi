import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ArrowRight, Stars, RefreshCcw, User, TriangleAlert, HeartOff, Moon } from 'lucide-react';
import './App.css';
import { askGemini } from './lib/gemini';
import Preloader from './componets/Preloader';

// Types
type Gender = 'male' | 'female' | '';

interface UserData {
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
}

interface LoveResult {
  matchName: string;
  zodiac: string;
  zodiacTraits: string; // New field for meaning
  compatibility: number;
  message: string;
  color: string;
  isAlone?: boolean; // New field for the "Alone" result
}

// Validation Helper: Gibberish Detection
const isValidName = (name: string): boolean => {
  const n = name.trim().toLowerCase();
  if (n.length < 2) return false;

  // 1. Must contain at least one vowel (y included)
  if (!/[aeiouy]/.test(n)) return false;

  // 2. No more than 3 consecutive consonants
  if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(n)) return false;

  // 3. No more than 2 consecutive identical characters (e.g., 'aaa')
  if (/(.)\1\1/.test(n)) return false;

  // 4. Entropy Check: Prevent low-variety spam (e.g., "ioihoihoihhih")
  const uniqueChars = new Set(n).size;
  if (n.length > 8 && uniqueChars < 4) return false; // "ioihoihoihhih" (13 chars, 3 unique) -> Blocked
  if (n.length > 5 && uniqueChars < 3) return false; // "mummum" (6 chars, 2 unique) -> Blocked

  return true;
};

// Helper: Zodiac Icons
const getZodiacIcon = (sign: string): string => {
  const icons: Record<string, string> = {
    "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
    "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
    "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"
  };
  return icons[sign] || "✨";
};

// --- NEW COMPONENT: Heart Particles ---
const HeartParticles = () => {
  const particles = Array.from({ length: 40 });
  return (
    <div className="particles-overlay">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="heart-particle"
          initial={{
            x: `${Math.random() * 100}vw`,
            y: "110vh",
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0
          }}
          animate={{
            y: "-10vh",
            opacity: [0, 0.4, 0.4, 0],
            rotate: Math.random() * 360
          }}
          transition={{
            duration: Math.random() * 8 + 7,
            repeat: Infinity,
            delay: Math.random() * 15,
            ease: "linear"
          }}
        >
          <Heart size={Math.random() * 20 + 10} fill="currentColor" />
        </motion.div>
      ))}
    </div>
  );
};

const MagicTrail = () => {
  const [points, setPoints] = useState<{ x: number, y: number, id: number }[]>([]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPoints(prev => [...prev.slice(-10), { x: e.clientX, y: e.clientY, id: Date.now() }]);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="magic-trail-container">
      <AnimatePresence>
        {points.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 0 }}
            exit={{ opacity: 0 }}
            className="magic-point"
            style={{ left: p.x, top: p.y }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ShootingStars = () => {
  const stars = Array.from({ length: 3 });
  return (
    <div className="particles-overlay">
      {stars.map((_, i) => (
        <motion.div
          key={i}
          className="shooting-star"
          initial={{ top: -100, left: 200 + Math.random() * 800, opacity: 0 }}
          animate={{
            top: 800,
            left: -200 + Math.random() * 400,
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: Math.random() * 20,
            repeatDelay: Math.random() * 15
          }}
        />
      ))}
    </div>
  );
};


// --- Internal Cosmic Engine (Offline Fallback) ---
// Indian Data forces all matches to be authentic to the user's local culture preference.

// Indian Data
const INDIAN_MALE = [
  "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Aryan", "Krishna", "Ishaan", "Shaurya",
  "Rohan", "Kabir", "Vivaan", "Atharv", "Ayaan", "Dhruv", "Ryan", "Ansh", "Karthik", "Rudra",
  "Dev", "Rahul", "Abhimanyu", "Vedant", "Om", "Aadi", "Yash", "Neel", "Kunal", "Rishi",
  "Varun", "Siddharth", "Manav", "Jai", "Shiv", "Parth", "Pranav", "Ritvik", "Samar", "Utkarsh"
];

const INDIAN_FEMALE = [
  "Aadhya", "Diya", "Saanvi", "Ananya", "Kiara", "Pari", "Riya", "Myra", "Sarah", "Ira",
  "Anvi", "Aahana", "Prisha", "Aditi", "Kavya", "Zara", "Siya", "Navya", "Ridhima", "Shanaya",
  "Ishita", "Vanshika", "Meera", "Aarohi", "Pooja", "Sana", "Sneha", "Nisha", "Jiya", "Tanvi",
  "Roshni", "Priya", "Esha", "Avni", "Sara", "Trisha", "Radhika", "Anika", "Kritika", "Aleena"
];

const INDIAN_SURNAMES = [
  "Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Saxena", "Mehta", "Joshi", "Patel", "Singh",
  "Kumar", "Das", "Chopra", "Desai", "Rao", "Nair", "Iyer", "Reddy", "Kapoor", "Khan",
  "Agarwal", "Jain", "Mishra", "Pandey", "Dubey", "Yadav", "Tiwari", "Sinha", "Chauhan", "Gill",
  "Sandhu", "Garg", "Anand", "Sethi", "Bansal", "Goel", "Kaul", "Dhawan", "Khurana", "Ahuja",
  "Sanchela", "Thummar", "Biswas", "Vaghasiya", "Saravade", "Prajapati", "Thakkar", "Vyas"
];

// Simple heuristic to detect if a name might be Indian to prefer Indian matches
// (Mandated to use Indian pools globally now)

const detectGenderFromName = (firstName: string): Gender | 'unknown' => {
  const name = firstName.trim().toLowerCase();

  const maleNames = INDIAN_MALE.map(n => n.toLowerCase());
  const femaleNames = INDIAN_FEMALE.map(n => n.toLowerCase());

  if (maleNames.includes(name)) return 'male';
  if (femaleNames.includes(name)) return 'female';

  return 'unknown';
};

const deterministicMatch = (data: UserData): LoveResult => {
  const fullName = `${data.firstName} ${data.lastName}`;
  const seedString = `${fullName.trim().toLowerCase()}-${data.dob}-${data.gender}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
    hash = hash | 0; // Convert to 32bit integer
  }

  // Inject DOB influence more aggressively into the seed
  const dobParts = data.dob.split('-').map(Number);
  const dobSum = dobParts.reduce((a, b) => a + b, 0);
  const seed = Math.abs(hash ^ (dobSum * 1000));

  // Select Pool (Mandated to be Indian matches)
  let firstNames = INDIAN_MALE;
  let surnamesPool = INDIAN_SURNAMES;

  // Gender logic
  if (data.gender === 'male') {
    firstNames = INDIAN_FEMALE;
  } else if (data.gender === 'female') {
    firstNames = INDIAN_MALE;
  } else {
    // Other: mix both
    firstNames = [...INDIAN_MALE, ...INDIAN_FEMALE];
  }

  // Generate Components
  const firstName = firstNames[seed % firstNames.length];

  // Use a secondary hash for the surname
  const surnameSeed = Math.abs((hash * 16807) % 2147483647);
  const surname = surnamesPool[surnameSeed % surnamesPool.length];

  const signs = [
    { name: "Aries", traits: "Bold, ambitious, and passionate. A fiery spirit who loves adventure." },
    { name: "Taurus", traits: "Reliable, patient, and devoted. A grounding presence who values stability." },
    { name: "Gemini", traits: "Expressive, curious, and adaptable. A charming intellectual who keeps life exciting." },
    { name: "Cancer", traits: "Intuitive, emotional, and protective. A deeply caring soul who values connection." },
    { name: "Leo", traits: "Charismatic, warm-hearted, and confident. A natural leader who shines bright." },
    { name: "Virgo", traits: "Loyal, analytical, and kind. A practical perfectionist who cares deeply." },
    { name: "Libra", traits: "Diplomatic, gracious, and fair-minded. A lover of harmony and beauty." },
    { name: "Scorpio", traits: "Resourceful, brave, and passionate. A mysterious intensity that draws you in." },
    { name: "Sagittarius", traits: "Generous, idealistic, and great sense of humor. A free spirit who loves exploring." },
    { name: "Capricorn", traits: "Disciplined, responsible, and self-controlled. A dedicated partner to build a future with." },
    { name: "Aquarius", traits: "Original, progressive, and independent. A visionary who sees the world differently." },
    { name: "Pisces", traits: "Artistic, compassionate, and wise. A dreamer who feels deeply." }
  ];

  // Deterministic Zodiac
  const zodiacData = signs[seed % signs.length];

  const compatibility = 85 + (seed % 15); // 85-99%

  const messages = [
    "The stars align to bring you two together in perfect harmony.",
    "A connection written in the constellations, destined to shine bright.",
    "Your souls recognize each other from a past lifetime.",
    "An adventurous journey awaits, filled with laughter and deep understanding.",
    "A quiet, steady love that will weather any storm.",
    "Sparks fly instantly—your chemistry is undeniable and magnetic.",
    "Two hearts beating as one, guided by the moon's gentle pull.",
    "A rare and precious bond that blooms like a celestial flower."
  ];

  const colors = ["#ff4d6d", "#7209b7", "#4361ee", "#f72585", "#e01e37"];

  return {
    matchName: `${firstName} ${surname}`,
    zodiac: zodiacData.name,
    zodiacTraits: zodiacData.traits,
    compatibility,
    message: messages[seed % messages.length],
    color: colors[seed % colors.length]
  };
};

const checkSpecialMatch = (data: UserData): LoveResult | null => {
  const fName = data.firstName.trim().toLowerCase();
  const lName = data.lastName.trim().toLowerCase();
  const fullName = `${fName} ${lName}`;
  const dob = data.dob;
  const gender = data.gender;

  // Extract DOB parts for granular "cheat" control
  const [bYear, bMonth, bDay] = dob ? dob.split('-') : ['', '', ''];

  // Easter Egg: Prince Sanchela (The Creator)
  if (fullName === "prince sanchela") {
    return {
      matchName: "MASTER ARCHITECT",
      zodiac: "CORE LOGIC",
      zodiacTraits: "System.isCreator(true); // Access granted. User is the primary source code.",
      compatibility: 999,
      message: "MASTER SE CHALAKI NHI! 💻 System integrity verified. You are the source, not the subject.",
      color: "#00ff41"
    };
  }

  // Special Match: Dev Thummar
  if (fullName === "dev thummar" && dob === "2008-05-04" && gender === "male") {
    return {
      matchName: "Aastha Dhondi Khobbani",
      zodiac: "Taurus",
      zodiacTraits: "Reliable, patient, and devoted. A grounding presence who values stability.",
      compatibility: 99,
      message: "The cosmic alignment confirms: your heart has finally found its twin frequency.",
      color: "#f72585"
    };
  }

  // Example of using granular parts:
  // if (fullName === "someone" && bYear === "2005" && bMonth === "05") { ... }

  // Special Match : Rajni 
  

  // Special Match : batuk (Het Markana)
  // CHEAT KEY: Only triggers if Day is entered as "04"
  if (fullName === "het markana" && gender === "male" && (bYear === "2007" || bYear === "2008" || bYear === "2006")) {
    return {
      matchName: "Aakash Biswas",
      zodiac: "Taurus",
      zodiacTraits: "Reliable, patient, and devoted. A grounding presence who values stability.",
      compatibility: 99,
      message: "The cosmic alignment confirms: your heart has finally found its twin frequency.",
      color: "#f72585"
    };
  }

  // Special Match : Shardool
  if (fullName === "shardool prajapati" && gender === "male") {
    return {
      matchName: "Have Multiple crush",
      zodiac: "Infinite",
      zodiacTraits: "Reliable, patient, and devoted. A grounding presence who values stability.",
      compatibility: +9999,
      message: "The cosmic alignment confirms: your heart has not find single it have multiple baddies,  its twin frequency.",
      color: "#f72585"
    };
  }

  // Special Match : Dhruv Rathi

  // Special Match : yash vala

  // Special Match : aakash
  // CHEAT KEY: Only triggers if Year is entered as "2004"
  if (fullName === "akash biswas" && gender === "male" && (bYear === "2007" || bYear === "2008" || bYear === "2006")) {
    return {
      matchName: "Madhura Saravade",
      zodiac: "Taurus",
      zodiacTraits: "Reliable, patient, and devoted. A grounding presence who values stability.",
      compatibility: 99,
      message: `The stars confirm: ${bYear} was the year of your union. Your frequencies match perfectly.`,
      color: "#f72585"
    };
  }
  // Special Match : madhura
  if (fullName === "madhura saravade" && gender === "female") {
    return {
      matchName: "Akash Biswas",
      zodiac: "Taurus",
      zodiacTraits: "Reliable, patient, and devoted. A grounding presence who values stability.",
      compatibility: 99,
      message: "The cosmic alignment confirms: your heart has finally found its twin frequency.",
      color: "#f72585"
    };
  }
  // krish

  // priyansi
  // CHEAT KEY: Only triggers if Year is entered as "2005"
  if (fullName === "priyansi patel" && gender === "female" && (bYear === "2007" || bYear === "2008" || bYear === "2006")) {
    return {
      matchName: "Dhruv Rathi",
      zodiac: "Taurus",
      zodiacTraits: "Reliable, patient, and devoted. A grounding presence who values stability.",
      compatibility: 99,
      message: "The cosmic alignment confirms: your heart has finally found its twin frequency.",
      color: "#f72585"
    };
  }

  // Special Match : purv vaghasiya
  if (fullName === "purv vaghasiya") {
    return {
      matchName: "A SOLO SOUL",
      zodiac: "SELF LOVE",
      zodiacTraits: "Right now, your energy is perfectly focused on your own peace and happiness.",
      compatibility: 0,
      message: "Sometimes the stars want you to be your own best valentine. This year, your journey is about loving yourself first before searching for someone else.",
      color: "#4a4e69",
      isAlone: true
    };
  }

  return null;
};

// Async AI Match Logic
const generateAIMatch = async (data: UserData, dobConfig: any, requiredFields: string): Promise<LoveResult> => {
  try {
    const fullName = `${data.firstName} ${data.lastName}`;

    const promptText = `
      You are the backend engine for a premium Valentine's Matchmaking application.
      
      USER DATA:
      - Full Name: ${fullName}
      - Input Gender: ${data.gender}
      - Birth Info Provided: ${data.dob || "Optional/Partial"}
      
      STRICT REQUIREMENTS:
      1. LOVE FOUND: You MUST identify a perfect soulmate for this user.
      2. CULTURAL IDENTITY: The generated "matchName" MUST be an authentic Indian name (First + Surname).
      3. GENDER ALIGNMENT: If the user is ${data.gender}, generate a match of the opposite gender.
      4. COSMIC SYNC: ${dobConfig.anyRequired ? `Since the user provided their birth ${requiredFields}, use these coordinates to calculate a unique destiny.` : `Since this is a special cosmic entity, provide a uniquely tailored match.`}
      
      OUTPUT FORMAT (Strict JSON):
      {
        "matchName": "Full Indian name of the soulmate",
        "zodiac": "Valid Zodiac Sign of the soulmate",
        "zodiacTraits": "A single sentence describing their cosmic energy",
        "compatibility": score between 85 and 99,
        "message": "A poetic, romantic sentence about their destiny together",
        "color": "A hex code representing their shared vibe"
      }
    `;

    const text = await askGemini(promptText);

    // Cleaning text in case the AI includes markdown decorators in the response
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.warn("[Production] AI Match failed, activating deterministic fallback:", error);
    return deterministicMatch(data);
  }
};

function App() {
  const [isPreloading, setIsPreloading] = useState(true);
  const [step, setStep] = useState<'intro' | 'form' | 'loading' | 'result'>('intro');
  const [loadingText, setLoadingText] = useState("Connecting to Cosmic Database...");
  const [formData, setFormData] = useState<UserData>({ firstName: '', lastName: '', dob: '', gender: '' });
  const [errors, setErrors] = useState<{ firstName?: string, lastName?: string, dob?: string }>({});
  const [result, setResult] = useState<LoveResult | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showGenderWarning, setShowGenderWarning] = useState(false);
  const [hasConfirmedGender, setHasConfirmedGender] = useState(false);
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState(false);

  // Refs for auto-focus jumping
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Decoupled DOB states for granular control and better UX
  const [dobParts, setDobParts] = useState({ day: '', month: '', year: '' });
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);

  // Granular DOB control for "Cheat" users
  const getDobConfig = () => {
    const name = `${formData.firstName.trim().toLowerCase()} ${formData.lastName.trim().toLowerCase()}`;

    // CUSTOMIZE YOUR CHEAT REQUIREMENTS HERE:
    if (name === "akash biswas") return { day: false, month: false, year: true, anyRequired: true, isCheat: true }; // Only asks for Year
    if (name === "het markana") return { day: true, month: false, year: false, anyRequired: true, isCheat: true }; // Only asks for Day
    if (name === "priyansi patel") return { day: false, month: false, year: true, anyRequired: true, isCheat: true }; // Only asks for Month

    // Fully optional users (no DOB fields shown)
    const isFullyOptional = (
      name === "shardool prajapati" ||
      name === "madhura saravade" ||
      name === "purv vaghasiya"
    );

    if (isFullyOptional) return { day: false, month: false, year: false, anyRequired: false, isCheat: false };

    // Default: Everyone else needs full DOB
    return { day: true, month: true, year: true, anyRequired: true, isCheat: false };
  };

  const dobConfig = getDobConfig();

  const requiredFields = [
    dobConfig.day && "Day",
    dobConfig.month && "Month",
    dobConfig.year && "Year"
  ].filter(Boolean).join(", ");

  const isDobReady = !dobConfig.anyRequired ||
    ((!dobConfig.day || dobParts.day) &&
      (!dobConfig.month || dobParts.month !== "") &&
      (!dobConfig.year || (dobParts.year && dobParts.year.length === 4)));

  useEffect(() => {
    const { day, month, year } = dobParts;
    let errorMsg = '';

    // 1. Partial Validation (Instant feedback as they type)
    if (day) {
      const d = parseInt(day);
      if (d < 1 || d > 31) errorMsg = 'Day must be 1-31';
    }

    if (year) {
      const currentYear = new Date().getFullYear();

      // Strict Digit-by-Digit Validation
      if (!year.startsWith('2')) {
        errorMsg = 'Year must be 2000+';
      } else if (year.length >= 2 && !year.startsWith('20')) {
        errorMsg = 'Invalid year format';
      } else if (year.length === 4) {
        const y = parseInt(year);
        if (y < 2000 || y > currentYear) {
          errorMsg = `Year: 2000-${currentYear}`;
        }
      }
    }

    // 2. Component Logic (Triggered when required parts according to dobConfig are present)
    const isReady = !dobConfig.anyRequired ||
      ((!dobConfig.day || day) &&
        (!dobConfig.month || month !== "") &&
        (!dobConfig.year || (year && year.length === 4)));

    if (isReady && !errorMsg) {
      // For cheat users, we construct a partial string (e.g. "2007--")
      // For normal users, it will be a full "YYYY-MM-DD"
      const yPart = year || "";
      const mPart = month !== "" ? (parseInt(month) + 1).toString().padStart(2, '0') : "";
      const dPart = day ? day.padStart(2, '0') : "";

      const dobString = `${yPart}-${mPart}-${dPart}`;

      // Additional check for full-date users to ensure logical consistency (Feb 30, etc.)
      if (dobConfig.day && dobConfig.month && dobConfig.year) {
        const d = parseInt(day);
        const m = parseInt(month);
        const y = parseInt(year);
        const date = new Date(y, m, d);
        if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
          setErrors(prev => ({ ...prev, dob: 'Invalid date combination' }));
          setFormData(prev => ({ ...prev, dob: '' }));
          return;
        }
      }

      setFormData(prev => ({ ...prev, dob: dobString }));
      setErrors(prev => ({ ...prev, dob: '' }));
      return;
    }

    // Cleanup: Incomplete or invalid
    setFormData(prev => ({ ...prev, dob: '' }));
    setErrors(prev => ({ ...prev, dob: errorMsg }));
  }, [dobParts]);



  const validateField = (name: keyof UserData, value: string) => {
    let errorMsg = '';

    if (name === 'firstName' || name === 'lastName') {
      if (!value) {
        errorMsg = '';
      } else if (value.includes(' ')) {
        errorMsg = 'One word only (no spaces)';
      } else if (!isValidName(value)) {
        errorMsg = 'Invalid name (avoid gibberish)';
      }
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name as keyof UserData, value);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setIsMonthOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStart = () => setStep('form');

  const proceedToMatch = async () => {
    setStep('loading');

    const sequences = [
      "Consulting the Ancient Constellations...",
      "Mapping your Soul's Vibration...",
      "Calculating Quantum Compatibility...",
      "Finalizing your Cosmic Match..."
    ];

    let seqIndex = 0;
    const interval = setInterval(() => {
      seqIndex++;
      if (seqIndex < sequences.length) {
        setLoadingText(sequences[seqIndex]);
      }
    }, 1200);

    setLoadingText(sequences[0]);

    try {
      // Check Special Match First (Overrides AI)
      const specialMatch = checkSpecialMatch(formData);
      if (specialMatch) {
        clearInterval(interval);
        setResult(specialMatch);
        setStep('result');
        return;
      }

      const match = await generateAIMatch(formData, dobConfig, requiredFields);

      clearInterval(interval);
      setResult(match);
      setStep('result');

    } catch (e) {
      clearInterval(interval);
      console.error("Match process failed:", e);
      setStep('form');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Gibberish / Name Validation
    if (formData.firstName.includes(' ') || formData.lastName.includes(' ')) {
      alert("Please enter only one word for your first and last names (no spaces).");
      return;
    }

    if (!isValidName(formData.firstName) || !isValidName(formData.lastName)) {
      alert("Please enter a valid real name (no random characters or gibberish).");
      return;
    }

    // 2. Date Validation (Check only required parts based on dobConfig)
    if (dobConfig.anyRequired) {
      if (dobConfig.day && !dobParts.day) { alert("Please enter your birth day."); return; }
      if (dobConfig.month && dobParts.month === "") { alert("Please select your birth month."); return; }
      if (dobConfig.year && (!dobParts.year || dobParts.year.length < 4)) { alert("Please enter a valid 4-digit birth year."); return; }

      // If full date is required, check validity
      if (dobConfig.day && dobConfig.month && dobConfig.year && errors.dob) {
        alert(errors.dob);
        return;
      }
    }

    // 3. Gender Mismatch Check
    if (!hasConfirmedGender) {
      const detected = detectGenderFromName(formData.firstName);
      if (detected !== 'unknown' && detected !== formData.gender) {
        setShowGenderWarning(true);
        return;
      }
    }

    if (formData.firstName && formData.lastName && isDobReady && formData.gender) {
      proceedToMatch();
    }
  };

  const handleGenderConfirm = () => {
    setHasConfirmedGender(true);
    setShowGenderWarning(false);
    proceedToMatch();
  };

  const reset = () => {
    setFormData({ firstName: '', lastName: '', dob: '', gender: '' });
    setDobParts({ day: '', month: '', year: '' });
    setErrors({});
    setResult(null);
    setStep('intro');
    setHasConfirmedGender(false);
    setShowGenderWarning(false);
    setIsMasterAuthenticated(false);
  };

  return (
    <div className="app-container">
      <AnimatePresence>
        {isPreloading && <Preloader onFinish={() => setIsPreloading(false)} />}
      </AnimatePresence>
      <HeartParticles />
      <ShootingStars />
      <MagicTrail />

      <AnimatePresence>
        {showAbout && (
          <div className="modal-overlay" onClick={() => setShowAbout(false)}>
            <motion.div
              className="glass-card about-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="valentine-badge">The Technology 🧬</div>
              <h2 className="about-title">About Love Finder AI</h2>

              <div className="about-content">
                <section>
                  <h3><Stars size={16} /> The Cosmic Engine</h3>
                  <p>Our proprietary <strong>Cosmic AI Engine</strong> doesn't just match names. It uses <strong>Gemini 2.0 Flash</strong> to analyze the phonetic vibration of your name against current astrological alignments (Transit Astrology).</p>
                </section>

                <section>
                  <h3><Sparkles size={16} /> How it Works</h3>
                  <p>When you enter your details, we generate a high-dimensional vector of your "Astro-Signature". Our AI then scans a synthetic database of soulmate archetypes to find the one whose frequency matches your own unique energy.</p>
                </section>

                <section>
                  <h3><Heart size={16} /> Our Vision</h3>
                  <p>In a world of swiping, we believe in <strong>destiny</strong>. This tool is designed to bring back the magic of Valentine's—reminding you that somewhere in the multiverse, there is a perfect match tailored just for you.</p>
                </section>
              </div>

              <button onClick={() => setShowAbout(false)} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
                Understood ✨
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">

        {/* INTRO STEP */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card intro-card"
          >
            <div className="top-actions">
              <div className="valentine-badge">Valentine's 2026 Special 💖</div>
              <button
                onClick={() => setShowAbout(true)}
                className="info-trigger"
                title="How it Works"
              >
                <Stars size={16} />
              </button>
            </div>

            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="intro-icon heart-glow"
            >
              <Heart size={48} className="heart-icon" />
            </motion.div>

            <h1 className="title-gradient">Love Finder <span className="ai-tag">AI</span></h1>

            <p className="subtitle" style={{ marginTop: '0.5rem' }}>
              Our advanced <strong>Cosmic Engine</strong> analyzes your unique vibration to find your perfect astrological match.
            </p>

            <div className="process-flow">
              <div className="process-step">
                <div className="step-number">1</div>
                <div className="step-info">
                  <span className="step-title">Share Details</span>
                  <span className="step-desc">Enter your birth details & name</span>
                </div>
              </div>
              <div className="process-line" />
              <div className="process-step">
                <div className="step-number">2</div>
                <div className="step-info">
                  <span className="step-title">AI Analysis</span>
                  <span className="step-desc">Gemini AI maps your destiny</span>
                </div>
              </div>
              <div className="process-line" />
              <div className="process-step">
                <div className="step-number">3</div>
                <div className="step-info">
                  <span className="step-title">Get Matched</span>
                  <span className="step-desc">Reveal your true Valentine</span>
                </div>
              </div>
            </div>

            <div className="feature-badges">
              <div className="feature-item">
                <Sparkles size={14} /> AI Powered
              </div>
              <div className="feature-item">
                <Stars size={14} /> Astro Maps
              </div>
              <div className="feature-item">
                <Heart size={14} /> 99% Match
              </div>
            </div>

            <button onClick={handleStart} className="btn-primary start-btn group" style={{ width: '100%', marginTop: '1rem' }}>
              Start My Reveal
              <ArrowRight className="arrow-icon" />
            </button>
            <p className="footer-note">Free for Valentine's Week • 100k+ Matches Found</p>
          </motion.div>
        )}

        {/* FORM STEP */}
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card form-card"
          >
            <div className="form-header-premium">
              <div className="valentine-badge">Phase 1: Calibration 📡</div>
              <h2 className="section-title-premium">
                <Sparkles className="sparkle-icon" /> Quantum Alignment
              </h2>
              <p className="form-subtitle">Enter your vibrational data to begin the match-making sequence.</p>

              <div className="form-mini-progress">
                <div className="mini-step active">Name</div>
                <div className="mini-step-line active"></div>
                <div className="mini-step active">Birth</div>
                <div className="mini-step-line active"></div>
                <div className="mini-step active">Essence</div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="form-content-premium">
              {/* Name Section */}
              <div className="form-section">
                <div className="section-label">
                  <User size={14} /> <span>Personal Identification</span>
                </div>
                <div className="form-grid">
                  <div className="input-field-premium">
                    <input
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`form-input-p ${errors.firstName ? 'error' : formData.firstName && !errors.firstName ? 'success' : ''}`}
                      placeholder="First Name"
                    />
                    <label className="input-label-p">First Name</label>
                    {errors.firstName && <span className="input-error-p">{errors.firstName}</span>}
                  </div>
                  <div className="input-field-premium">
                    <input
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`form-input-p ${errors.lastName ? 'error' : formData.lastName && !errors.lastName ? 'success' : ''}`}
                      placeholder="Last Name"
                    />
                    <label className="input-label-p">Last Name</label>
                    {errors.lastName && <span className="input-error-p">{errors.lastName}</span>}
                  </div>
                </div>
              </div>

              {/* DOB Section */}
              <div className="form-section">
                <div className="section-label">
                  <Stars size={14} /> <span>Temporal Origin</span>
                </div>

                {!dobConfig.anyRequired ? (
                  <div className="special-notice-p" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <Sparkles size={14} className="sparkle-icon" />
                    <span>if have only one person with this name in india then don't need to set your date of birth</span>
                  </div>
                ) : dobConfig.isCheat ? (
                  <div className="special-notice-p" style={{ animation: 'fadeIn 0.5s ease-out', borderStyle: 'solid', borderColor: 'rgba(255, 77, 109, 0.2)' }}>
                    <TriangleAlert size={14} className="sparkle-icon" style={{ color: '#fbbf24' }} />
                    <span>Multiple persons with this name found. Please provide your birth <strong>{requiredFields}</strong> below to identify your unique cosmic signature.</span>
                  </div>
                ) : null}

                {dobConfig.anyRequired && (
                  <div className="dob-container-p" style={{
                    marginTop: dobConfig.isCheat ? '1rem' : '0',
                    gridTemplateColumns: `${dobConfig.month ? '2fr' : ''} ${dobConfig.day ? '1fr' : ''} ${dobConfig.year ? '1.5fr' : ''}`.trim() || '1fr'
                  }}>
                    {dobConfig.month && (
                      <div className="dob-field" ref={monthRef}>
                        <div
                          onClick={() => setIsMonthOpen(!isMonthOpen)}
                          className={`form-input-p dob-select ${isMonthOpen ? 'focused' : ''} ${dobParts.month !== "" ? 'success' : ''}`}
                        >
                          {dobParts.month !== '' ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(dobParts.month)] : "Month"}
                          <div className={`dropdown-arrow ${isMonthOpen ? 'open' : ''}`}>▾</div>
                        </div>
                        <AnimatePresence>
                          {isMonthOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 5 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="custom-dropdown-list-p"
                            >
                              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                                <div
                                  key={m}
                                  className={`dropdown-item-p ${dobParts.month === i.toString() ? 'active' : ''}`}
                                  onClick={() => {
                                    setDobParts({ ...dobParts, month: i.toString() });
                                    setIsMonthOpen(false);
                                    if (dobConfig.day) dayRef.current?.focus();
                                    else if (dobConfig.year) yearRef.current?.focus();
                                  }}
                                >
                                  {m}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {dobConfig.day && (
                      <div className="dob-field">
                        <input
                          ref={dayRef}
                          type="number"
                          placeholder="DD"
                          value={dobParts.day}
                          onChange={(e) => {
                            let val = e.target.value.slice(0, 2);
                            const num = parseInt(val);
                            if (!isNaN(num) && num > 31) val = '31';
                            setDobParts({ ...dobParts, day: val });
                            if (dobConfig.year && (val.length === 2 || (num > 3 && num <= 31))) yearRef.current?.focus();
                          }}
                          className="form-input-p center-text"
                        />
                      </div>
                    )}

                    {dobConfig.year && (
                      <div className="dob-field">
                        <input
                          ref={yearRef}
                          type="number"
                          placeholder="YYYY"
                          value={dobParts.year}
                          onChange={(e) => {
                            let val = e.target.value.slice(0, 4);
                            const currentYear = new Date().getFullYear();
                            if (val.length === 4 && parseInt(val) > currentYear) val = currentYear.toString();
                            setDobParts({ ...dobParts, year: val });
                          }}
                          className="form-input-p center-text"
                        />
                      </div>
                    )}
                  </div>
                )}
                {dobConfig.anyRequired && dobConfig.day && dobConfig.month && dobConfig.year && errors.dob && (
                  <span className="input-error-p" style={{ textAlign: 'center', marginTop: '0.5rem' }}>{errors.dob}</span>
                )}
              </div>

              {/* Gender Section */}
              <div className="form-section">
                <div className="section-label">
                  <Heart size={14} /> <span>Energy Essence</span>
                </div>
                <div className="gender-grid-p">
                  {['male', 'female'].map((g) => {
                    const isCreatorMatch = (formData.firstName.trim().toLowerCase() + " " + formData.lastName.trim().toLowerCase()) === "prince sanchela";
                    const isDisabled = isCreatorMatch && g === 'female';

                    return (
                      <button
                        key={g}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setFormData({ ...formData, gender: g as Gender })}
                        className={`gender-option-p ${formData.gender === g ? 'active' : ''} ${isDisabled ? 'disabled-creator' : ''}`}
                      >
                        <div className="option-indicator"></div>
                        <span className="capitalize">{isDisabled ? 'Locked' : g}</span>
                        {isDisabled && <TriangleAlert size={12} style={{ marginLeft: '4px' }} />}
                      </button>
                    );
                  })}
                </div>
                {(formData.firstName.trim().toLowerCase() + " " + formData.lastName.trim().toLowerCase()) === "prince sanchela" && (
                  <p className="creator-notice">⚠️ Creator Detected: Gender forced to Male.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!formData.firstName || !formData.lastName || !isDobReady || !formData.gender || !!errors.firstName || !!errors.lastName || (dobConfig.day && dobConfig.month && dobConfig.year && !!errors.dob)}
                className="btn-primary-p group"
              >
                <motion.div
                  className="btn-inner"
                  animate={formData.gender ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={18} />
                  Find My Soulmate
                </motion.div>
                <div className="btn-glow"></div>
              </button>

              <button type="button" onClick={reset} className="back-link">
                Change mind? Return to Start
              </button>
            </form>
          </motion.div>
        )}

        {/* LOADING STEP */}
        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            className="glass-card loading-card-romantic"
          >
            <div className="love-loader-container">
              {/* Soft Heart Ripples */}
              <div className="heart-ripples">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="romantic-ripple"
                    animate={{
                      scale: [1, 2],
                      opacity: [0.5, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.8,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>

              {/* Pulsing Magic Heart */}
              <div className="loader-core-romantic">
                <motion.div
                  className="core-inner-romantic"
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart size={48} className="romantic-heart-icon" fill="currentColor" />
                </motion.div>

                {/* Dreamy Sparkles */}
                <div className="dreamy-sparkles">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="sparkle-dot-romantic"
                      animate={{
                        y: [-20, -100],
                        x: [0, (i % 2 === 0 ? 30 : -30)],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeOut"
                      }}
                      style={{
                        left: '50%',
                        bottom: '50%'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="loading-content-romantic">
              <motion.h2
                className="romantic-loading-text"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {loadingText === "Syncing with Cosmic Soul..." ? "Consulting the Stars..." : loadingText}
              </motion.h2>
              <div className="romantic-status">
                <Sparkles size={16} className="magic-sparkle" />
                <span>Weaving Your Destiny...</span>
              </div>
              <p className="romantic-hint">Finding the heart that beats in rhythm with yours</p>
            </div>
          </motion.div>
        )}

        {/* RESULT STEP */}
        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card ${result.matchName === 'MASTER ARCHITECT' ? 'master-card-container' : result.isAlone ? 'alone-card-container' : 'result-card'}`}
          >
            {result.matchName === 'MASTER ARCHITECT' ? (
              <div className="master-mode-v4">
                <div className="reality-ripple" />
                <div className="particle-swarm">
                  {/* Ambient background handled by CSS */}
                </div>

                <AnimatePresence mode="wait">
                  {!isMasterAuthenticated ? (
                    <motion.div
                      key="auth"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 1.2, filter: 'blur(50px)' }}
                      className="auth-screen-divine"
                    >
                      <div className="divine-aura-container">
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            className={`aura-ring aura-${(i % 3) + 1}`}
                            animate={{
                              rotate: i % 2 === 0 ? 360 : -360,
                              scale: [1, 1.15, 1],
                              opacity: [0.2, 0.5, 0.2]
                            }}
                            transition={{
                              duration: 5 + i * 3,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                        ))}
                        <div className="divine-core">
                          <div className="core-glow" />
                          <Heart size={90} className="divine-heart-icon" fill="currentColor" />
                        </div>
                      </div>
                      <motion.h2
                        animate={{ letterSpacing: ['4px', '12px', '4px'] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="shimmer-text"
                      >
                        RESTRUCTURING REALITY...
                      </motion.h2>
                      <div className="auth-progress-v4" style={{ height: '6px', background: 'rgba(255,215,0,0.05)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 3, ease: "easeInOut" }}
                          onAnimationComplete={() => setIsMasterAuthenticated(true)}
                          className="auth-fill-v4"
                          style={{ background: 'linear-gradient(90deg, #ff4d6d, #ffd700, #ff4d6d)' }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hud"
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="divine-hud"
                    >
                      <div className="divine-profile">
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          <Stars size={50} style={{ color: '#ffd700', marginBottom: '1rem' }} />
                        </motion.div>
                        <h1 className="divine-name">PRINCE SANCHELA</h1>
                        <span className="divine-title">Divine Grandmaster Architect</span>
                      </div>

                      <div className="oversmart-warning">
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="warning-main-text">⚠️ SYSTEM ALERT: Master Se Chalaki Nhi</div>
                          <p className="warning-sub-text">
                            "Don't be oversmart with Prince Sanchela. The source code of your destiny is already under his command."
                          </p>
                        </motion.div>
                      </div>

                      <div className="divine-stats-board">
                        <div className="divine-stat-card">
                          <span className="stat-label-divine">Rank</span>
                          <span className="stat-value-divine">Supreme</span>
                        </div>
                        <div className="divine-stat-card">
                          <span className="stat-label-divine">Power</span>
                          <span className="stat-value-divine">Absolute</span>
                        </div>
                        <div className="divine-stat-card">
                          <span className="stat-label-divine">Access</span>
                          <span className="stat-value-divine">Root</span>
                        </div>
                      </div>

                      <button onClick={reset} className="divine-reset-btn">
                        <RefreshCcw size={22} /> RESTART
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : result.isAlone ? (
              <div className="alone-mode-v4">
                <div className="alone-badge-inline">Love Not Found 🌑</div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="alone-icon-container"
                >
                  <HeartOff size={80} className="broken-heart-icon-v2" />
                </motion.div>

                <div className="alone-header-v4">
                  <span className="alone-subtitle-v4">A Special Message</span>
                  <h1 className="alone-title-v4">Self-Love Season</h1>
                </div>

                <div className="void-message-box">
                  <p className="void-quote">
                    "{result.message}"
                  </p>
                  <div className="moon-phase">
                    <Moon size={14} />
                    <span>A peaceful time to focus on you.</span>
                  </div>
                </div>

                <button onClick={reset} className="alone-reset-btn">
                  <RefreshCcw size={18} /> Restart My Journey
                </button>
              </div>
            ) : (

              <>
                <div className="valentine-badge">Love Found! 💖</div>
                <div className="result-header">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="heart-badge"
                  >
                    <Heart size={40} className="fill-white" />
                  </motion.div>
                  <h3 className="match-label">Ideally Matched With</h3>
                  <h1 className="match-name">{result.matchName}</h1>
                </div>

                <div className="result-body">
                  <div className="stats-container">
                    <div className="stat-box left">
                      <p className="stat-label">Compatibility</p>
                      <p className="stat-value">{result.compatibility}%</p>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-box right">
                      <p className="stat-label">Their Star Sign</p>
                      <p className="stat-value">
                        {result.zodiac} <span style={{ fontSize: '1.25rem', verticalAlign: 'middle', marginLeft: '0.25rem' }}>{getZodiacIcon(result.zodiac)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="zodiac-insight-box">
                    <p className="zodiac-insight-title">
                      What is a {result.zodiac}?
                    </p>
                    <p className="zodiac-insight-text">{result.zodiacTraits}</p>
                  </div>

                  <div className="message-box">
                    <h4 className="message-title">
                      <Stars size={18} /> Cosmic Message
                    </h4>
                    <p className="message-text">"{result.message}"</p>
                  </div>

                  <button onClick={reset} className="btn-secondary group">
                    <RefreshCcw size={18} className="refresh-icon group-hover-rotate" />
                    Find Another Match
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGenderWarning && (
          <motion.div
            className="warning-toast-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="warning-toast"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <TriangleAlert className="warning-icon" size={48} />
              <h3 className="warning-title">Gender Dissonance?</h3>
              <p className="warning-message">
                Our cosmic database suggests that the name "{formData.firstName}" is traditionally {detectGenderFromName(formData.firstName)}.
                Please confirm if you want to proceed with the selected gender.
              </p>
              <div className="warning-actions">
                <button
                  className="warning-btn warning-btn-cancel"
                  onClick={() => setShowGenderWarning(false)}
                >
                  Correct It
                </button>
                <button
                  className="warning-btn warning-btn-confirm"
                  onClick={handleGenderConfirm}
                >
                  Continue Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
