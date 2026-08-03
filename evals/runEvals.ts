// Eval runner with regression gating.
//
// A pass rate on its own says little. What makes this a regression check is the baseline:
// any case that used to pass and now fails is an error, so prompt and context changes
// cannot quietly degrade behaviour that already worked.
//
//   npm run evals                     deterministic suite (adds graded cases if a key is set)
//   npm run evals -- --update-baseline  accept current results as the new baseline

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runDeterministicEvals, type EvalResult } from './evalCases.ts'
import { hasModelCredentials, runModelEvals } from './modelEvals.ts'

const BASELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'baseline.json')

type Baseline = { cases: Record<string, boolean> }

function readBaseline(): Baseline {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline
  } catch {
    return { cases: {} }
  }
}

function reportResults(results: EvalResult[]) {
  for (const item of results) {
    console.log(`  ${item.passed ? 'PASS' : 'FAIL'}  ${item.name}  —  ${item.detail}`)
  }
}

function findRegressions(results: EvalResult[], baseline: Baseline) {
  return results.filter((item) => baseline.cases[item.name] === true && !item.passed)
}

async function main() {
  const shouldUpdateBaseline = process.argv.includes('--update-baseline')

  console.log('\nDeterministic evals (context scoping, budgeting, cost math)')
  const deterministicResults = runDeterministicEvals()
  reportResults(deterministicResults)

  let modelResults: EvalResult[] = []
  if (hasModelCredentials()) {
    console.log('\nGraded model evals')
    modelResults = await runModelEvals()
    reportResults(modelResults)
  } else {
    console.log('\nGraded model evals skipped (set ANTHROPIC_API_KEY to run them)')
  }

  const results = [...deterministicResults, ...modelResults]
  const passed = results.filter((item) => item.passed).length
  console.log(`\n${passed}/${results.length} evals passed`)

  if (shouldUpdateBaseline) {
    const cases = Object.fromEntries(results.map((item) => [item.name, item.passed]))
    writeFileSync(BASELINE_PATH, `${JSON.stringify({ cases }, null, 2)}\n`)
    console.log(`Baseline updated at ${BASELINE_PATH}`)
    return
  }

  const regressions = findRegressions(results, readBaseline())
  if (regressions.length > 0) {
    console.error(`\nRegressions against baseline: ${regressions.map((item) => item.name).join(', ')}`)
    process.exitCode = 1
    return
  }

  if (passed < results.length) {
    console.error('\nSome evals failed, though none regressed against the baseline.')
    process.exitCode = 1
  }
}

await main()
