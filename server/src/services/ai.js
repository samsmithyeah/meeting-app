import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function summarizeAnswers(question, answers) {
  if (!openai) {
    throw new Error('AI summarization not available - OpenAI API key not configured')
  }

  if (!answers || answers.length === 0) {
    return null
  }

  const answersText = answers.map((a, i) => `${i + 1}. ${a}`).join('\n')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a meeting facilitator assistant. Summarize the responses to meeting questions concisely, highlighting key themes, areas of agreement, and notable differences. Keep summaries brief (2-4 sentences).'
        },
        {
          role: 'user',
          content: `Question: "${question}"\n\nResponses:\n${answersText}\n\nPlease provide a brief summary of these responses.`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Unable to generate summary at this time')
  }
}
