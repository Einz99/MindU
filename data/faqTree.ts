// faqTree.js
export const MAIN_MENU = [
  'Emotional & Mental Wellness',
  'Social Wellness',
  'Financial & Occupational Wellness',
  'Physical Wellness',
  'Spiritual Wellness',
  'Intellectual Wellness',
  'Environmental Wellness',
];

export const FOLLOW_UP_OPTIONS = (topic: any, lastQ: any, remainingQs: string | any[]) => {
  const opts = [];
  if (remainingQs.length > 0) {
    opts.push(`🔁 Ask another question about ${topic}`);
  }
  opts.push('Explore a different wellness topic');
  opts.push('Go back');
  return opts;
};

export const FAQ_TREE: Record<
  string,
  {
    intro: string;
    questions: Record<string, string>;
  }
> = {
  'Emotional & Mental Wellness': {
    intro: 'What do you want to know about Emotional & Mental Wellness?',
    questions: {
      'What is emotional wellness?':
        'Emotional wellness means being aware of your feelings, handling stress in a healthy way, and being okay with both good and tough emotions. It\'s about knowing when to ask for help too — and that’s totally okay! 😊',
      'How can I manage stress or anxiety?':
        'Try deep breathing, taking breaks, journaling, or even a quick walk. Also, talk to someone you trust — it really helps! 💬',
      'When should I talk to someone about how I feel?':
        'If you\'re feeling down, anxious, or overwhelmed for more than a few days, it’s a good idea to talk to a school counselor, teacher, or trusted adult. You don’t have to go through it alone. 💛',
      'Any quick ways to boost my mood?':
        'Yes! Listen to your favorite music, text a friend, drink some water, or do something creative. Even a 5-minute break can reset your day! 🎶💡',
    },
  },

  'Social Wellness': {
    intro: 'What do you want to know about Social Wellness?',
    questions: {
      'What is social wellness?':
        'It’s all about having good relationships, feeling connected, and being part of a supportive community. Even one or two close friends can make a big difference! 👯',
      'How do I make new friends?':
        'Try joining a club, talking to someone new in class, or starting with a compliment. Friendships often start with small moments! ✨',
      'What if I feel left out?':
        'That’s tough — but you’re not alone. Talk to someone you trust and try connecting with others who share your interests. You belong! 💖',
      'How do I deal with drama or conflict?':
        'Stay calm, listen, and speak honestly — not with anger. It’s okay to take space and come back to a convo later. Respect goes a long way. 🛑➡💬',
    },
  },

  'Financial & Occupational Wellness': {
    intro: 'What do you want to know about Financial & Career Wellness?',
    questions: {
      'What does financial wellness mean for a student?':
        'It means learning to manage your money wisely — saving, spending smart, and understanding the value of a budget. 💡',
      'How can I start saving money?':
        'Even saving a little from lunch money, allowance, or a part-time job helps. Use a savings jar or app and watch it grow! 💰🌱',
      'What should I think about for my future career?':
        'Think about what you\'re good at and what you enjoy. Explore careers online or ask a teacher or counselor for advice. It\'s okay not to have all the answers yet! 🔍🎨',
      'How do I balance school, work, and life?':
        'Use a planner, set limits, and make sure you rest. It’s okay to say no sometimes — your well-being matters! 📅⚖',
    },
  },

  'Physical Wellness': {
    intro: 'What do you want to know about picked Physical Wellness?',
    questions: {
      'How much exercise do I really need?':
        'Aim for about 30–60 minutes a day of activity — even walking, dancing, or sports count! Keep it fun! 🏀',
      'What are some healthy snack ideas?':
        'Try fruit, yogurt, trail mix, or veggies with hummus. Tasty and good for you! 🍎🥕',
      'How do I sleep better at night?':
        'Power down your phone early, keep a regular bedtime, and try not to nap too long after school. 😴📴',
      'What if I don’t feel confident in my body?':
        'You’re not alone — lots of people feel this way. Focus on what your body can do, not just how it looks. Every body is worthy. 💙',
    },
  },

  'Spiritual Wellness': {
    intro: 'What do you want to know about Spiritual Wellness?',
    questions: {
      'What is spiritual wellness?':
        'It’s about finding meaning, purpose, and feeling connected to something bigger than yourself. 🙏',
      'Do I have to be religious to be spiritual?':
        'Nope! Some people connect through religion, others through nature, music, art, or helping others. 🕊🌳',
      'How can I feel more grounded or peaceful?':
        'Try breathing exercises, journaling, or sitting quietly with your thoughts. Even 2 minutes can help! ✍',
      'What are some things I can try every day?':
        'Say one thing you\'re thankful for, take a quiet moment for yourself, or reflect on what went well today. 🙌',
    },
  },

  'Intellectual Wellness': {
    intro: 'What do you want to know about Intellectual Wellness?',
    questions: {
      'What is intellectual wellness?':
        'It’s about learning new things, thinking critically, and staying curious about the world. 🧠',
      'How can I stay curious and creative?':
        'Try reading, solving puzzles, exploring hobbies, or learning a new skill — like drawing or coding! 🎨💻',
      'What are ways to study smarter?':
        'Use flashcards, teach what you learn to someone else, and take short breaks. Find what works best for you! ⏱📖',
      'How do I deal with boredom in school?':
        'Look for ways to connect the topic to something you care about. Ask questions, or set a personal challenge! 🕵',
    },
  },

  'Environmental Wellness': {
    intro: 'What do you want to know about Environmental Wellness?',
    questions: {
      'What is environmental wellness?':
        'It’s about living in a clean, safe, and healthy environment — both at home and in your community. 🏡🌎',
      'How does my room or study space affect me?':
        'A clutter-free space can help you focus and feel less stressed. Try organizing your desk and see how it feels! 📚🧹',
      'What can I do to help the planet?':
        'Recycle, use less plastic, conserve water, or walk/bike more. Even small changes help! ♻🌳',
      'Why should I care about nature?':
        'Being in nature can improve your mood and focus. It’s good for your mental and physical health! 🍃🌞',
    },
  },
};
