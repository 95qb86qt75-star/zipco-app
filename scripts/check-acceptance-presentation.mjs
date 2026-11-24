import {runSuite} from './qa/run-suite.mjs';
import {acceptanceCases,runAcceptanceCase} from './qa/acceptance-cases.mjs';
await runSuite('acceptance-presentation','acceptance',acceptanceCases,runAcceptanceCase,process.argv.slice(2),['toast','scroll']);
