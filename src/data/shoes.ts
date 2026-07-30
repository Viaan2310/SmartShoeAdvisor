export type ActivityId = 'school' | 'running' | 'sports' | 'walking' | 'casual';

export type FootTypeId = 'normal_arch' | 'high_arch' | 'flat_foot' | 'overpronation' | 'supination';

export interface Activity {
  id: ActivityId;
  label: string;
  emoji: string;
  gradient: string;
  glow: string;
  icon: string;
  description: string;
}

export const activities: Activity[] = [
  {
    id: 'school',
    label: 'School',
    emoji: '🏫',
    gradient: 'from-blue-500 to-indigo-500',
    glow: 'shadow-blue-500/40',
    icon: 'GraduationCap',
    description: 'Long hours of walking and standing',
  },
  {
    id: 'running',
    label: 'Running',
    emoji: '🏃',
    gradient: 'from-orange-500 to-red-500',
    glow: 'shadow-orange-500/40',
    icon: 'Footprints',
    description: 'High-impact cardio and training',
  },
  {
    id: 'sports',
    label: 'Sports',
    emoji: '⚽',
    gradient: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/40',
    icon: 'Trophy',
    description: 'Agility, court & field sports',
  },
  {
    id: 'walking',
    label: 'Walking',
    emoji: '🚶',
    gradient: 'from-teal-500 to-cyan-500',
    glow: 'shadow-teal-500/40',
    icon: 'PersonStanding',
    description: 'Daily steps and light walks',
  },
  {
    id: 'casual',
    label: 'Casual',
    emoji: '🎉',
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/40',
    icon: 'Sparkles',
    description: 'Everyday lifestyle and fashion',
  },
];

export interface FootType {
  id: FootTypeId;
  label: string;
  shortLabel: string;
  description: string;
  recommendation: string;
  prevalence: string;
  icon: string;
  color: string;
}

export const footTypes: Record<FootTypeId, FootType> = {
  normal_arch: {
    id: 'normal_arch',
    label: 'Normal Arch',
    shortLabel: 'Normal',
    description: 'Your foot has a medium arch that flexes naturally. Weight distributes evenly across the foot during movement, making you versatile across most shoe types.',
    recommendation: 'Neutral cushioning shoes work best. Most standard footwear suits your foot type without needing specialized support.',
    prevalence: '~60% of people',
    icon: 'Activity',
    color: 'from-green-500 to-emerald-500',
  },
  high_arch: {
    id: 'high_arch',
    label: 'High Arch',
    shortLabel: 'High',
    description: 'Your foot has a pronounced arch that stays rigid under weight. This can reduce shock absorption, so extra cushioning helps protect joints during impact.',
    recommendation: 'Look for highly cushioned shoes with a curved last. Avoid stiff motion-control shoes that can feel uncomfortable.',
    prevalence: '~20% of people',
    icon: 'TrendingUp',
    color: 'from-blue-500 to-cyan-500',
  },
  flat_foot: {
    id: 'flat_foot',
    label: 'Flat Foot',
    shortLabel: 'Flat',
    description: 'Your foot has little or no visible arch, causing it to roll inward (overpronate). Stability and motion-control features help correct this alignment.',
    recommendation: 'Choose stability or motion-control shoes with firm midsoles and medial support to prevent over-rolling.',
    prevalence: '~15% of people',
    icon: 'TrendingDown',
    color: 'from-orange-500 to-amber-500',
  },
  overpronation: {
    id: 'overpronation',
    label: 'Overpronation',
    shortLabel: 'Overpronate',
    description: 'Your foot rolls inward excessively after heel strike. This stresses the big toe and can lead to knee and hip issues without proper support.',
    recommendation: 'Stability shoes with medial posts or guide rails help control inward roll and align your stride.',
    prevalence: '~3% of people',
    icon: 'RotateCw',
    color: 'from-red-500 to-rose-500',
  },
  supination: {
    id: 'supination',
    label: 'Supination (Underpronation)',
    shortLabel: 'Supinate',
    description: 'Your foot rolls outward, staying on the outer edge. Shock is poorly absorbed, making flexible cushioned shoes essential for joint protection.',
    recommendation: 'Flexible, well-cushioned neutral shoes with a curved last encourage natural inward roll.',
    prevalence: '~2% of people',
    icon: 'RotateCcw',
    color: 'from-purple-500 to-violet-500',
  },
};

export interface ShoeRecommendation {
  shoeName: string;
  brand: string;
  image: string;
  reason: string;
  comfort: number;
  support: number;
  durability: number;
  features: string[];
  priceRange: string;
  bestFor: FootTypeId[];
  tags: string[];
}

// Multiple shoes per activity, each with foot-type suitability
export const shoeCatalog: Record<ActivityId, ShoeRecommendation[]> = {
  school: [
    {
      shoeName: 'Nike Revolution 7',
      brand: 'Nike',
      image: 'https://images.pexels.com/photos/1456733/pexels-photo-1456733.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Soft foam midsole and breathable mesh upper keep feet comfortable through long school hours. The flexible outsole moves naturally with growing feet.',
      comfort: 9.5,
      support: 9.3,
      durability: 9.2,
      features: ['Breathable Mesh', 'Soft Foam Midsole', 'Flexible Outsole', 'All-Day Comfort'],
      priceRange: '₹5,400 - ₹7,100',
      bestFor: ['normal_arch', 'high_arch', 'supination'],
      tags: ['Best Seller', 'All-Day Wear'],
    },
    {
      shoeName: 'Adidas Duramo SL',
      brand: 'Adidas',
      image: 'https://images.pexels.com/photos/9207813/pexels-photo-9207813.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'LIGHTMOTION cushioning provides responsive comfort for walking between classes. The durable outsole handles daily wear on various school surfaces.',
      comfort: 9.2,
      support: 9.0,
      durability: 9.4,
      features: ['LIGHTMOTION Cushioning', 'Durable Outsole', 'Engineered Mesh', 'Lightweight'],
      priceRange: '₹5,800 - ₹7,500',
      bestFor: ['normal_arch', 'flat_foot', 'overpronation'],
      tags: ['Durable', 'Stability'],
    },
    {
      shoeName: 'New Balance 530',
      brand: 'New Balance',
      image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'ABZORB cushioning in heel and forefoot delivers superior shock absorption for all-day school comfort. Classic retro styling pairs with any uniform.',
      comfort: 9.4,
      support: 9.1,
      durability: 9.3,
      features: ['ABZORB Cushioning', 'Retro Style', 'Leather & Mesh', 'Shock Absorption'],
      priceRange: '₹6,600 - ₹9,100',
      bestFor: ['normal_arch', 'high_arch', 'supination'],
      tags: ['Retro', 'Premium'],
    },
  ],
  running: [
    {
      shoeName: 'Adidas Duramo SL',
      brand: 'Adidas',
      image: 'https://images.pexels.com/photos/9207813/pexels-photo-9207813.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Responsive LIGHTMOTION cushioning absorbs impact during runs while the breathable engineered mesh upper keeps feet cool mile after mile.',
      comfort: 9.4,
      support: 9.1,
      durability: 9.0,
      features: ['LIGHTMOTION Cushioning', 'Engineered Mesh', 'Impact Absorption', 'Energy Return'],
      priceRange: '₹5,800 - ₹7,900',
      bestFor: ['normal_arch', 'high_arch'],
      tags: ['Neutral', 'Daily Trainer'],
    },
    {
      shoeName: 'Nike Pegasus 41',
      brand: 'Nike',
      image: 'https://images.pexels.com/photos/12408524/pexels-photo-12408524.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'React foam and Air Zoom units deliver explosive energy return and responsive cushioning for tempo runs and long distances alike.',
      comfort: 9.6,
      support: 9.2,
      durability: 9.3,
      features: ['React Foam', 'Air Zoom Units', 'Breathable Flyknit', 'Energy Return'],
      priceRange: '₹11,600 - ₹13,300',
      bestFor: ['normal_arch', 'supination', 'high_arch'],
      tags: ['Premium', 'Performance'],
    },
    {
      shoeName: 'Asics Gel-Kayano 30',
      brand: 'Asics',
      image: 'https://images.pexels.com/photos/4490019/pexels-photo-4490019.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'FF Blast Plus Eco cushioning and Dynamic DuoMax support system control overpronation while delivering plush comfort for long runs.',
      comfort: 9.5,
      support: 9.7,
      durability: 9.4,
      features: ['FF Blast Plus Eco', 'Dynamic DuoMax', 'Stability System', 'Pronation Control'],
      priceRange: '₹13,300 - ₹14,900',
      bestFor: ['flat_foot', 'overpronation'],
      tags: ['Stability', 'Pronation Control'],
    },
    {
      shoeName: 'Brooks Ghost 16',
      brand: 'Brooks',
      image: 'https://images.pexels.com/photos/8147433/pexels-photo-8147433.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Balanced soft cushioning and a neutral ride make this ideal for runners who need versatile comfort without extra stability features.',
      comfort: 9.7,
      support: 8.8,
      durability: 9.2,
      features: ['DNA Loft v3', 'Segmented Crash Pad', 'Neutral Ride', 'Smooth Transitions'],
      priceRange: '₹11,600 - ₹12,400',
      bestFor: ['normal_arch', 'high_arch', 'supination'],
      tags: ['Neutral', 'Plush'],
    },
  ],
  sports: [
    {
      shoeName: 'Puma Flyer Runner',
      brand: 'Puma',
      image: 'https://images.pexels.com/photos/8497536/pexels-photo-8497536.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Dynamic lateral support and grippy rubber outsole provide stability for quick cuts, jumps, and pivots across multiple sport surfaces.',
      comfort: 9.2,
      support: 9.6,
      durability: 9.4,
      features: ['Lateral Support', 'Grippy Outsole', 'Multi-Surface Traction', 'Ankle Stability'],
      priceRange: '₹6,200 - ₹8,300',
      bestFor: ['normal_arch', 'flat_foot', 'overpronation'],
      tags: ['Versatile', 'Grippy'],
    },
    {
      shoeName: 'Nike Air Zoom Pegasus',
      brand: 'Nike',
      image: 'https://images.pexels.com/photos/8003531/pexels-photo-8003531.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Zoom Air units in the forefoot provide explosive responsiveness for sprints and jumps, while the secure lacing locks the foot down during lateral movements.',
      comfort: 9.3,
      support: 9.4,
      durability: 9.1,
      features: ['Zoom Air', 'Secure Lacing', 'Responsive', 'Breathable Upper'],
      priceRange: '₹10,800 - ₹12,400',
      bestFor: ['normal_arch', 'high_arch'],
      tags: ['Performance', 'Responsive'],
    },
    {
      shoeName: 'Under Armour HOVR Sonic',
      brand: 'Under Armour',
      image: 'https://images.pexels.com/photos/4271584/pexels-photo-4271584.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'HOVR foam provides a zero-gravity feel to reduce impact during high-intensity sports, with a connected fitness tracker for performance data.',
      comfort: 9.4,
      support: 9.2,
      durability: 9.0,
      features: ['HOVR Foam', 'Energy Web', 'Connected Sensor', 'Lightweight'],
      priceRange: '₹8,300 - ₹10,000',
      bestFor: ['normal_arch', 'supination', 'high_arch'],
      tags: ['Smart', 'Cushioned'],
    },
  ],
  walking: [
    {
      shoeName: 'Skechers GO Walk',
      brand: 'Skechers',
      image: 'https://images.pexels.com/photos/267301/pexels-photo-267301.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Ultra-lightweight Goga Mat insole with high-rebound cushioning designed specifically for the natural walking gait and all-day comfort.',
      comfort: 9.8,
      support: 8.9,
      durability: 9.1,
      features: ['Goga Mat Insole', 'Ultra Lightweight', 'Flex Groove Sole', 'Pillow-Soft Feel'],
      priceRange: '₹4,600 - ₹6,600',
      bestFor: ['normal_arch', 'high_arch', 'supination'],
      tags: ['Ultra Light', 'All-Day'],
    },
    {
      shoeName: 'New Balance Fresh Foam',
      brand: 'New Balance',
      image: 'https://images.pexels.com/photos/5488660/pexels-photo-5488660.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Fresh Foam midsole delivers plush cushioning tuned for walking, with a breathable upper and durable outsole for daily steps.',
      comfort: 9.6,
      support: 9.3,
      durability: 9.5,
      features: ['Fresh Foam', 'Breathable Upper', 'Durable Outsole', 'Bootie Construction'],
      priceRange: '₹7,500 - ₹10,000',
      bestFor: ['normal_arch', 'flat_foot', 'overpronation'],
      tags: ['Plush', 'Durable'],
    },
    {
      shoeName: 'Asics Gel-Contend',
      brand: 'Asics',
      image: 'https://images.pexels.com/photos/4219176/pexels-photo-4219176.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'GEL technology cushioning and an AmpliFoam midsole provide flexible comfort for walking, with good arch support for flat feet.',
      comfort: 9.3,
      support: 9.4,
      durability: 9.2,
      features: ['GEL Cushioning', 'AmpliFoam Midsole', 'Arch Support', 'Breathable Mesh'],
      priceRange: '₹5,000 - ₹6,600',
      bestFor: ['flat_foot', 'overpronation', 'normal_arch'],
      tags: ['Supportive', 'Value'],
    },
  ],
  casual: [
    {
      shoeName: 'Converse Chuck Taylor',
      brand: 'Converse',
      image: 'https://images.pexels.com/photos/1027130/pexels-photo-1027130.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Timeless canvas silhouette that pairs effortlessly with any outfit while offering a comfortable, broken-in feel from day one.',
      comfort: 8.7,
      support: 8.5,
      durability: 9.5,
      features: ['Classic Canvas', 'Iconic Style', 'Durable Rubber Sole', 'Versatile Look'],
      priceRange: '₹5,000 - ₹7,500',
      bestFor: ['normal_arch', 'high_arch'],
      tags: ['Iconic', 'Classic'],
    },
    {
      shoeName: 'Vans Old Skool',
      brand: 'Vans',
      image: 'https://images.pexels.com/photos/7295801/pexels-photo-7295801.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Iconic side stripe and durable canvas upper with a cushioned collar and signature waffle outsole for everyday grip and style.',
      comfort: 8.9,
      support: 8.8,
      durability: 9.6,
      features: ['Waffle Outsole', 'Padded Collar', 'Canvas & Suede', 'Skate Heritage'],
      priceRange: '₹5,400 - ₹7,100',
      bestFor: ['normal_arch', 'flat_foot'],
      tags: ['Street', 'Durable'],
    },
    {
      shoeName: 'Adidas Stan Smith',
      brand: 'Adidas',
      image: 'https://images.pexels.com/photos/11324518/pexels-photo-11324518.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Premium leather upper with a clean, minimalist design that works for any casual setting. The cupsole construction provides all-day comfort.',
      comfort: 9.0,
      support: 8.7,
      durability: 9.3,
      features: ['Premium Leather', 'Minimalist Design', 'Cupsole Construction', 'Timeless Style'],
      priceRange: '₹7,500 - ₹9,100',
      bestFor: ['normal_arch', 'high_arch', 'supination'],
      tags: ['Premium', 'Minimalist'],
    },
    {
      shoeName: 'Nike Air Force 1',
      brand: 'Nike',
      image: 'https://images.pexels.com/photos/8079829/pexels-photo-8079829.jpeg?auto=compress&cs=tinysrgb&w=800',
      reason: 'Nike Air cushioning and a durable leather upper deliver iconic street style with all-day comfort. The pivot point outsole adds versatility.',
      comfort: 9.2,
      support: 9.0,
      durability: 9.4,
      features: ['Air Cushioning', 'Leather Upper', 'Pivot Point Outsole', 'Classic Style'],
      priceRange: '₹8,300 - ₹10,800',
      bestFor: ['normal_arch', 'flat_foot', 'overpronation'],
      tags: ['Iconic', 'Cushioned'],
    },
  ],
};

export interface AnalysisResult {
  foot_length: string;
  shoe_size: { uk: string; us: string; eu: string };
  foot_type: FootTypeId;
  foot_type_label: string;
  foot_type_description: string;
  foot_type_recommendation: string;
  activity: ActivityId;
  activity_label: string;
  recommended_shoe: string;
  brand: string;
  image: string;
  reason: string;
  confidence: number;
  comfort: number;
  support: number;
  durability: number;
  features: string[];
  priceRange: string;
  tags: string[];
  alternatives: Array<{
    shoeName: string;
    brand: string;
    image: string;
    reason: string;
    comfort: number;
    support: number;
    durability: number;
    priceRange: string;
    tags: string[];
  }>;
  arch_height: string;
  pronation: string;
  ruler_detected: boolean;
}
