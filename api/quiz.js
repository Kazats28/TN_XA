const fs = require('fs');
const mammoth = require('mammoth');

module.exports = async (req, res) => {
  const filePath = __dirname + '/../cau_hoi.docx';
  const result = await mammoth.extractRawText({ path: filePath });
  const lines = result.value.split('\n').map(l => l.trim()).filter(Boolean);

  const IGNORE_PREFIXES = ['→', 'Giải thích', '👉'];
  const questions = [];
  let current_question = "";
  let choices = [];
  let answers = [];

  lines.forEach(text => {
    if (/^Câu\s*\d+/.test(text)) {
      if (current_question && choices.length && answers.length) {
        questions.push({
          question: current_question,
          choices: [...choices],
          answer: answers.length > 1 ? [...answers] : answers[0]
        });
      }
      current_question = text;
      choices = [];
      answers = [];
    } else if (!IGNORE_PREFIXES.some(prefix => text.startsWith(prefix))) {
      const isCorrect = text.includes('✅');
      const choice = text.replace('✅', '').trim();
      choices.push(choice);
      if (isCorrect) answers.push(choice);
    }
  });

  if (current_question && choices.length && answers.length) {
    questions.push({
      question: current_question,
      choices: [...choices],
      answer: answers.length > 1 ? [...answers] : answers[0]
    });
  }

  // Shuffle questions and choices
  questions.sort(() => Math.random() - 0.5);
  questions.forEach(q => q.choices.sort(() => Math.random() - 0.5));

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ questions });
};
