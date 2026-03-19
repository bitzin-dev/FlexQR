const PASSWORD_SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/


export type PasswordRequirementKey =
  | "length"
  | "lowercase"
  | "uppercase"
  | "number"
  | "special"


export interface PasswordRequirementResult {
  key: PasswordRequirementKey
  passed: boolean
}


export interface PasswordStrengthResult {
  score: number
  tone: "weak" | "fair" | "good" | "strong"
  isValid: boolean
  activeSegments: number
  requirements: PasswordRequirementResult[]
}


export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirementResult[] = [
    { key: "length", passed: password.length >= 10 },
    { key: "lowercase", passed: /[a-z]/.test(password) },
    { key: "uppercase", passed: /[A-Z]/.test(password) },
    { key: "number", passed: /\d/.test(password) },
    { key: "special", passed: PASSWORD_SPECIAL_CHARACTER_PATTERN.test(password) },
  ]

  const score = requirements.filter((requirement) => requirement.passed).length

  if (score <= 1) {
    return {
      score,
      tone: "weak",
      isValid: false,
      activeSegments: password ? 1 : 0,
      requirements,
    }
  }

  if (score <= 3) {
    return {
      score,
      tone: "fair",
      isValid: false,
      activeSegments: 2,
      requirements,
    }
  }

  if (score === 4) {
    return {
      score,
      tone: "good",
      isValid: false,
      activeSegments: 3,
      requirements,
    }
  }

  return {
    score,
    tone: "strong",
    isValid: true,
    activeSegments: 4,
    requirements,
  }
}
