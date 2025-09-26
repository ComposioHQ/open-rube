import { createClient } from './supabase/server'

export interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  created_at: string
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  if (!userId) {
    console.error('getUserConversations: userId is required')
    return []
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data || []
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  if (!conversationId) {
    console.error('getConversationMessages: conversationId is required')
    return []
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data || []
}

export async function createConversation(userId: string, title?: string): Promise<string | null> {
  if (!userId) {
    console.error('createConversation: userId is required')
    return null
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ user_id: userId, title }])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }

  console.log('Created conversation:', data?.id, 'for user:', userId)
  return data?.id || null
}

export async function addMessage(
  conversationId: string,
  userId: string,
  content: string,
  role: 'user' | 'assistant' | 'system'
): Promise<Message | null> {
  if (!conversationId || !userId || !content) {
    console.error('addMessage: conversationId, userId, and content are required')
    return null
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      user_id: userId,
      content,
      role
    }])
    .select('*')
    .single()

  if (error) {
    console.error('Error adding message:', error)
    return null
  }

  // Update conversation's updated_at timestamp
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (updateError) {
    console.error('Error updating conversation timestamp:', updateError)
  }

  console.log('Added message to conversation:', conversationId, 'for user:', userId)
  return data || null
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId)

  if (error) {
    console.error('Error updating conversation title:', error)
    return false
  }

  return true
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('Error deleting conversation:', error)
    return false
  }

  return true
}

export function generateConversationTitle(firstMessage: string): string {
  // Generate a meaningful title from the first message (limit to 50 chars)
  const cleanMessage = firstMessage.replace(/\n/g, ' ').trim()
  if (cleanMessage.length <= 50) return cleanMessage
  
  const words = cleanMessage.split(' ')
  let title = ''
  
  for (const word of words) {
    if (title.length + word.length + 1 <= 47) {
      title += (title ? ' ' : '') + word
    } else {
      break
    }
  }
  
  return title + '...'
}