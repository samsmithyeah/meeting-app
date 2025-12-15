import OpenAI from 'openai'
import type { GroupAnswersAIResult } from '../types/index.js'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const GROUPING_SYSTEM_PROMPT = `You are a meeting facilitator assistant that groups participant responses by theme.

Analyze the responses and create 2-5 logical groups based on common themes, patterns, or sentiments.

Rules:
- Each group name should be 2-4 words, descriptive but concise
- Every answer should be assigned to exactly one group
- If an answer doesn't fit any group well, leave it ungrouped
- If there are fewer than 4 answers, create 1-2 groups maximum
- If all answers are very similar, create just one group
- If all answers are completely different, create fewer groups with broader themes

Return JSON in this exact format:
{
  "groups": [
    { "groupName": "Theme Name", "answerIds": ["id1", "id2"] }
  ],
  "ungroupedIds": ["id3"]
}`

export async function summarizeAnswers(
  question: string,
  answers: string[]
): Promise<string | null> {
  if (!openai) {
    throw new Error('AI summarization not available - OpenAI API key not configured')
  }

  if (!answers || answers.length === 0) {
    return null
  }

  const answersText = answers.map((a, i) => `${i + 1}. ${a}`).join('\n')

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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

function validateGroupingResult(result: unknown, validIds: string[]): GroupAnswersAIResult {
  const validIdSet = new Set(validIds)
  const usedIds = new Set<string>()

  // Type guard for the expected structure
  if (!result || typeof result !== 'object') {
    return { groups: [], ungroupedIds: validIds }
  }

  const parsed = result as { groups?: unknown[]; ungroupedIds?: unknown[] }

  const validGroups: GroupAnswersAIResult['groups'] = []

  if (Array.isArray(parsed.groups)) {
    for (const group of parsed.groups) {
      if (
        typeof group === 'object' &&
        group !== null &&
        'groupName' in group &&
        'answerIds' in group &&
        typeof (group as { groupName: unknown }).groupName === 'string' &&
        Array.isArray((group as { answerIds: unknown }).answerIds)
      ) {
        const validAnswerIds = ((group as { answerIds: unknown[] }).answerIds || []).filter(
          (id): id is string => typeof id === 'string' && validIdSet.has(id) && !usedIds.has(id)
        )
        validAnswerIds.forEach((id) => usedIds.add(id))

        if (validAnswerIds.length > 0) {
          validGroups.push({
            groupName: (group as { groupName: string }).groupName,
            answerIds: validAnswerIds
          })
        }
      }
    }
  }

  // Any IDs not used go to ungrouped
  const ungroupedIds = validIds.filter((id) => !usedIds.has(id))

  return { groups: validGroups, ungroupedIds }
}

export async function groupAnswers(
  question: string,
  answers: { id: string; text: string }[]
): Promise<GroupAnswersAIResult> {
  if (!openai) {
    throw new Error('AI grouping not available - OpenAI API key not configured')
  }

  if (!answers || answers.length === 0) {
    return { groups: [], ungroupedIds: [] }
  }

  // For very few answers, skip AI and return single group
  if (answers.length < 4) {
    return {
      groups: [{ groupName: 'All Responses', answerIds: answers.map((a) => a.id) }],
      ungroupedIds: []
    }
  }

  const answersText = answers.map((a) => `[${a.id}] ${a.text}`).join('\n')

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: GROUPING_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Question: "${question}"\n\nResponses:\n${answersText}\n\nGroup these responses by theme.`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3
    })

    const content = response.choices[0].message.content || '{}'
    const result = JSON.parse(content)

    return validateGroupingResult(
      result,
      answers.map((a) => a.id)
    )
  } catch (error) {
    console.error('OpenAI grouping error:', error)
    throw new Error('Unable to group answers at this time')
  }
}
