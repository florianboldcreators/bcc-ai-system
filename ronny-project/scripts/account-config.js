// Account Configuration — Ronny Project
// Each account gets its own GoLogin profile = own IP + fingerprint

const GOLOGIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWJmZjUyZWVmNmJlZTBjOWFiODI3YWMiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2OWJmZjg3MDg5MmM0YzYwNDAzZDU1MWEifQ.I_YhTlf1KPEhX8NPZ_ehm5DMGjveOyC7FgvEAO9pa-0';

const ACCOUNTS = {
  tiktok: [
    {
      id: 'tyler',
      username: 'tyler.westbrook94',
      email: 'tylerwestbrook94@proton.me',
      password: 'Tw_Secure94!',
      gologin_profile: '69c2370f15ad6c33e2e4dd0a', // jake-miller-tiktok
      platform: 'tiktok',
      niche: ['bmw', 'porsche', 'drift', 'supercars'],
      bio: 'Car enthusiast 🚗 | BMW lover | Living life at full throttle',
      persona: { age: 32, style: 'casual american male', interests: ['cars', 'motorsport', 'travel'] }
    },
    {
      id: 'chloe',
      username: 'kimvirginiaaah._',
      email: 'chloemarie.santos@proton.me',
      password: 'Cm_Secure88!',
      gologin_profile: '69c23716ac926b95f05793a9', // chris-taylor-tiktok (currently active for Chloe)
      platform: 'tiktok',
      niche: ['bmw', 'porsche', 'caredit', 'supercar'],
      bio: 'Car girl 🔥 | Speed & style | Living fast ✨',
      persona: { age: 38, style: 'latina female', interests: ['cars', 'fashion', 'lifestyle'] }
    },
    {
      id: 'marcus',
      username: 'user4783749392230',
      email: 'marcus.reed.1991@proton.me',
      password: 'Mr_Secure91!',
      gologin_profile: '69c237127961c960feb0f7c1', // mike-davis-tiktok
      platform: 'tiktok',
      niche: ['bmw', 'm4', 'drift', 'exhaust'],
      bio: 'Marcus | BMW M-Series obsessed 🏎️ | Track days & weekend drives',
      persona: { age: 35, style: 'american male', interests: ['bmw', 'track', 'cars'] }
    },
    {
      id: 'sophia',
      username: 'user4148459812842',
      email: 'sophiakimx@proton.me',
      password: 'Sk_Secure99!',
      gologin_profile: '69c237114f7abb90b3b43fd2', // sarah-johnson-tiktok
      platform: 'tiktok',
      niche: ['porsche', 'ferrari', 'supercar', 'luxury'],
      bio: 'Sophia ✨ | Luxury cars & city life | Porsche 🖤',
      persona: { age: 27, style: 'asian-american female', interests: ['luxury cars', 'lifestyle', 'travel'] }
    }
  ],
  instagram: [
    {
      id: 'emma',
      username: 'emma_wilson2282',
      password: 'Ig_Acc_KUSiZoGx',
      phone: '+1 228 225 4159',
      gologin_profile: '69c23704cc8fa9d5e56e1e0b', // emma-wilson-tiktok
      platform: 'instagram',
      niche: ['cars', 'bmw', 'lifestyle'],
      bio: '🚗 Car lover | Adventures & drives | Emma',
      persona: { age: 29, style: 'american female' }
    },
    {
      id: 'alex',
      username: 'alexrivers2026',
      password: 'Ig_Acc_Cm8Vn6u',
      gologin_profile: '69c2371056dcebe4dbe5a685', // alex-rivers-tiktok
      platform: 'instagram',
      niche: ['cars', 'drift', 'street'],
      bio: 'Alex Rivers 🔥 | Street cars & drift | West Coast',
      persona: { age: 28, style: 'american male' }
    },
    {
      id: 'jake',
      username: 'jakemiller3fa4fe64',
      password: 'Ig_Acc_feOqsXrm',
      phone: '+1 2155406747',
      gologin_profile: '69c2370f15ad6c33e2e4dd0a', // jake-miller-tiktok (shared with tyler? use different)
      platform: 'instagram',
      niche: ['bmw', 'porsche', 'cargram'],
      bio: 'Jake Miller 🏎️ | BMW & Porsche | Car photography',
      persona: { age: 31, style: 'american male' }
    }
  ]
};

// Human-like timing constants
const TIMING = {
  between_videos: [8000, 22000],      // 8-22 sec watch time
  between_likes: [3000, 8000],        // 3-8 sec between likes
  between_accounts: [60000, 180000],  // 1-3 min between account sessions
  session_length: [8, 15],            // 8-15 actions per session
  daily_limits: {
    likes: 45,
    follows: 4,
    comments: 5,
    posts: 1
  }
};

// Content niches for training algorithm
const CAR_SEARCHES = [
  'bmw m4 drift', 'porsche 911 sound', 'supercar exhaust', 
  'bmw m series', 'ferrari acceleration', 'drift compilation',
  'car edit 4k', 'luxury cars', 'modified bmw', 'porsche gt3'
];

const IG_HASHTAGS = [
  '#bmw', '#porsche', '#supercar', '#carsofinstagram',
  '#bmwm4', '#drift', '#carlovers', '#carphotography',
  '#luxurycars', '#exoticcars'
];

module.exports = { ACCOUNTS, TIMING, CAR_SEARCHES, IG_HASHTAGS, GOLOGIN_TOKEN };
