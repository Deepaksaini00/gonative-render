import json
import re
import google.generativeai as genai
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-3.1-flash-lite-preview")
# model = genai.GenerativeModel("gemini-2.0-flash")


def _clean_json(text: str) -> str:
    """Strip markdown code fences from Gemini response."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def generate_lesson_content(
    level: int,
    category: str,
    native_language: str = "hindi",
    target_language: str = "english",
    order_index: int = 1,
) -> dict:
    """Generate a full structured lesson using Gemini."""

    level_names = {1: "Beginner (A1)", 2: "Elementary (A2)", 3: "Intermediate (B1)"}
    level_name = level_names.get(level, "Beginner")

    prompt = f"""
You are an expert language teacher creating a lesson for a {native_language} speaker learning {target_language}.

Create lesson #{order_index} for category: "{category}" at level: {level_name}.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{{
  "title": "Lesson title in English",
  "title_native": "Lesson title in {native_language}",
  "description": "Brief description in {native_language} (2-3 lines)",
  "learning_objectives": ["objective 1 in {native_language}", "objective 2 in {native_language}"],
  "vocabulary": [
    {{
      "word": "English word",
      "translation": "{native_language} meaning",
      "pronunciation": "phonetic pronunciation",
      "example_sentence": "Example sentence in English",
      "example_translation": "Example sentence in {native_language}"
    }}
  ],
  "grammar_points": [
    {{
      "rule": "Grammar rule in English",
      "explanation_native": "Explanation in {native_language}",
      "examples": [
        {{"english": "English example", "native": "{native_language} translation"}}
      ]
    }}
  ],
  "dialogue": [
    {{
      "speaker": "A",
      "english": "English line",
      "native": "{native_language} translation",
      "note": "Optional grammar/usage note"
    }}
  ],
  "summary": "Lesson summary in {native_language} (3-4 lines)",
  "tips": ["Study tip 1 in {native_language}", "Study tip 2 in {native_language}"]
}}

Rules:
- Include 8-12 vocabulary words relevant to {category}
- Include 2-3 grammar points
- Dialogue should have 6-10 exchanges
- Make content practical and conversational
- All explanations for learners must be in {native_language} (Hindi)
- Vocabulary and examples must be accurate
"""

    response = model.generate_content(prompt)
    cleaned = _clean_json(response.text)
    return json.loads(cleaned)


async def generate_quiz_questions(
    lesson_content: dict,
    lesson_title: str,
    native_language: str = "hindi",
    target_language: str = "english",
    num_questions: int = 8,
) -> list:
    """Generate quiz questions for a lesson."""

    vocab = lesson_content.get("vocabulary", [])[:6]
    grammar = lesson_content.get("grammar_points", [])[:2]

    prompt = f"""
You are creating a quiz for a {native_language} speaker who just learned a lesson about "{lesson_title}".

Lesson vocabulary sample: {json.dumps(vocab, ensure_ascii=False)}
Grammar points: {json.dumps(grammar, ensure_ascii=False)}

Create exactly {num_questions} quiz questions. Return ONLY a valid JSON array:
[
  {{
    "question_text": "Question in English or {native_language}",
    "question_hindi": "Question in {native_language} (if question is in English)",
    "question_type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "The exact correct option text",
    "explanation": "Why this is correct in English",
    "explanation_hindi": "Why this is correct in {native_language}"
  }}
]

Mix these types (use question_type field):
- "mcq": multiple choice (4 options) — 4 questions
- "translate": translate a word/phrase (provide 4 options) — 2 questions  
- "fill_blank": fill in the blank sentence (provide 4 options) — 2 questions

Rules:
- All correct_answer values must exactly match one of the options
- Make distractors plausible but clearly wrong
- Questions should test vocabulary AND grammar from the lesson
- Explanations should help the learner understand their mistake
"""

    response = model.generate_content(prompt)
    cleaned = _clean_json(response.text)
    return json.loads(cleaned)


async def generate_ai_correction(
    question_text: str,
    user_answer: str,
    correct_answer: str,
    explanation: str,
    native_language: str = "hindi",
) -> str:
    """Generate a personalized correction message when user gets answer wrong."""

    prompt = f"""
A language learner answered a question incorrectly. Give a short, encouraging correction.

Question: {question_text}
Learner's answer: {user_answer}
Correct answer: {correct_answer}
Explanation: {explanation}

Write a 2-3 sentence correction message MIXED in both {native_language} and English naturally (like a teacher would speak to a Hindi student learning English). 
Be warm, encouraging, and explain WHY the correct answer is right.
Do NOT start with "I" or use phrases like "As an AI".
Keep it under 60 words total.
"""

    response = model.generate_content(prompt)
    return response.text.strip()


async def generate_quiz_feedback(
    score: float,
    correct: int,
    total: int,
    wrong_answers: list,
    native_language: str = "hindi",
) -> str:
    """Generate overall quiz feedback after submission."""

    prompt = f"""
A language learner just completed a quiz. Score: {score:.0f}% ({correct}/{total} correct).

Wrong answers summary: {json.dumps(wrong_answers[:3], ensure_ascii=False)}

Write encouraging overall feedback in a mix of {native_language} and English (2-3 sentences).
If score >= 80%: celebrate and encourage moving forward.
If score 60-79%: encourage, mention what to review.
If score < 60%: be very supportive, suggest reviewing the lesson again.

Be warm, like a friendly teacher. Under 80 words.
"""

    response = model.generate_content(prompt)
    return response.text.strip()


async def generate_daily_review_questions(
    last_lessons: list,
    native_language: str = "hindi",
    target_language: str = "english",
) -> list:
    """Generate 4-5 daily review questions from recent lessons."""

    lesson_summaries = [
        {"title": l.get("title", ""), "vocabulary": l.get("vocabulary", [])[:3]}
        for l in last_lessons
    ]

    prompt = f"""
Generate a 5-question daily review quiz for a {native_language} speaker learning {target_language}.

Based on these recently learned lessons: {json.dumps(lesson_summaries, ensure_ascii=False)}

Return ONLY a valid JSON array of 5 questions:
[
  {{
    "question_text": "Question text",
    "question_hindi": "Question in {native_language}",
    "question_type": "mcq",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "Correct option text",
    "explanation": "Explanation in English",
    "explanation_hindi": "Explanation in {native_language}"
  }}
]

Make questions review key vocabulary and phrases from the lessons. Mix easy and moderate difficulty.
"""

    response = model.generate_content(prompt)
    cleaned = _clean_json(response.text)
    return json.loads(cleaned)


async def chat_with_tutor(
    messages: list,
    lesson_context: dict = None,
    native_language: str = "hindi",
    target_language: str = "english",
) -> str:
    """Interactive AI tutor chat."""

    system_context = f"""You are a friendly, patient {target_language} language tutor for {native_language} speakers.
You respond in a mix of {native_language} and {target_language} to help learners understand.
You explain grammar, vocabulary, and usage clearly.
You correct mistakes gently and encourage the learner.
Keep responses concise (2-4 sentences unless explaining grammar).
"""

    if lesson_context:
        system_context += f"\nCurrent lesson context: {json.dumps(lesson_context, ensure_ascii=False)[:500]}"

    full_prompt = system_context + "\n\nConversation:\n"
    for msg in messages:
        role = "Learner" if msg["role"] == "user" else "Tutor"
        full_prompt += f"{role}: {msg['content']}\n"
    full_prompt += "Tutor:"

    response = model.generate_content(full_prompt)
    return response.text.strip()


LESSON_CURRICULUM = [
    # Level 1 - Beginner
    {"level": 1, "category": "greetings", "order": 1},
    {"level": 1, "category": "numbers_1_to_20", "order": 2},
    {"level": 1, "category": "colors", "order": 3},
    {"level": 1, "category": "days_and_months", "order": 4},
    {"level": 1, "category": "family_members", "order": 5},
    {"level": 1, "category": "common_verbs", "order": 6},
    {"level": 1, "category": "food_and_drinks", "order": 7},
    {"level": 1, "category": "body_parts", "order": 8},
    # Level 2 - Elementary
    {"level": 2, "category": "present_tense", "order": 1},
    {"level": 2, "category": "past_tense", "order": 2},
    {"level": 2, "category": "questions_and_answers", "order": 3},
    {"level": 2, "category": "shopping_and_prices", "order": 4},
    {"level": 2, "category": "directions_and_places", "order": 5},
    {"level": 2, "category": "weather_and_seasons", "order": 6},
    # Level 3 - Intermediate
    {"level": 3, "category": "future_tense", "order": 1},
    {"level": 3, "category": "conditionals", "order": 2},
    {"level": 3, "category": "expressing_opinions", "order": 3},
    {"level": 3, "category": "storytelling", "order": 4},
]
