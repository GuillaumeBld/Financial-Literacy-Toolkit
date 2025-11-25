export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase, hasSupabaseCredentials } from '@/lib/supabase'

// Verify instructor session token
async function verifyInstructorToken(token: string) {
  const { data: session, error } = await supabase
    .from('instructor_sessions')
    .select('instructor_id, expires_at')
    .eq('token_hash', token)
    .single()

  if (error || !session) {
    return null
  }

  // Check if session expired
  if (new Date(session.expires_at) < new Date()) {
    return null
  }

  return session.instructor_id
}

type IncomingQuestion = {
  type?: string
  domain?: string
  subdomain?: string
  difficulty?: number | string
  question_text?: string
  options?: string[]
  key?: string
  explanation?: string
}

export async function POST(request: NextRequest) {
  console.log('=== BULK QUESTIONNAIRE UPLOAD START ===')

  if (!hasSupabaseCredentials) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured' },
      { status: 503 }
    )
  }

  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const instructorId = await verifyInstructorToken(token)
    if (!instructorId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const { questions } = body as { questions?: IncomingQuestion[] }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No questionnaire rows provided' }, { status: 400 })
    }

    const sanitizedQuestions = questions
      .map((question, idx) => {
        const questionText = question.question_text?.trim()
        const domain = question.domain?.trim()
        const type = question.type?.trim() || 'multiple-choice'

        if (!questionText || !domain) {
          console.warn(`Skipping row ${idx + 1} due to missing required fields`)
          return null
        }

        const parsedDifficulty = Number(question.difficulty ?? 1)
        const difficulty = Number.isNaN(parsedDifficulty) ? 1 : parsedDifficulty

        const options = Array.isArray(question.options)
          ? question.options.map((opt) => opt?.trim()).filter(Boolean)
          : null

        return {
          type,
          domain,
          subdomain: question.subdomain?.trim() || '',
          difficulty,
          question_text: questionText,
          options: options && options.length > 0 ? options : null,
          key: question.key?.trim() || null,
          explanation: question.explanation?.trim() || null,
        }
      })
      .filter(Boolean) as Record<string, unknown>[]

    if (sanitizedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Questionnaire contained no valid rows' },
        { status: 400 }
      )
    }

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('items')
      .insert(sanitizedQuestions)
      .select()

    if (insertError) {
      console.error('Error uploading questionnaire:', insertError)
      return NextResponse.json(
        { error: 'Failed to save questionnaire rows' },
        { status: 500 }
      )
    }

    console.log('Uploaded questionnaire rows:', insertedQuestions?.length || 0)

    return NextResponse.json({
      success: true,
      insertedCount: insertedQuestions?.length || sanitizedQuestions.length,
      questions: insertedQuestions ?? [],
    })
  } catch (error) {
    console.error('=== BULK QUESTIONNAIRE UPLOAD ERROR ===', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
