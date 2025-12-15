import { supabase } from '../config/supabase.js'
import type { GroupAnswersAIResult, GroupedAnswersData, GroupWithAnswers } from '../types/index.js'

interface AnswerWithParticipant {
  id: string
  text: string
  participantName: string | null
}

export async function saveGroupsToDatabase(
  questionId: string,
  groupingResult: GroupAnswersAIResult,
  answersMap: Map<string, AnswerWithParticipant>
): Promise<GroupedAnswersData> {
  // First, clear any existing groups for this question
  await supabase.from('answer_groups').delete().eq('question_id', questionId)

  const savedGroups: GroupWithAnswers[] = []

  // Create groups and mappings
  for (let i = 0; i < groupingResult.groups.length; i++) {
    const group = groupingResult.groups[i]

    // Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('answer_groups')
      .insert({
        question_id: questionId,
        name: group.groupName,
        display_order: i
      })
      .select()
      .single()

    if (groupError || !newGroup) {
      console.error('Error creating group:', groupError)
      continue
    }

    // Create mappings for answers in this group
    const mappings = group.answerIds.map((answerId) => ({
      answer_id: answerId,
      group_id: newGroup.id
    }))

    if (mappings.length > 0) {
      const { error: mappingError } = await supabase.from('answer_group_mappings').insert(mappings)

      if (mappingError) {
        console.error('Error creating mappings:', mappingError)
      }
    }

    // Build the grouped answers with participant info
    const groupAnswers = group.answerIds
      .map((id) => answersMap.get(id))
      .filter((a): a is AnswerWithParticipant => a !== undefined)

    savedGroups.push({
      id: newGroup.id,
      name: newGroup.name,
      displayOrder: newGroup.display_order,
      answers: groupAnswers
    })
  }

  // Build ungrouped answers
  const ungrouped = groupingResult.ungroupedIds
    .map((id) => answersMap.get(id))
    .filter((a): a is AnswerWithParticipant => a !== undefined)

  return { groups: savedGroups, ungrouped }
}

export async function getGroupsForQuestion(
  questionId: string,
  showParticipantNames: boolean
): Promise<GroupedAnswersData> {
  // Get all groups for this question
  const { data: groups } = await supabase
    .from('answer_groups')
    .select('*')
    .eq('question_id', questionId)
    .order('display_order')

  // Get all answers for this question with their group mappings
  const { data: answers } = await supabase
    .from('answers')
    .select(
      `
      id,
      text,
      participants (id, name),
      answer_group_mappings (group_id)
    `
    )
    .eq('question_id', questionId)

  if (!answers) {
    return { groups: [], ungrouped: [] }
  }

  // Build a map of group_id -> answers
  const groupedAnswersMap = new Map<string, AnswerWithParticipant[]>()
  const ungrouped: AnswerWithParticipant[] = []

  for (const answer of answers) {
    const participant = Array.isArray(answer.participants)
      ? answer.participants[0]
      : answer.participants
    const participantName = showParticipantNames ? (participant?.name ?? null) : null

    const answerData: AnswerWithParticipant = {
      id: answer.id,
      text: answer.text,
      participantName
    }

    const mapping = Array.isArray(answer.answer_group_mappings)
      ? answer.answer_group_mappings[0]
      : answer.answer_group_mappings

    if (mapping?.group_id) {
      const existing = groupedAnswersMap.get(mapping.group_id) || []
      existing.push(answerData)
      groupedAnswersMap.set(mapping.group_id, existing)
    } else {
      ungrouped.push(answerData)
    }
  }

  // Build the result
  const resultGroups: GroupWithAnswers[] = (groups || []).map((g) => ({
    id: g.id,
    name: g.name,
    displayOrder: g.display_order,
    answers: groupedAnswersMap.get(g.id) || []
  }))

  return { groups: resultGroups, ungrouped }
}

export async function moveAnswerToGroup(
  questionId: string,
  answerId: string,
  targetGroupId: string | null,
  showParticipantNames: boolean
): Promise<GroupedAnswersData> {
  // Delete existing mapping if any
  await supabase.from('answer_group_mappings').delete().eq('answer_id', answerId)

  // Create new mapping if target is not null (null means ungrouped)
  if (targetGroupId) {
    await supabase.from('answer_group_mappings').insert({
      answer_id: answerId,
      group_id: targetGroupId
    })
  }

  return getGroupsForQuestion(questionId, showParticipantNames)
}

export async function createGroup(
  questionId: string,
  name: string,
  answerIds: string[] | undefined,
  showParticipantNames: boolean
): Promise<GroupedAnswersData> {
  // Get the max display_order for this question
  const { data: existingGroups } = await supabase
    .from('answer_groups')
    .select('display_order')
    .eq('question_id', questionId)
    .order('display_order', { ascending: false })
    .limit(1)

  const maxOrder = existingGroups?.[0]?.display_order ?? -1

  // Create the group
  const { data: newGroup, error } = await supabase
    .from('answer_groups')
    .insert({
      question_id: questionId,
      name,
      display_order: maxOrder + 1
    })
    .select()
    .single()

  if (error || !newGroup) {
    throw new Error('Failed to create group')
  }

  // Move answers to this group if any provided
  if (answerIds && answerIds.length > 0) {
    // Remove existing mappings for these answers
    await supabase.from('answer_group_mappings').delete().in('answer_id', answerIds)

    // Create new mappings
    const mappings = answerIds.map((answerId) => ({
      answer_id: answerId,
      group_id: newGroup.id
    }))
    await supabase.from('answer_group_mappings').insert(mappings)
  }

  return getGroupsForQuestion(questionId, showParticipantNames)
}

export async function renameGroup(
  questionId: string,
  groupId: string,
  name: string,
  showParticipantNames: boolean
): Promise<GroupedAnswersData> {
  await supabase.from('answer_groups').update({ name }).eq('id', groupId)

  return getGroupsForQuestion(questionId, showParticipantNames)
}

export async function deleteGroup(
  questionId: string,
  groupId: string,
  showParticipantNames: boolean
): Promise<GroupedAnswersData> {
  // Delete the group - cascades will remove mappings
  await supabase.from('answer_groups').delete().eq('id', groupId)

  return getGroupsForQuestion(questionId, showParticipantNames)
}
