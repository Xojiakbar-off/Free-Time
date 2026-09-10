export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

export const englishLevels = [
  {
    code: 'A1',
    name: { uz: 'Boshlang\'ich', en: 'Beginner', ru: 'Начальный' },
    tagline: { uz: 'Kundalik so\'zlar va iboralar', en: 'Everyday words and basic phrases', ru: 'Простые слова и повседневные фразы' },
    skills: {
      uz: [
        'Salomlashish va o\'zingizni tanishtirish',
        'Raqamlar, sana va vaqtni aytish',
        'Oddiy savollar berish va javob qilish',
        'Tanish so\'zlar yordamida matnni tushunish',
      ],
      en: [
        'Greet people and introduce yourself',
        'Say numbers, dates and times',
        'Ask and answer simple questions',
        'Understand simple texts with familiar words',
      ],
      ru: [
        'Приветствовать людей и представляться',
        'Называть числа, даты и время',
        'Задавать и отвечать на простые вопросы',
        'Понимать простые тексты со знакомыми словами',
      ],
    },
  },
  {
    code: 'A2',
    name: { uz: 'Elementar', en: 'Elementary', ru: 'Элементарный' },
    tagline: { uz: 'Kundalik mavzularda erkin muloqot', en: 'Communicate on everyday topics', ru: 'Общение на бытовые темы' },
    skills: {
      uz: [
        'Oila, ish va xarid mavzularida suhbatlashish',
        'Oddiy matnlarni o\'qish va tushunish',
        'O\'tgan zamon haqida gapirish',
        'O\'qish uchun nomzodni (menu, jadval) tushunish',
      ],
      en: [
        'Talk about family, work and shopping',
        'Read and understand short simple texts',
        'Describe past events and plans',
        'Understand schedules, menus and signs',
      ],
      ru: [
        'Обсуждать семью, работу и покупки',
        'Читать и понимать короткие простые тексты',
        'Рассказывать о прошлом и планах',
        'Понимать расписания, меню и таблички',
      ],
    },
  },
  {
    code: 'B1',
    name: { uz: 'O\'rta', en: 'Intermediate', ru: 'Средний' },
    tagline: { uz: 'Mustaqil muloqot va fikr bildirish', en: 'Independent communication', ru: 'Уверенное общение' },
    skills: {
      uz: [
        'Tanis topilgan mavzularda taassurot va fikr bildirish',
        'Sayohatda mustaqil yechim qabul qilish',
        'Shaxsiy manfaat mavzularida matn yozish',
        'Hikoya, qo\'shiqlar va intervyularni tushunish',
      ],
      en: [
        'Give opinions on familiar topics',
        'Deal with most situations while travelling',
        'Write simple connected texts on interests',
        'Follow stories, songs and interviews',
      ],
      ru: [
        'Выражать мнение по знакомым темам',
        'Справляться с ситуациями в путешествии',
        'Писать связные тексты о своих интересах',
        'Понимать истории, песни и интервью',
      ],
    },
  },
  {
    code: 'B2',
    name: { uz: 'O\'rta-mustaqil', en: 'Upper-Intermediate', ru: 'Выше среднего' },
    tagline: { uz: 'Murakkab mavzularda ravon nutq', en: 'Fluency on complex topics', ru: 'Беглость на сложных темах' },
    skills: {
      uz: [
        'Mavhum va murakkab matnlarni tushunish',
        'Erkin va tabiiy ravishda muloqot qilish',
        'Batafsil va aniq matnlar yozish',
        'Bahs va munozaralarda qatnashish',
      ],
      en: [
        'Understand abstract and complex texts',
        'Interact naturally and fluently',
        'Write detailed, clear texts',
        'Participate in discussions and arguments',
      ],
      ru: [
        'Понимать абстрактные и сложные тексты',
        'Свободно и естественно общаться',
        'Писать подробные и ясные тексты',
        'Участвовать в дискуссиях и спорах',
      ],
    },
  },
  {
    code: 'C1',
    name: { uz: 'Ilg\'or', en: 'Advanced', ru: 'Продвинутый' },
    tagline: { uz: 'Akademik va professional daraja', en: 'Academic and professional mastery', ru: 'Академический и профессиональный уровень' },
    skills: {
      uz: [
        'Uzoq va murakkab matnlarni yashirin ma\'nosi bilan tushunish',
        'Og\'zaki va yozma nutqda ravon ifoda',
        'Bog\'langan va aniq fikr yuritish',
        'Tilni ijtimoiy, akademik va kasbiy maqsadlarda qo\'llash',
      ],
      en: [
        'Understand long, complex texts with implicit meaning',
        'Express ideas fluently in speech and writing',
        'Structure clear, well-organised arguments',
        'Use the language for social, academic and professional goals',
      ],
      ru: [
        'Понимать длинные сложные тексты со скрытым смыслом',
        'Свободно выражать мысли устно и письменно',
        'Строить ясные, хорошо организованные аргументы',
        'Использовать язык в социальных, учебных и профессиональных целях',
      ],
    },
  },
];

export const lessonLevelMap = {
  1: 'A1', 2: 'A1', 3: 'A1', 4: 'A1',
  5: 'A2', 6: 'A2', 7: 'A2', 8: 'A2',
  9: 'B1', 10: 'B1', 11: 'B1', 12: 'B1', 13: 'B1',
  14: 'B2', 15: 'B2', 16: 'B2', 17: 'B2', 18: 'B2',
  19: 'C1', 20: 'C1', 21: 'C1', 22: 'C1', 23: 'C1', 24: 'C1',
};

export function levelMatchesRange(level, range) {
  const [from, to] = (range || 'A1-C1').split('-').map(s => s.trim());
  const li = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER.indexOf(from) <= li && li <= CEFR_ORDER.indexOf(to);
}

export function getLevelIndex(code) {
  const i = CEFR_ORDER.indexOf(code);
  return i === -1 ? 0 : i;
}