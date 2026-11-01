import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key',
});
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const JSON_SCHEMA = `
{
  "type": "object",
  "properties": {
    "title": { "type": "string", "description": "A catchy title for the quiz based on the topic." },
    "difficulty": { "type": "string", "enum": ["Easy", "Medium", "Hard"] },
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": { "type": "string" },
          "options": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Exactly 4 options."
          },
          "correctAnswerIndex": { "type": "integer", "description": "0-based index of correct option." },
          "explanation": { "type": "string" }
        },
        "required": ["question", "options", "correctAnswerIndex", "explanation"]
      }
    }
  },
  "required": ["title", "difficulty", "questions"]
}
`;

export const groqService = {
  async generateQuiz(topic: string, difficulty: string = 'Intermediate', questionCount: number = 5) {
    // ---------------------------------------------------------
    // 1. Mock Mode Check (To save API Quotas during dev)
    // ---------------------------------------------------------
    if (process.env.USE_MOCK_AI === 'true') {
      console.log('[GroqService] Using MOCK AI due to USE_MOCK_AI=true');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockQuestions = [
        {
          question: "What is the virtual DOM in React?",
            options: [
              "A direct copy of the actual DOM.",
              "A lightweight JavaScript representation of the DOM.",
              "A browser plugin for faster rendering.",
              "A new HTML standard."
            ],
            correctAnswerIndex: 1,
            explanation: "React uses a virtual DOM to optimize rendering by keeping a lightweight representation of the UI in memory and syncing it with the real DOM."
          },
          {
            question: "Which hook is used to manage state in a functional component?",
            options: ["useEffect", "useContext", "useState", "useReducer"],
            correctAnswerIndex: 2,
            explanation: "The useState hook allows you to add state variables to functional components."
          },
          {
            question: "What does useEffect do?",
            options: [
              "It performs side effects in function components.",
              "It handles form submissions.",
              "It creates a new Context.",
              "It forces a component to re-render immediately."
            ],
            correctAnswerIndex: 0,
            explanation: "useEffect lets you perform side effects (like data fetching, subscriptions, or manually changing the DOM) in functional components."
          },
          {
            question: "How do you pass data to child components?",
            options: ["Using states", "Using props", "Using context only", "Using redux"],
            correctAnswerIndex: 1,
            explanation: "Props (short for properties) are how you pass data from a parent component to a child component."
          },
          {
            question: "What is JSX?",
            options: [
              "A specialized database query language.",
              "A CSS framework.",
              "A syntax extension for JavaScript recommended for use with React.",
              "A package manager for React."
            ],
            correctAnswerIndex: 2,
            explanation: "JSX is a syntax extension for JavaScript that looks similar to XML or HTML and is used with React to describe what the UI should look like."
          }
      ];

      return {
        title: `Mock Quiz: ${topic}`,
        difficulty,
        questions: Array.from({ length: questionCount }, (_, i) => ({
          ...mockQuestions[i % mockQuestions.length],
          question: `${mockQuestions[i % mockQuestions.length].question} (Mock Q${i + 1})`
        }))
      };
    }

    // ---------------------------------------------------------
    // 2. Real API Call via Groq
    // ---------------------------------------------------------
    const systemPrompt = `You are a senior technical interviewer. You output ONLY strictly valid JSON matching the requested schema. No conversational filler, no markdown tags like \`\`\`json.
Schema:
${JSON_SCHEMA}
`;

    const userPrompt = `Generate a ${questionCount}-question technical quiz about: ${topic}. The difficulty level should be ${difficulty}. Ensure the questions are accurate and provide 4 distinct options per question. You must return JSON.`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: GROQ_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      
      const textResponse = response.choices[0]?.message?.content;
      
      if (!textResponse) {
        throw new Error("Groq returned empty response text");
      }

      // We parse Groq's response as JSON
      return JSON.parse(textResponse);
    } catch (error) {
      console.error("Error generating quiz via Groq:", error);
      throw error;
    }
  }
};
