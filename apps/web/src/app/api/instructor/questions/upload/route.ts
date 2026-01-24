export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { queryMany, transaction } from '@/lib/db'
import { verifyInstructorToken } from '@/lib/instructor-auth'

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
        const type = question.type?.trim() || 'multiple_choice'

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
          stem: questionText,
          options: options && options.length > 0 ? options : null, // pg driver automatically serializes arrays to JSONB
          key: question.key?.trim() || null,
          rubric: question.explanation?.trim() ? { explanation: question.explanation } : null, // pg driver automatically serializes objects to JSONB
        }
      })
      .filter(Boolean) as Array<{
        type: string
        domain: string
        subdomain: string
        difficulty: number
        stem: string
        options: string[] | null
        key: string | null
        rubric: { explanation: string } | null
      }>

    if (sanitizedQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Questionnaire contained no valid rows' },
        { status: 400 }
      )
    }

    // Insert questions in a transaction
    const insertedQuestions = await transaction(async (client) => {
      const results = []
      for (const question of sanitizedQuestions) {
        const result = await client.query(
          `INSERT INTO items (type, domain, subdomain, difficulty, stem, options, key, rubric)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING item_id, type, domain, subdomain, difficulty, stem, options, key, rubric`,
          [
            question.type,
            question.domain,
            question.subdomain,
            question.difficulty,
            question.stem,
            question.options,
            question.key,
            question.rubric
          ]
        )
        results.push(result.rows[0])
      }
      return results
    })

    console.log('Uploaded questionnaire rows:', insertedQuestions.length)

    return NextResponse.json({
      success: true,
      insertedCount: insertedQuestions.length,
      questions: insertedQuestions,
    })
  } catch (error) {
    console.error('=== BULK QUESTIONNAIRE UPLOAD ERROR ===', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
