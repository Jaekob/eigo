/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, Question, QuestionnaireType, GameType, ActivityType } from '../types';

// Let's Try 1 (Grade 3)
const letsTry1Collections: Lesson[] = [
  {
    id: 'lt1-u1-greetings',
    name: 'LT1 — U1: Hello!',
    disabled: false,
    tags: ["Let's Try 1", 'ES', '3rd Grade', 'vocabulary', 'greetings'],
    questions: [
      { id: 'LT1_U1_01', type: 'Flashcard', front: 'Hello', back: 'こんにちは' },
      { id: 'LT1_U1_02', type: 'Flashcard', front: 'Good morning', back: 'おはよう' },
      { id: 'LT1_U1_03', type: 'Flashcard', front: 'Good afternoon', back: 'こんにちは (昼)' },
      { id: 'LT1_U1_04', type: 'Flashcard', front: 'Good evening', back: 'こんばんは' },
      { id: 'LT1_U1_05', type: 'Flashcard', front: 'Goodbye', back: 'さようなら' },
      { id: 'LT1_U1_06', type: 'Flashcard', front: 'Thank you', back: 'ありがとう' },
      { id: 'LT1_U1_07', type: 'Flashcard', front: 'See you', back: 'またね' }
    ]
  },
  {
    id: 'lt1-u2-feelings',
    name: 'LT1 — U2: How are you?',
    disabled: false,
    tags: ["Let's Try 1", 'ES', '3rd Grade', 'vocabulary', 'feelings', 'emotions'],
    questions: [
      { id: 'LT1_U2_01', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-yellow-400 rounded-full flex flex-col items-center justify-center border-8 border-yellow-600 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-4"><div class="w-6 h-10 bg-zinc-900 rounded-full"></div><div class="w-6 h-10 bg-zinc-900 rounded-full"></div></div><div class="w-32 h-16 border-b-12 border-zinc-900 rounded-full"></div></div>', back: 'Happy' },
      { id: 'LT1_U2_02', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-blue-500 rounded-full flex flex-col items-center justify-center border-8 border-blue-700 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-8"><div class="w-6 h-6 bg-zinc-900 rounded-full"></div><div class="w-6 h-6 bg-zinc-900 rounded-full"></div></div><div class="w-32 h-16 border-t-12 border-zinc-900 rounded-full"></div></div>', back: 'Sad' },
      { id: 'LT1_U2_03', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-red-600 rounded-full flex flex-col items-center justify-center border-8 border-red-800 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-6"><div class="w-14 h-3 bg-zinc-900 rotate-45"></div><div class="w-14 h-3 bg-zinc-900 -rotate-45"></div></div><div class="w-24 h-12 bg-zinc-900 rounded-t-full"></div></div>', back: 'Angry' },
      { id: 'LT1_U2_04', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-zinc-400 rounded-full flex flex-col items-center justify-center border-8 border-zinc-600 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-8"><div class="w-10 h-3 bg-zinc-800 rounded-full"></div><div class="w-10 h-3 bg-zinc-800 rounded-full"></div></div><div class="w-20 h-3 bg-zinc-800 rounded-full"></div></div>', back: 'Tired' },
      { id: 'LT1_U2_05', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-orange-500 rounded-full flex flex-col items-center justify-center border-8 border-orange-700 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-4"><div class="w-6 h-6 bg-zinc-900 rounded-full"></div><div class="w-6 h-6 bg-zinc-900 rounded-full"></div></div><div class="w-24 h-24 bg-zinc-900 rounded-full"></div><div class="absolute -bottom-4 -right-6 w-32 h-32 bg-white border-4 border-zinc-200 shadow-lg flex items-center justify-center" style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"><div class="absolute bottom-0 w-12 h-8 bg-zinc-900"></div></div></div>', back: 'Hungry' },
      { id: 'LT1_U2_06', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-emerald-500 rounded-full flex flex-col items-center justify-center border-8 border-emerald-700 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-8"><div class="w-6 h-6 bg-zinc-900 rounded-full"></div><div class="w-6 h-6 bg-zinc-900 rounded-full"></div></div><div class="w-24 h-2 bg-zinc-900"></div></div>', back: 'Fine' },
      { id: 'LT1_U2_07', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-indigo-600 rounded-full flex flex-col items-center justify-center border-8 border-indigo-800 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-8"><div class="w-10 h-2 bg-zinc-900 rotate-12"></div><div class="w-10 h-2 bg-zinc-900 -rotate-12"></div></div><div class="absolute top-12 right-12 text-white font-black text-5xl animate-pulse">Zzz</div><div class="w-12 h-12 border-8 border-zinc-900 rounded-full"></div></div>', back: 'Sleepy' },
      { id: 'LT1_U2_08', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-sky-400 rounded-full flex flex-col items-center justify-center border-8 border-sky-600 shadow-2xl mx-auto relative"><div class="flex gap-12 mb-4"><div class="w-6 h-6 bg-zinc-900 rounded-full"></div><div class="w-6 h-6 bg-zinc-900 rounded-full"></div></div><div class="w-20 h-28 bg-red-500 rounded-b-full border-4 border-zinc-900 rotate-180"></div><div class="absolute -bottom-4 -right-6 w-24 h-32 bg-blue-100/90 border-4 border-white rounded-b-2xl shadow-lg flex items-end overflow-hidden"><div class="w-full h-3/4 bg-blue-500/60"></div></div></div>', back: 'Thirsty' }
    ]
  },
  {
    id: 'lt1-u3-numbers',
    name: 'LT1 — U3: How many? (Numbers)',
    disabled: false,
    tags: ["Let's Try 1", 'ES', '3rd Grade', 'vocabulary', 'numbers'],
    questions: [
      { id: 'LT1_U3_N01', type: 'Flashcard', front: '1', back: 'One / 一' },
      { id: 'LT1_U3_N02', type: 'Flashcard', front: '2', back: 'Two / 二' },
      { id: 'LT1_U3_N03', type: 'Flashcard', front: '3', back: 'Three / 三' },
      { id: 'LT1_U3_N04', type: 'Flashcard', front: '4', back: 'Four / 四' },
      { id: 'LT1_U3_N05', type: 'Flashcard', front: '5', back: 'Five / 五' },
      { id: 'LT1_U3_N06', type: 'Flashcard', front: '6', back: 'Six / 六' },
      { id: 'LT1_U3_N07', type: 'Flashcard', front: '7', back: 'Seven / 七' },
      { id: 'LT1_U3_N08', type: 'Flashcard', front: '8', back: 'Eight / 八' },
      { id: 'LT1_U3_N09', type: 'Flashcard', front: '9', back: 'Nine / 九' },
      { id: 'LT1_U3_N10', type: 'Flashcard', front: '10', back: 'Ten / 十' }
    ]
  },
  {
    id: 'lt1-u3-numbers-special',
    name: 'LT1 — U3: How many? (Counting Emojis)',
    disabled: false,
    tags: ["Let's Try 1", 'ES', '3rd Grade', 'vocabulary', 'numbers', 'counting'],
    questions: [
      { id: 'CE_N01', type: 'Flashcard', front: '🍎', back: '1' },
      { id: 'CE_N02', type: 'Flashcard', front: '🍎🍎', back: '2' },
      { id: 'CE_N03', type: 'Flashcard', front: '🍎🍎🍎', back: '3' },
      { id: 'CE_N04', type: 'Flashcard', front: '🍊🍊🍊🍊', back: '4' },
      { id: 'CE_N05', type: 'Flashcard', front: '🍒🍒🍒🍒🍒', back: '5' },
      { id: 'CE_N06', type: 'Flashcard', front: '🍪🍪🍪🍪🍪🍪', back: '6' },
      { id: 'CE_N07', type: 'Flashcard', front: '🌟🌟🌟🌟🌟🌟🌟', back: '7' },
      { id: 'CE_N08', type: 'Flashcard', front: '☁️☁️☁️☁️☁️☁️☁️☁️', back: '8' },
      { id: 'CE_N09', type: 'Flashcard', front: '❤️❤️❤️❤️❤️❤️❤️❤️❤️', back: '9' },
      { id: 'CE_N10', type: 'Flashcard', front: '🎈🎈🎈🎈🎈🎈🎈🎈🎈🎈', back: '10' }
    ]
  },
  {
    id: 'lt1-u4-colors',
    name: 'LT1 — U4: I like blue.',
    disabled: false,
    tags: ["Let's Try 1", 'ES', '3rd Grade', 'vocabulary', 'colors'],
    questions: [
      { id: 'LT1_U4_01', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-red-600 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Red / 赤' },
      { id: 'LT1_U4_02', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-blue-600 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Blue / 青' },
      { id: 'LT1_U4_03', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-emerald-600 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Green / 緑' },
      { id: 'LT1_U4_04', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-yellow-400 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Yellow / 黄色' },
      { id: 'LT1_U4_05', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-orange-500 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Orange / オレンジ' },
      { id: 'LT1_U4_06', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-purple-600 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Purple / 紫' },
      { id: 'LT1_U4_07', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-hotpink rounded-full shadow-2xl border-8 border-white/20 mx-auto" style="background-color: #ff69b4"></div>', back: 'Pink / ピンク' },
      { id: 'LT1_U4_08', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-amber-800 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Brown / 茶色' },
      { id: 'LT1_U4_09', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-zinc-950 rounded-full shadow-2xl border-8 border-white/20 mx-auto"></div>', back: 'Black / 黒' },
      { id: 'LT1_U4_10', type: 'Flashcard', front: '<div class="w-64 h-64 md:w-96 md:h-96 bg-white rounded-full shadow-2xl border-8 border-zinc-300 mx-auto"></div>', back: 'White / 白' }
    ]
  },
  {
    id: 'lt1-u5-food',
    name: 'LT1 — U5: What do you like?',
    disabled: false,
    tags: ["Let's Try 1", 'ES', '3rd Grade', 'vocabulary', 'food'],
    questions: [
      { id: 'LT1_U5_01', type: 'Flashcard', front: 'Apple', back: 'りんご' },
      { id: 'LT1_U5_02', type: 'Flashcard', front: 'Banana', back: 'バナナ' },
      { id: 'LT1_U5_03', type: 'Flashcard', front: 'Orange', back: 'オレンジ' },
      { id: 'LT1_U5_04', type: 'Flashcard', front: 'Peach', back: '桃 / ピーチ' },
      { id: 'LT1_U5_05', type: 'Flashcard', front: 'Melon', back: 'メロン' },
      { id: 'LT1_U5_06', type: 'Flashcard', front: 'Pizza', back: 'ピザ' },
      { id: 'LT1_U5_07', type: 'Flashcard', front: 'Curry', back: 'カレー' },
      { id: 'LT1_U5_08', type: 'Flashcard', front: 'Cake', back: 'ケーキ' }
    ]
  }
];

// Let's Try 2 (Grade 4)
const letsTry2Collections: Lesson[] = [
  {
    id: 'lt2-u1-greetings',
    name: 'LT2 — U1: Hello, world!',
    disabled: false,
    tags: ["Let's Try 2", 'ES', '4th Grade', 'vocabulary', 'greetings'],
    questions: [
      { id: 'LT2_U1_01', type: 'Flashcard', front: 'Nice to meet you', back: 'はじめまして / よろしく' },
      { id: 'LT2_U1_02', type: 'Flashcard', front: 'My name is...', back: '私の名前は...です' },
      { id: 'LT2_U1_03', type: 'Flashcard', front: 'What is your name?', back: 'お名前は何ですか？' },
      { id: 'LT2_U1_04', type: 'Flashcard', front: "I'm from Japan", back: '私は日本出身です' }
    ]
  },
  {
    id: 'lt2-u3-days',
    name: 'LT2 — U3: I like Mondays.',
    disabled: false,
    tags: ["Let's Try 2", 'ES', '4th Grade', 'vocabulary', 'days of the week'],
    questions: [
      { id: 'LT2_U3_01', type: 'Flashcard', front: 'Monday', back: '月曜日' },
      { id: 'LT2_U3_02', type: 'Flashcard', front: 'Tuesday', back: '火曜日' },
      { id: 'LT2_U3_03', type: 'Flashcard', front: 'Wednesday', back: '水曜日' },
      { id: 'LT2_U3_04', type: 'Flashcard', front: 'Thursday', back: '木曜日' },
      { id: 'LT2_U3_05', type: 'Flashcard', front: 'Friday', back: '金曜日' },
      { id: 'LT2_U3_06', type: 'Flashcard', front: 'Saturday', back: '土曜日' },
      { id: 'LT2_U3_07', type: 'Flashcard', front: 'Sunday', back: '日曜日' }
    ]
  }
];

// Here We Go 5 (Grade 5)
const hereWeGo5Collections: Lesson[] = [
  {
    id: 'hwg5-u2-1-months',
    name: 'HWG5 — U2.1: Months',
    tags: ['Here We Go 5', 'ES', '5th Grade', 'vocabulary', 'months'],
    questions: [
      { id: 'HWG5_U2_01', type: 'Flashcard', front: '1月', back: 'January (ジャニュアリー)' },
      { id: 'HWG5_U2_02', type: 'Flashcard', front: '2月', back: 'February (フェブラリー)' },
      { id: 'HWG5_U2_03', type: 'Flashcard', front: '3月', back: 'March (マーチ)' },
      { id: 'HWG5_U2_04', type: 'Flashcard', front: '4月', back: 'April (エイプロォ)' },
      { id: 'HWG5_U2_05', type: 'Flashcard', front: '5月', back: 'May (メイ)' },
      { id: 'HWG5_U2_06', type: 'Flashcard', front: '6月', back: 'June (ジューン)' },
      { id: 'HWG5_U2_07', type: 'Flashcard', front: '7月', back: 'July (ジュライ)' },
      { id: 'HWG5_U2_08', type: 'Flashcard', front: '8月', back: 'August (オーガスト)' },
      { id: 'HWG5_U2_09', type: 'Flashcard', front: '9月', back: 'September (セプテンバー)' },
      { id: 'HWG5_U2_10', type: 'Flashcard', front: '10月', back: 'October (アクトーバー)' },
      { id: 'HWG5_U2_11', type: 'Flashcard', front: '11月', back: 'November (ノヴェンバー)' },
      { id: 'HWG5_U2_12', type: 'Flashcard', front: '12月', back: 'December (ディセンバー)' }
    ]
  },
  {
    id: 'hwg5-u2-1-2-days',
    name: 'HWG5 — U2.2: Days of the Month',
    tags: ['Here We Go 5', 'ES', '5th Grade', 'vocabulary', 'ordinal numbers'],
    questions: [
      { id: 'HWG5_U2_D01', type: 'Flashcard', front: '1', back: '1st (ファースト)' },
      { id: 'HWG5_U2_D02', type: 'Flashcard', front: '2', back: '2nd (セカンド)' },
      { id: 'HWG5_U2_D03', type: 'Flashcard', front: '3', back: '3rd (サード)' },
      { id: 'HWG5_U2_D04', type: 'Flashcard', front: '4', back: '4th (フォース)' },
      { id: 'HWG5_U2_D05', type: 'Flashcard', front: '5', back: '5th (フィフス)' },
      { id: 'HWG5_U2_D06', type: 'Flashcard', front: '6', back: '6th (シックスス)' },
      { id: 'HWG5_U2_D07', type: 'Flashcard', front: '7', back: '7th (セブンス)' },
      { id: 'HWG5_U2_D08', type: 'Flashcard', front: '8', back: '8th (エイス)' },
      { id: 'HWG5_U2_D09', type: 'Flashcard', front: '9', back: '9th (ナインス)' },
      { id: 'HWG5_U2_D10', type: 'Flashcard', front: '10', back: '10th (テンス)' },
      { id: 'HWG5_U2_D11', type: 'Flashcard', front: '11', back: '11th (イレブンス)' },
      { id: 'HWG5_U2_D12', type: 'Flashcard', front: '12', back: '12th (トゥエルブス)' },
      { id: 'HWG5_U2_D13', type: 'Flashcard', front: '13', back: '13th (サーティーンス)' },
      { id: 'HWG5_U2_D14', type: 'Flashcard', front: '14', back: '14th (フォーティーンス)' },
      { id: 'HWG5_U2_D15', type: 'Flashcard', front: '15', back: '15th (フィフティーンス)' },
      { id: 'HWG5_U2_D16', type: 'Flashcard', front: '16', back: '16th (シックスティーンス)' },
      { id: 'HWG5_U2_D17', type: 'Flashcard', front: '17', back: '17th (セブンティーンス)' },
      { id: 'HWG5_U2_D18', type: 'Flashcard', front: '18', back: '18th (エイティーンス)' },
      { id: 'HWG5_U2_D19', type: 'Flashcard', front: '19', back: '19th (ナインティーンス)' },
      { id: 'HWG5_U2_D20', type: 'Flashcard', front: '20', back: '20th (トゥエンティエス)' },
      { id: 'HWG5_U2_D21', type: 'Flashcard', front: '21', back: '21st (トゥエンティファースト)' },
      { id: 'HWG5_U2_D22', type: 'Flashcard', front: '22', back: '22nd (トゥエンティセカンド)' },
      { id: 'HWG5_U2_D23', type: 'Flashcard', front: '23', back: '23rd (トゥエンティサード)' },
      { id: 'HWG5_U2_D24', type: 'Flashcard', front: '24', back: '24th (トゥエンティフォース)' },
      { id: 'HWG5_U2_D25', type: 'Flashcard', front: '25', back: '25th (トゥエンティフィフス)' },
      { id: 'HWG5_U2_D26', type: 'Flashcard', front: '26', back: '26th (トゥエンティシックスス)' },
      { id: 'HWG5_U2_D27', type: 'Flashcard', front: '27', back: '27th (トゥエンティセブンス)' },
      { id: 'HWG5_U2_D28', type: 'Flashcard', front: '28', back: '28th (トゥエンティエイス)' },
      { id: 'HWG5_U2_D29', type: 'Flashcard', front: '29', back: '29th (トゥエンティナインス)' },
      { id: 'HWG5_U2_D30', type: 'Flashcard', front: '30', back: '30th (サーティエス)' },
      { id: 'HWG5_U2_D31', type: 'Flashcard', front: '31', back: '31st (サーティファースト)' }
    ]
  }
];

// Here We Go 6 (Grade 6)
const hereWeGo6Collections: Lesson[] = [
  {
    id: 'hwg6-u6-2-infinitive',
    name: 'HWG6 — U6.2: Future Goals',
    disabled: false,
    tags: ['Here We Go 6', 'ES', '6th Grade', 'grammar', 'infinitive', 'want to be'],
    questions: [
      { id: 'HWG6_U6_01', type: 'Flashcard', front: 'I want to be a doctor.', back: '私は医者になりたいです。' },
      { id: 'HWG6_U6_02', type: 'Flashcard', front: 'I want to be a teacher.', back: '私は先生になりたいです。' },
      { id: 'HWG6_U6_03', type: 'Flashcard', front: 'I want to be a pilot.', back: '私はパイロットになりたいです。' },
      { id: 'HWG6_U6_04', type: 'Flashcard', front: 'I want to be a soccer player.', back: '私はサッカー選手になりたいです。' },
      { id: 'HWG6_U6_05', type: 'Flashcard', front: 'I want to go to Italy.', back: '私はイタリアに行きたいです。' }
    ]
  }
];

// Junior High School (Grade 7 - 9)
const juniorHighCollections: Lesson[] = [
  {
    id: 'jhs1-u1-intro',
    name: 'JHS1 — U1: Self Intro & Basics',
    disabled: false,
    tags: ['JHS', '7th Grade', 'grammar', 'basics'],
    questions: [
      { id: 'JHS1_U1_01', type: 'Flashcard', front: 'I like English.', back: '私は英語が好きです。' },
      { id: 'JHS1_U1_02', type: 'Flashcard', front: 'I play baseball.', back: '私は野球をします。' },
      { id: 'JHS1_U1_03', type: 'Flashcard', front: 'Do you like tennis?', back: 'あなたはテニスが好きですか？' },
      { id: 'JHS1_U1_04', type: 'Flashcard', front: 'Yes, I do.', back: 'はい、好きです。' },
      { id: 'JHS1_U1_05', type: 'Flashcard', front: "No, I don't.", back: 'いいえ、好きではありません。' },
      { id: 'JHS1_U1_06', type: 'Flashcard', front: 'I am a student.', back: '私は生徒です。' }
    ]
  },
  {
    id: 'jhs2-u2-past',
    name: 'JHS2 — U2: Past Tense Adventures',
    disabled: false,
    tags: ['JHS', '8th Grade', 'grammar', 'past tense'],
    questions: [
      { id: 'JHS2_U2_01', type: 'Flashcard', front: 'I went to Tokyo.', back: '私は東京に行きました。' },
      { id: 'JHS2_U2_02', type: 'Flashcard', front: 'I saw a temple.', back: '私はお寺を見ました。' },
      { id: 'JHS2_U2_03', type: 'Flashcard', front: 'I ate delicious sushi.', back: '私は美味しい寿司を食べました。' },
      { id: 'JHS2_U2_04', type: 'Flashcard', front: 'I bought a souvenir.', back: '私はお土産を買いました。' },
      { id: 'JHS2_U2_05', type: 'Flashcard', front: 'Did you enjoy your trip?', back: 'あなたは旅行を楽しましたか？' },
      { id: 'JHS2_U2_06', type: 'Flashcard', front: 'Yes, I did.', back: 'はい、楽しみました。' },
      { id: 'JHS2_U2_07', type: 'Flashcard', front: "No, I didn't.", back: 'いいえ、楽しみませんでした。' }
    ]
  },
  {
    id: 'jhs3-u3-present-perfect',
    name: 'JHS3 — U3: Present Perfect Travel',
    disabled: false,
    tags: ['JHS', '9th Grade', 'grammar', 'present perfect'],
    questions: [
      { id: 'JHS3_U3_01', type: 'Flashcard', front: 'Have you ever been to Canada?', back: 'あなたはカナダに行ったことがありますか？' },
      { id: 'JHS3_U3_02', type: 'Flashcard', front: 'I have visited Canada twice.', back: '私はカナダに2回訪れたことがあります。' },
      { id: 'JHS3_U3_03', type: 'Flashcard', front: 'I have lived in Nara for three years.', back: '私は奈良に3年間住んでいます。' },
      { id: 'JHS3_U3_04', type: 'Flashcard', front: 'I have already done my homework.', back: '私はすでに宿題を終えました。' },
      { id: 'JHS3_U3_05', type: 'Flashcard', front: 'He has not read the book yet.', back: '彼はまだその本を読んでいません。' }
    ]
  }
];

// Debug Lesson
const debugLesson: Lesson = {
  id: 'debug-set',
  name: 'Diagnostic Tests (System)',
  tags: ['System', 'Debug', 'Test'],
  questions: [
    {
      id: 'debug-01',
      type: 'MultipleChoice',
      front: 'Translate this: 「りんご」',
      choices: {
        A: 'Orange',
        B: 'Banana',
        C: 'Apple',
        D: 'Grape'
      },
      correct: 'C',
      note: 'Simple translation test'
    },
    {
      id: 'debug-02',
      type: 'Flashcard',
      front: 'Hello / こんにちは',
      back: 'Hello',
      note: 'Greeting basic test'
    },
    {
      id: 'debug-03',
      type: 'MultipleChoice',
      front: 'Choose the animal that barks.',
      choices: {
        A: 'Cat',
        B: 'Dog',
        C: 'Lion',
        D: 'Bird'
      },
      correct: 'B'
    }
  ]
};

// Main hard-coded bundle
export const staticLessons: Lesson[] = [
  debugLesson,
  ...letsTry1Collections,
  ...letsTry2Collections,
  ...hereWeGo5Collections,
  ...hereWeGo6Collections,
  ...juniorHighCollections
];

export const contentService = {
  getLessons(): Lesson[] {
    try {
      const stored = localStorage.getItem('eigo_custom_lessons');
      if (stored) {
        const customLessons: Lesson[] = JSON.parse(stored);
        return [...staticLessons, ...customLessons];
      }
    } catch (e) {
      console.error('Failed to parse custom lessons from localStorage', e);
    }
    return staticLessons;
  },

  saveCustomLesson(lesson: Lesson): void {
    try {
      const stored = localStorage.getItem('eigo_custom_lessons');
      let customLessons: Lesson[] = stored ? JSON.parse(stored) : [];
      
      const index = customLessons.findIndex(l => l.id === lesson.id);
      if (index >= 0) {
        customLessons[index] = lesson;
      } else {
        customLessons.unshift(lesson);
      }
      
      localStorage.setItem('eigo_custom_lessons', JSON.stringify(customLessons));
    } catch (e) {
      console.error('Failed to save custom lesson to localStorage', e);
    }
  },

  deleteCustomLesson(lessonId: string): void {
    try {
      const stored = localStorage.getItem('eigo_custom_lessons');
      if (stored) {
        let customLessons: Lesson[] = JSON.parse(stored);
        customLessons = customLessons.filter(l => l.id !== lessonId);
        localStorage.setItem('eigo_custom_lessons', JSON.stringify(customLessons));
      }
    } catch (e) {
      console.error('Failed to delete custom lesson from localStorage', e);
    }
  },

  // Verify and validate loaded questions
  validateQuestion(q: Question): boolean {
    if (!q.id || !q.type || !q.front) return false;
    if (q.type === 'MultipleChoice' && (!q.correct || !q.choices)) return false;
    return true;
  },

  // Custom CSV parser supporting standard headers
  parseCSV(text: string): Question[] {
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuote && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (char === ',' && !inQuote) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const headers = parseLine(lines[0]);
    const questions: Question[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const obj: any = {};
      
      headers.forEach((h, colIndex) => {
        const valStr = values[colIndex] || '';
        
        // Deserialize choices from "A:Option 1|B:Option 2|C:Option 3|D:Option 4" format
        if (h === 'choices' && valStr) {
          const choiceObj: { [key: string]: string } = {};
          const pairs = valStr.split('|');
          pairs.forEach(p => {
            const splitIdx = p.indexOf(':');
            if (splitIdx > 0) {
              const k = p.substring(0, splitIdx).trim();
              const v = p.substring(splitIdx + 1).trim();
              if (k && v) choiceObj[k] = v;
            }
          });
          obj[h] = choiceObj;
        } else {
          obj[h] = valStr;
        }
      });

      // Normalization of types
      const rawType = (obj.type || '').toLowerCase().trim();
      const type = (rawType === 'multiplechoice' || rawType === 'mc') ? 'MultipleChoice' : 'Flashcard';

      const parsedQuestion: Question = {
        id: obj.id || `csv-q-${i}-${Math.floor(Math.random()*1000)}`,
        type,
        front: obj.front || 'Empty Front Question',
        back: obj.back || undefined,
        choices: obj.choices || undefined,
        correct: obj.correct || undefined,
        imageRef: obj.imageRef || undefined,
        audioRef: obj.audioRef || undefined,
        note: obj.note || undefined
      };

      if (this.validateQuestion(parsedQuestion)) {
        questions.push(parsedQuestion);
      }
    }

    return questions;
  }
};

export const rollCallPresetLessonId = 'lt1-u3-numbers-special';

export const ACTIVITY_FIXED_LESSONS: Partial<Record<ActivityType, string>> = {
  'roll-call': rollCallPresetLessonId
};

export interface CompatibilityResult {
  compatible: boolean;
  reason?: string;
  isWarning?: boolean;
}

export const compatibilityService = {
  checkCompatibility(
    lesson: Lesson | null,
    activityId: ActivityType, // Use ActivityType
    gameId: GameType | null,
    teamCount: number,
    isStudyMode: boolean
  ): CompatibilityResult {
    if (!lesson) {
      return { compatible: false, reason: 'Please select a lesson first.' };
    }

    if (lesson.questions.length === 0) {
      return { compatible: false, reason: 'This lesson has no questions.' };
    }

    // 1. Check Team Count vs Game
    if (!isStudyMode && gameId) {
      if (teamCount < 2 && ['roulette-base', 'roulette-rachel', 'star-grid', 'space-exploration', 'pachinko', 'galaxy-race'].includes(gameId)) {
        return {
          compatible: false,
          isWarning: true,
          reason: `Mini-game "${gameId}" requires multiple teams to play competitively. Currently only 1 team is set up.`
        };
      }
    }

    // 2. Check Activity specific rules for fixed lessons (Generalized)
    const fixedLessonId = ACTIVITY_FIXED_LESSONS[activityId];
    if (fixedLessonId) {
      const presetLesson = staticLessons.find(l => l.id === fixedLessonId);

      if (presetLesson && lesson.id !== presetLesson.id) {
        return {
          compatible: false,
          isWarning: true,
          reason: `The "${activityId.replace('-', ' ')}" activity uses a fixed lesson ("${presetLesson.name}"). Other lessons are disabled for selection.`
        };
      }
    }

    // 3. Roll Call secondary compatibility check (Tags)
    if (activityId === 'roll-call') {
      const hasNumberTag = lesson.tags?.some(t =>
        t.toLowerCase().includes('number') || 
        t.toLowerCase().includes('counting') ||
        t.toLowerCase().includes('digit')
      ) || lesson.name.toLowerCase().includes('number') || lesson.name.toLowerCase().includes('how many');
      
      if (!hasNumberTag) {
        return { compatible: false, isWarning: true, reason: 'Roll Call is designed for counting/numbers lessons (e.g. "How many?"). The selected lesson may not match its cosmic star theme.' };
      }
    }

    // 3. Check Word Scramble compatibility
    if (activityId === 'word-scramble') {
      // Check if questions have valid alphabetic answers (no Japanese, single word or simple letters)
      const hasInvalidWords = lesson.questions.some(q => {
        const text = q.back || q.front;
        // Strip out HTML tags if any
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        // check if has Japanese or has spaces
        const hasJapanese = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/g.test(cleanText);
        const hasSpaces = cleanText.includes(' ') || cleanText.includes('　');
        return hasJapanese || hasSpaces;
      });

      if (hasInvalidWords) {
        return {
          compatible: false,
          isWarning: true,
          reason: 'Word Scramble works best with single English words. Some cards in this lesson have Japanese translations, spaces, or multiple words, which are hard to scramble.'
        };
      }
    }

    // 4. Check Multiple Choice pool size
    if (activityId === 'multiple-choice') {
      const allHaveChoices = lesson.questions.every(q => q.choices && q.correct);
      if (!allHaveChoices && lesson.questions.length < 4) {
        return {
          compatible: false,
          isWarning: true,
          reason: 'Multiple Choice requires at least 4 questions to automatically generate diverse distractors (incorrect choices).'
        };
      }
    }

    // 5. Check Memory Match (sequence) size
    if (activityId === 'sequence' && lesson.questions.length < 2) {
      return {
        compatible: false,
        reason: 'Memory Match requires at least 2 questions to shuffle and build a recall sequence.'
      };
    }

    // 6. Check Bingo size
    if (activityId === 'bingo' && lesson.questions.length < 9) {
      return {
        compatible: false,
        isWarning: true,
        reason: 'Vocabulary Bingo works best with at least 9 questions to ensure students can fill their paper grids.'
      };
    }

    return { compatible: true };
  }
};
