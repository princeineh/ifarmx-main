import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Bot, Sparkles, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { sendMessageToGrok, getUserUsage, type UsageData } from '../services/grokService';

interface AgronomistPageProps {
  onNavigate: (page: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const LAUNCH_DATE = new Date('2026-04-01');

const culturalStories = [
  {
    title: 'The Palm Wine Tapper',
    story: `There's a saying among the Igbo: "The palm tree does not bear fruit for the man who climbed yesterday." It takes patience and daily care.\n\nIn the old days, palm wine tappers would rise before dawn, climb the tallest palms barefoot, and harvest fresh palm wine for the village. They knew every tree by name and could tell its mood by the rustle of its fronds.\n\nYour seedlings are like that. They respond to consistent attention. A little water today, some weeding tomorrow, and before you know it, you have a harvest worth celebrating!`,
  },
  {
    title: 'Why the Tortoise Planted Oil Palms',
    story: `The tortoise, known for his cunning, once asked: "Why do the birds always eat better than me?" The eagle replied, "Because we plant what we eat."\n\nSo the tortoise planted three oil palm seeds. But being lazy, he only watered one. That one seed grew into the mightiest palm in the forest.\n\nMoral: Even one well-cared-for seedling is worth more than ten neglected ones. That's why we encourage daily care logs. Your consistency is your harvest!`,
  },
  {
    title: 'Mama Nkechi and the Magic Compost',
    story: `In Owerri, Mama Nkechi's oil palms were the envy of the market. Her secret? She talked to her plants every morning while adding kitchen waste around the roots.\n\n"Are you feeding them jollof rice?" the neighbours joked. "I'm feeding them love and yesterday's eba," she replied.\n\nScience agrees with Mama Nkechi. Organic compost from kitchen waste is rich in nitrogen and potassium, exactly what palm trees crave. Plus, talking to plants increases CO2 around the leaves. Mama Nkechi was a scientist all along!`,
  },
  {
    title: 'The Farmer Who Outran the Rain',
    story: `Uncle Emeka always said, "If you wait for the perfect weather, you'll never plant." One year, he planted his oil palms right before harmattan. Everyone laughed.\n\nBut he dug deep trenches around each seedling and mulched heavily with dried grass. The harmattan dust actually protected his young palms from harsh sun, and when the rains finally came, his palms had the strongest roots in the village.\n\nSometimes the "wrong" time is the right time, as long as you adapt your care routine!`,
  },
  {
    title: 'The Three Brothers of Benin',
    story: `Three brothers inherited an oil palm farm. The first said, "I will hire workers to tend the palms." The second said, "I will study modern techniques." The third simply went to the farm every single day.\n\nAfter one year, the third brother's section produced the most fruit. "How?" the others asked. "I was here when the pests came, I was here when the rains were too heavy, I was here when the soil dried out. I saw every problem the moment it started."\n\nThis is why daily monitoring matters. The farmer who is present catches problems before they become disasters.`,
  },
];

const funFacts = [
  "Did you know? Nigeria is the world's 5th largest producer of palm oil! We were actually #1 until the 1960s. Time to reclaim our crown!",
  "Fun fact: One oil palm tree can produce fruit for up to 30 years. Your seedling today could be feeding your grandchildren!",
  "Palm oil is in about 50% of all supermarket products worldwide, from shampoo to chocolate. You're growing liquid gold!",
  "The Benin Empire (modern-day Edo State) was one of the first civilisations to cultivate oil palms commercially, over 500 years ago. You're continuing a proud tradition!",
  "An adult oil palm can produce 20-30 tonnes of fruit per hectare per year. That's the most efficient oil-producing crop on Earth!",
  "In Yoruba tradition, palm oil (epo pupa) is sacred and used in ceremonies. The Igbo call it 'nri ndi mmuo', food of the spirits.",
  "The red colour in palm oil comes from carotenoids, the same nutrients in carrots. It has 15 times more beta-carotene than carrots!",
  "Palm kernel shells are now used as biomass fuel. Nothing from the oil palm goes to waste, even the trunk becomes furniture!",
];

const nigerianTips = [
  {
    keywords: ['water', 'watering', 'rain', 'dry'],
    response: "In Lagos rainy season (April-October), reduce watering as palms can get too much moisture. During dry season, water deeply 2-3 times per week. Our grandmothers knew this: early morning watering is best to prevent fungal issues!",
  },
  {
    keywords: ['fertilizer', 'fertilize', 'nutrients', 'feeding'],
    response: "Use organic compost, it's the Naija way! Mix kitchen waste, poultry manure, and wood ash. Apply every 2-3 months. Palm trees love nitrogen and potassium. If buying fertilizer, NPK 15-15-15 works well for young palms.",
  },
  {
    keywords: ['pest', 'insect', 'bug', 'disease'],
    response: "Watch for palm weevils and scale insects, they're common in Nigerian climate. Use neem oil spray (like our grandmothers did!). Mix neem leaves in water, strain, and spray weekly. For serious infestations, try a mixture of garlic, pepper, and soap water.",
  },
  {
    keywords: ['harvest', 'harvesting', 'fruit', 'ripe'],
    response: "Palm fruits are ready when they turn deep red-orange and start dropping. In Nigeria, this typically happens 5-6 months after flowering. Don't rush it! Ripe fruits give the best quality palm oil that our Naija dishes deserve.",
  },
  {
    keywords: ['transplant', 'transplanting', 'planting'],
    response: "Best time to transplant in Nigeria is early rainy season (April-May). Dig hole twice the size of root ball, add compost. Keep in shade for first week, then gradually expose to sun. Water daily for first month, that's crucial for survival!",
  },
  {
    keywords: ['spacing', 'distance', 'plant'],
    response: "For home gardens, space plants 5-7 metres apart. In commercial farms, 9 metres triangular spacing is best. Remember, palm trees grow tall and wide. Give them room to become the kings of your garden!",
  },
  {
    keywords: ['soil', 'ground', 'dirt'],
    response: "Palm trees love our Nigerian loamy soil! Good drainage is key, no waterlogging. Add organic matter to improve soil. If your soil is too sandy (like some Lagos areas), mix in clay and compost. If too clayey (like parts of Delta), add sand and organic matter.",
  },
  {
    keywords: ['germination', 'seed', 'sprout'],
    response: "Fresh palm seeds germinate best! Remove outer shell, soak in water for 3 days (change water daily). Plant in nursery bags with good soil mix. Keep moist and warm. Germination takes 2-3 months. Patience is key, just like cooking good banga soup!",
  },
];

type AIModel = 'basic' | 'grok';

function getDaysUntilLaunch(): number {
  return Math.max(0, Math.ceil((LAUNCH_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function AgronomistPage({ onNavigate }: AgronomistPageProps) {
  const storyIndexRef = useRef(0);
  const factIndexRef = useRef(0);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hey there! My name is Sannu, your personal palm oil farming advisor here at iFarmX.\n\nI'm currently gathering information and undergoing training. We're studying everything from soil science to traditional Nigerian farming wisdom so I can give you the best advice possible. The full AI-powered version of me will be ready on April 1st!\n\nBut don't worry, I'm not sleeping on the job. Right now I can:\n\n* Answer common palm care questions (watering, pests, soil, harvesting)\n* Share fascinating Nigerian farming stories and cultural wisdom\n* Drop fun facts about oil palm that will impress your friends\n* Even crack a joke or two to keep things light\n\nTry asking me something, or type "tell me a story" or "fun fact" to get started!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<AIModel>(() => {
    const saved = localStorage.getItem('agronomist-model');
    return (saved === 'grok' ? 'grok' : 'basic') as AIModel;
  });
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsage();
  }, []);

  useEffect(() => {
    localStorage.setItem('agronomist-model', model);
  }, [model]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadUsage = async () => {
    const usageData = await getUserUsage();
    setUsage(usageData);
  };

  const handleModelChange = (newModel: AIModel) => {
    setModel(newModel);
    setError(null);
  };

  const getResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();

    if (lower.includes('story') || lower.includes('stories') || lower.includes('tale')) {
      const story = culturalStories[storyIndexRef.current % culturalStories.length];
      storyIndexRef.current++;
      return `"${story.title}"\n\n${story.story}`;
    }

    if (lower.includes('fact') || lower.includes('did you know') || lower.includes('interesting')) {
      const fact = funFacts[factIndexRef.current % funFacts.length];
      factIndexRef.current++;
      return fact;
    }

    if (lower.includes('joke') || lower.includes('funny') || lower.includes('laugh')) {
      const jokes = [
        "Why did the oil palm break up with the coconut tree? Because it said, \"You're too hard to crack, and I've got better things to produce!\"\n\nBut seriously, oil palms produce 10x more oil per hectare than coconuts. Your choice was wise!",
        "A farmer from Lagos asked his oil palm, \"When will you bear fruit?\" The palm replied, \"When you stop checking every 5 minutes and just water me!\"\n\nPatience + consistent care = results. Your plants are growing even when you can't see it!",
        "What did the oil palm say to the groundnut? \"I produce oil standing tall. You produce oil lying in the dirt. We are not the same.\"\n\nOf course, we love all Nigerian crops, but there's something special about growing a tree that outlives you!",
        "Teacher: \"What's the most important crop in Nigeria?\"\nStudent: \"Oil palm!\"\nTeacher: \"And what do we get from it?\"\nStudent: \"Everything! Palm oil, palm wine, palm kernel oil, brooms, roofing... and arguments about whether to use it in jollof rice.\"",
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (lower.includes('who') && (lower.includes('you') || lower.includes('are') || lower.includes('sannu'))) {
      return "I'm Sannu, your AI Agronomist! Named after the Hausa greeting that means \"hello\" and \"how are you\". I'm here to help you grow the finest oil palms in all of Nigeria (and beyond!).\n\nRight now I'm in training mode, learning from decades of Nigerian farming wisdom, modern agricultural science, and the stories of our elders. On April 1st, I'll be fully powered up with advanced AI. But even now, I can help with tips, stories, and fun facts. What would you like to know?";
    }

    for (const tip of nigerianTips) {
      if (tip.keywords.some((kw) => lower.includes(kw))) {
        return tip.response;
      }
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good')) {
      return "Hello, fellow farmer! It's Sannu here. I'm learning every day while I prepare for my full launch. In the meantime, I can help with common palm care questions, share stories from Nigerian farming tradition, or drop some fun facts.\n\nTry: \"How do I water my palm?\" or \"Tell me a story\" or \"Give me a fun fact\"";
    }

    if (lower.includes('thank')) {
      return "You're welcome! Keep nurturing those palms. As the elders say: \"The man who plants a tree today sits in its shade tomorrow.\" Well, with oil palms, you also sit in its profit!";
    }

    if (lower.includes('when') && (lower.includes('ready') || lower.includes('launch') || lower.includes('full') || lower.includes('april'))) {
      const days = getDaysUntilLaunch();
      return `The full version of Sannu launches on April 1st, 2026, that's ${days} days away! I'll be powered by advanced AI that can diagnose plant diseases from photos, give region-specific advice for your exact location, and even predict optimal harvest times.\n\nIn the meantime, I'm soaking up all the knowledge I can. Ask me anything and I'll do my best!`;
    }

    const randomStory = culturalStories[storyIndexRef.current % culturalStories.length];
    storyIndexRef.current++;
    return `Great question! Here are some general tips for palm tree care:\n\n* Water regularly during dry season (2-3 times per week)\n* Apply organic fertiliser every 2-3 months\n* Watch for pests and use neem oil spray\n* Keep area around tree clear of weeds\n* Monitor for yellowing leaves (sign of nutrients needed)\n\nFor specific advice, try asking about: watering, fertilising, pests, harvesting, transplanting, or soil.\n\nWhile you're here, here's a quick story:\n\n"${randomStory.title}"\n${randomStory.story.split('\n')[0]}...\n\nType "tell me a story" for the full version!`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    if (model === 'grok') {
      try {
        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await sendMessageToGrok([
          ...conversationHistory,
          { role: 'user', content: userMessage },
        ]);

        setMessages((prev) => [...prev, { role: 'assistant', content: response.message }]);
        await loadUsage();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
        setError(errorMessage);

        const fallbackResponse = getResponse(userMessage);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `${fallbackResponse}\n\n(Note: Grok AI is temporarily unavailable, showing training mode response instead)`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        const response = getResponse(userMessage);
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
        setLoading(false);
      }, 800);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const daysLeft = getDaysUntilLaunch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex flex-col">
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sannu</h1>
                  <p className="text-sm text-gray-600">AI Agronomist</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleModelChange('basic')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  model === 'basic'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Basic Tips
              </button>
              <button
                onClick={() => handleModelChange('grok')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  model === 'grok'
                    ? 'bg-gradient-to-r from-blue-100 to-teal-100 text-teal-700 border-2 border-teal-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Grok AI
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Training Mode {'\u00B7'} Full AI launches April 1st</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {daysLeft > 0
                  ? `${daysLeft} days to go! Sannu is currently studying soil science, pest management, and regional farming data across all 36 Nigerian states. Ask questions, request stories, or get fun facts!`
                  : "The full AI is now available! Switch to Grok AI mode for advanced responses."}
              </p>
            </div>
          </div>

          {model === 'grok' && usage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
              <p className="text-xs text-blue-700">
                <strong>Messages today:</strong> {usage.messages_count} / {usage.limit}
                <span className="ml-2 text-blue-600">({usage.remaining} remaining)</span>
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-white shadow-md text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-600">Sannu</span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Training</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-green-600" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: 'Tell me a story', icon: BookOpen },
              { label: 'Fun fact', icon: Sparkles },
              { label: 'How do I water?', icon: Bot },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  setInput(chip.label);
                  setTimeout(() => {
                    const fakeEvent = { key: 'Enter', shiftKey: false, preventDefault: () => {} } as React.KeyboardEvent;
                    handleKeyPress(fakeEvent);
                  }, 50);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
              >
                <chip.icon className="w-3 h-3" />
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Sannu about palm care, request a story, or say anything..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
