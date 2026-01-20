# Edit Question Interface Preview

## Modal Structure

The Edit Question interface appears as a modal overlay with the following layout:

```
┌─────────────────────────────────────────────────────────┐
│  Edit Question                                    [×]    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Question Text *                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Enter the question text...                      │   │
│  │                                                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Question Type *                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Multiple Choice                          ▼      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Domain *              Subdomain                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ Numeracy     │    │ Interest     │                   │
│  └──────────────┘    └──────────────┘                   │
│                                                           │
│  Difficulty Level *                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Easy (1)                                  ▼      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Answer Options *                    [+ Add Option]       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ A. [Option A text...]              [Remove]      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ B. [Option B text...]              [Remove]      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ C. [Option C text...]              [Remove]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Correct Answer Key *                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ A - Option A text...                     ▼      │   │
│  └─────────────────────────────────────────────────┘   │
│  Selected: A - Option A text...                         │
│                                                           │
│  Explanation                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Enter explanation or feedback...                │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│                              [Cancel]  [Update Question] │
└─────────────────────────────────────────────────────────┘
```

## Visual Features

### 1. **Correct Answer Highlighting**
When an option is selected as the correct answer, it appears with:
- Green background (`bg-green-50`)
- Green border (`border-green-300`)
- Bold green letter label
- "✓ Correct" indicator badge

Example:
```
┌─────────────────────────────────────────────┐
│ A. [What is 2+2?]  ✓ Correct  [Remove]    │ ← Green highlight
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ B. [What is 3+1?]              [Remove]    │ ← Normal
└─────────────────────────────────────────────┘
```

### 2. **Answer Key Dropdown**
Shows available options with preview:
- "A - Option A text..."
- "B - Option B text..."
- "C - Option C text..."

### 3. **Form Validation**
- Required fields marked with red asterisk (*)
- Error messages displayed in red alert box at top
- Validation prevents submission if:
  - Question text is empty
  - Domain is missing
  - Multiple choice has < 2 options
  - Answer key is missing for multiple choice

### 4. **Loading States**
- All inputs disabled during submission
- Button shows "Saving..." text
- Submit button disabled with reduced opacity

## Responsive Design

- Modal is responsive (max-width: 3xl on desktop)
- Domain/Subdomain fields stack on mobile
- Scrollable content if form exceeds viewport height
- Sticky header remains visible while scrolling

## Color Scheme

- Primary: Loyola Maroon (`loyola-maroon`)
- Success/Correct: Green (`green-50`, `green-600`)
- Error: Red (`red-50`, `red-700`)
- Background: White with gray borders
- Text: Gray scale (`loyola-gray-*`)

