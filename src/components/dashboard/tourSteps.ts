import {
  Package, Store, Droplets, MessageSquare, Sparkles, MapPin,
  UserPlus, ClipboardList, Send, BarChart3, FileText,
  Sprout, UsersRound, Rocket, Eye, Heart, Activity, CheckSquare, ShieldCheck
} from 'lucide-react';
import type { SpotlightStep } from './SpotlightTour';

export const individualSpotlightSteps: SpotlightStep[] = [
  {
    target: 'nav-trade-centre',
    title: 'Trade Centre',
    body: 'This is where you buy your farming kit. Tap here to browse kits and place your order. Your Batch 1 kit is \u20A624,999.',
    icon: Store,
    iconBg: 'from-green-400 to-emerald-600',
  },
  {
    target: 'kit-overview',
    title: 'Activate Your Kit',
    body: 'Once your kit arrives, tap "Activate Kit" and enter the code from inside your kit box. Your 3 seedlings will appear on your dashboard instantly.',
    icon: Package,
    iconBg: 'from-amber-400 to-orange-500',
  },
  {
    target: 'plant-area',
    title: 'Your Seedlings',
    body: 'After activation, your plant cards appear here. Tap any plant to log activities like watering, fertilising, or observations. Daily reminders keep you on track.',
    icon: Droplets,
    iconBg: 'from-sky-400 to-blue-600',
  },
  {
    target: 'nav-agronomist',
    title: 'Sannu (AI Agronomist)',
    body: 'Got a question about your plants? Tap here to chat with the Sannu (AI Agronomist) \u2014get expert advice on pests, diseases, soil, and care. Available 24/7.',
    icon: MessageSquare,
    iconBg: 'from-cyan-400 to-blue-500',
  },
  {
    target: 'quick-actions',
    title: 'Quick Actions',
    body: 'These shortcuts give you fast access to Achievements, Trade Centre, Sannu (AI Agronomist), and Open Programs. Explore them all from here.',
    icon: Sparkles,
    iconBg: 'from-amber-400 to-yellow-500',
  },
  {
    target: 'nav-profile',
    title: 'Complete Your Profile',
    body: 'Tap your avatar to add your location and farming preferences. This unlocks climate-specific tips and personalised guidance from the Sannu (AI Agronomist).',
    icon: MapPin,
    iconBg: 'from-rose-400 to-pink-600',
  },
];

export const familySpotlightSteps: SpotlightStep[] = [
  {
    target: 'family-panel',
    title: 'Your Family Group',
    body: 'This is your family command centre. Tap "Add Member" to invite family or friends. Enter each person\u2019s name, relationship, and phone number.',
    icon: UserPlus,
    iconBg: 'from-blue-400 to-blue-600',
  },
  {
    target: 'nav-trade-centre',
    title: 'Buy Kits for Members',
    body: 'Each family member needs their own kit (one kit = 3 seedlings). Tap here to purchase kits for your group.',
    icon: Store,
    iconBg: 'from-green-400 to-emerald-600',
  },
  {
    target: 'kit-overview',
    title: 'Activate Member Kits',
    body: 'When kits arrive, tap "Activate Kit" for each one. Enter the code from the box, then assign the plants to specific family members from the Family panel.',
    icon: Package,
    iconBg: 'from-amber-400 to-orange-500',
  },
  {
    target: 'plant-area',
    title: 'Family\u2019s Plants',
    body: 'All your family\u2019s plants appear here. Tap any plant to log care activities. Unassigned plants show in amber \u2014assign them from the Family panel above.',
    icon: Droplets,
    iconBg: 'from-sky-400 to-blue-600',
  },
  {
    target: 'nav-agronomist',
    title: 'Get Expert Guidance',
    body: 'The Sannu (AI Agronomist) is available to everyone in your group. Tap here for advice on pests, watering, soil conditions, and more.',
    icon: MessageSquare,
    iconBg: 'from-cyan-400 to-blue-500',
  },
  {
    target: 'quick-actions',
    title: 'Explore More',
    body: 'Earn badges in Achievements, browse Open Programs for group farming opportunities, and visit the Trade Centre for supplies.',
    icon: Sparkles,
    iconBg: 'from-amber-400 to-yellow-500',
  },
];

export const individualPostDemoSteps: SpotlightStep[] = [
  {
    target: 'plant-area',
    title: 'Your Demo Seedlings',
    body: 'Here are 3 demo seedlings to practice with. Tap any plant card to open it, then log activities like watering, fertilising, and pest checks.',
    icon: Sprout,
    iconBg: 'from-emerald-400 to-emerald-600',
  },
  {
    target: 'nav-agronomist',
    title: "You're All Set!",
    body: "Your demo farm is live. Explore your plants, try the Sannu (AI Agronomist), and get comfortable before your real kit arrives.",
    icon: Rocket,
    iconBg: 'from-amber-400 to-orange-500',
  },
];

export const familyPostDemoSteps: SpotlightStep[] = [
  {
    target: 'family-panel',
    title: 'Meet Your Demo Family',
    body: "We've set up a demo family group with two members: Mama Adaeze and Chukwuemeka. Each has their own seedling, plus one for you. Tap any member to see their plants.",
    icon: UsersRound,
    iconBg: 'from-blue-400 to-blue-600',
  },
  {
    target: 'plant-area',
    title: "Everyone's Plants Are Here",
    body: "All 3 family plants appear here. Each card shows who it belongs to. Tap any plant to log care activities on their behalf.",
    icon: Sprout,
    iconBg: 'from-emerald-400 to-emerald-600',
  },
];

export const orgPostDemoSteps: SpotlightStep[] = [
  {
    target: 'program-list',
    title: 'Your Demo Program Is Live',
    body: "We've created a published program called \"Youth Farming Initiative\" targeting 50 participants. Click it to open the program management page \u2014you'll see tabs for Applications, Participants, and Invites.",
    icon: ClipboardList,
    iconBg: 'from-amber-400 to-amber-600',
  },
  {
    target: 'org-stats',
    title: 'Your Dashboard Updates Live',
    body: "These metrics track your programs in real time. As participants apply and join, you'll see numbers change here. The demo program is already counted under Published Programs.",
    icon: BarChart3,
    iconBg: 'from-teal-400 to-cyan-600',
  },
  {
    target: 'org-quick-actions',
    title: 'Monitor & Manage Participants',
    body: "Once participants join and start farming, a \"Monitor\" tab appears in the top menu. From there you can track each participant's health score, care compliance, watering streak, and send encouragement or appreciation badges.",
    icon: Activity,
    iconBg: 'from-blue-400 to-blue-600',
  },
  {
    target: 'org-trade-centre',
    title: 'Next Step: Buy Kits',
    body: "Visit the Trade Centre to purchase kits in bulk. After buying, assign activation codes to accepted participants from the program page. They'll activate from their own dashboards and start farming!",
    icon: Package,
    iconBg: 'from-orange-400 to-red-500',
  },
  {
    target: 'new-program',
    title: "You're All Set!",
    body: "Explore the demo program, then create your real program when ready. You can publish it so farmers across Nigeria can discover and apply, or set it to Invite Only for a controlled group.",
    icon: Rocket,
    iconBg: 'from-emerald-400 to-emerald-600',
  },
];

export const orgSpotlightSteps: SpotlightStep[] = [
  {
    target: 'org-stats',
    title: 'Your Impact Dashboard',
    body: "This is your command centre. These four cards show your total programs, active participants, pending applications, and published programs \u2014all updating in real time as your initiative grows.",
    icon: BarChart3,
    iconBg: 'from-teal-400 to-cyan-600',
  },
  {
    target: 'new-program',
    title: 'Step 1: Create a Program',
    body: 'Click here to create a new farming program. You\'ll set a name, description, target number of participants, start date, and choose "Open" (anyone can apply) or "Invite Only" for a controlled group.',
    icon: Send,
    iconBg: 'from-emerald-400 to-emerald-600',
  },
  {
    target: 'program-list',
    title: 'Step 2: Manage Your Programs',
    body: "Your programs appear here. Click any program to open its management page where you can:\n\u2022 Review and accept/reject applications\n\u2022 View the participants list\n\u2022 Assign kits to accepted participants\n\u2022 Send invites for private programmes",
    icon: FileText,
    iconBg: 'from-blue-400 to-blue-600',
  },
  {
    target: 'org-trade-centre',
    title: 'Step 3: Purchase Kits',
    body: 'Once you have accepted participants, visit the Trade Centre to buy kits in bulk. You can then assign individual activation codes to each participant from the program page.',
    icon: Package,
    iconBg: 'from-orange-400 to-red-500',
  },
  {
    target: 'nav-programs',
    title: 'Step 4: Monitor Progress',
    body: 'After participants activate their kits and start logging care, a "Monitor" tab appears here. The Participant Monitor shows health scores, care streaks, watering compliance, and highlights who needs support.',
    icon: Activity,
    iconBg: 'from-sky-400 to-blue-600',
  },
  {
    target: 'org-quick-actions',
    title: 'Step 5: Encourage & Appreciate',
    body: "From the Monitor page, you can send encouragement messages to struggling participants and award appreciation badges to top performers. These show up as notifications on their dashboards \u2014a powerful motivator!",
    icon: Heart,
    iconBg: 'from-rose-400 to-pink-500',
  },
  {
    target: 'nav-trade-centre',
    title: 'The Full Workflow',
    body: "Here's the complete flow: Create Program > Publish > Receive Applications > Accept Participants > Buy & Assign Kits > Monitor Progress > Encourage & Appreciate. You're now ready to manage a farming initiative from start to finish!",
    icon: ShieldCheck,
    iconBg: 'from-emerald-500 to-green-600',
  },
];
