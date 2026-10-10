import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateEventDescription = async ({
  title,
  category = "Tech",
  club = "Campus Club",
  targetAudience = "All College Students",
  keyHighlights = "",
}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "test_gemini_api_key" && apiKey.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are a professional campus event organizer and copywriter.
Write an engaging, exciting, and well-structured event description for a college event.

Event Title: ${title}
Category: ${category}
Organizing Club: ${club}
Target Audience: ${targetAudience}
Key Highlights / Notes: ${keyHighlights || "Networking, Hands-on learning, Free refreshments, Certificates"}

Format Guidelines:
- Catchy hook introduction.
- Why you should attend (bullet points).
- Schedule overview or highlights.
- Clear Call to Action for registration.
Keep it between 120 and 200 words. Do not use Markdown headings like # or ##, use bold text or bullet points.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (apiError) {
      console.warn(
        "[Gemini AI Service API Notice]:",
        apiError.message,
        "- Using intelligent fallback.",
      );
    }
  }

  const highlightsList = keyHighlights
    ? keyHighlights
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean)
    : [
        "Hands-on interactive experience with industry mentors",
        "Official certificate of participation & exclusive merchandise",
        "Exciting networking opportunities & complimentary refreshments",
      ];

  return `🎉 Get ready for ${title}!

Hosted proudly by ${club}, this high-energy ${category.toLowerCase()} event is custom-designed for ${targetAudience}. Whether you're aiming to expand your skillset, build lasting friendships, or showcase your creative potential, this is where you need to be.

What to Expect:
• ${highlightsList[0] || "Exciting competitive rounds & workshops"}
• ${highlightsList[1] || "Inspiring keynote sessions from top campus leaders"}
• ${highlightsList[2] || "Complimentary swag bags & refreshments"}

Seats are strictly limited to venue capacity. Secure your ticket now and be part of the most talked-about event of the semester!`;
};

export const analyzeSingleFeedbackSentiment = async (review, rating) => {
  if (!review || review.trim().length === 0) {
    return {
      sentiment:
        rating >= 4 ? "POSITIVE" : rating <= 2 ? "NEGATIVE" : "NEUTRAL",
      summary: "Rating only provided without detailed review.",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "test_gemini_api_key" && apiKey.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Classify the sentiment of this college event review and rating.
Rating: ${rating}/5
Review: "${review}"

Respond ONLY with valid JSON with keys:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "summary": "1 sentence summarizing attendee perception"
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn("[Gemini Feedback Sentiment Notice]:", e.message);
    }
  }

  const sentiment =
    rating >= 4 ? "POSITIVE" : rating <= 2 ? "NEGATIVE" : "NEUTRAL";
  return {
    sentiment,
    summary:
      sentiment === "POSITIVE"
        ? "Attendee expressed high satisfaction with event organization and content."
        : sentiment === "NEGATIVE"
          ? "Attendee reported areas needing improvement in pacing or facilities."
          : "Attendee gave balanced, standard feedback regarding the event.",
  };
};

export const generateEventSentimentReport = async (
  eventTitle,
  feedbacks = [],
) => {
  if (feedbacks.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      executiveSummary: "No attendee feedback collected yet for this event.",
      keyStrengths: [],
      improvementAreas: [],
    };
  }

  const total = feedbacks.length;
  const avgRating = (
    feedbacks.reduce((acc, f) => acc + f.rating, 0) / total
  ).toFixed(1);
  const positiveCount = feedbacks.filter(
    (f) => f.sentiment === "POSITIVE" || f.rating >= 4,
  ).length;
  const negativeCount = feedbacks.filter(
    (f) => f.sentiment === "NEGATIVE" || f.rating <= 2,
  ).length;
  const neutralCount = total - positiveCount - negativeCount;

  const reviewsSnippet = feedbacks
    .filter((f) => f.review)
    .slice(0, 20)
    .map((f) => `(${f.rating}/5): "${f.review}"`)
    .join("\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (
    apiKey &&
    apiKey !== "test_gemini_api_key" &&
    apiKey.length > 10 &&
    reviewsSnippet
  ) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Analyze attendee feedback for the college event "${eventTitle}".
Feedback:
${reviewsSnippet}

Respond ONLY in valid JSON matching this structure:
{
  "executiveSummary": "2-3 sentences summarizing attendee overall satisfaction and vibe",
  "keyStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvementAreas": ["Actionable improvement 1", "Actionable improvement 2"]
}`;

      const res = await model.generateContent(prompt);
      const cleaned = res.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      return {
        averageRating: Number(avgRating),
        totalReviews: total,
        sentimentBreakdown: {
          positive: positiveCount,
          neutral: neutralCount,
          negative: negativeCount,
        },
        ...parsed,
      };
    } catch (e) {
      console.warn("[Gemini Report Notice]:", e.message);
    }
  }

  return {
    averageRating: Number(avgRating),
    totalReviews: total,
    sentimentBreakdown: {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount,
    },
    executiveSummary: `Event received an average score of ${avgRating}/5 stars from ${total} attendee(s). Overall student reception is ${
      positiveCount >= total / 2
        ? "overwhelmingly positive and enthusiastic"
        : "mixed with opportunities for operational polish"
    }.`,
    keyStrengths: [
      "High student engagement and participation levels",
      "Smooth admission check-in via QR ticket passes",
      "Relevant topics and community networking",
    ],
    improvementAreas: [
      "Ensure refreshments and seating accommodate peak arrival times",
      "Maintain session timings according to published schedule",
    ],
  };
};
