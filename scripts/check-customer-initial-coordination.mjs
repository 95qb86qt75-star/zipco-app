import {runSuite} from './qa/run-suite.mjs';
import {initialCases,runInitialCase} from './qa/customer-initial-cases.mjs';
await runSuite('customer-initial','coordination',initialCases,runInitialCase,process.argv.slice(2));
