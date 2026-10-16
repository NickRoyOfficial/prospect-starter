import test from 'node:test';
import assert from 'node:assert/strict';
import { lintCopy, lintText } from '../scripts/audit/copy.mjs';

const block = (text, role = 'body', faq = false) => ({ text, role, faq, selector: 'p', mark: null });
const idsOf = findings => findings.map(f => f.id);

test('ship-blocking copy patterns are failures', () => {
  const cases = [
    ["Here's the thing: we care.", 'copy-banned-phrase'],
    ["It's not just about price, it's about trust.", 'copy-negation-pivot'],
    ['Our crew — the best in town — is ready.', 'copy-em-dash'],
    ['Only 3 spots left this month.', 'copy-scarcity'],
    ['100% satisfaction guaranteed.', 'copy-unsourced-proof'],
    ['Trusted by thousands of homeowners.', 'copy-unsourced-proof'],
    ['In conclusion, call us today.', 'copy-closing-ritual'],
    ['Fast. Local. Trusted.', 'copy-staccato'],
    ['The results speak for themselves.', 'copy-false-agency'],
  ];
  for (const [text, id] of cases) assert.ok(idsOf(lintCopy([block(text)])).includes(id), `${JSON.stringify(text)} should raise ${id}`);
});

test('display copy has its own rules', () => {
  assert.ok(idsOf(lintCopy([block('Elevate your home today', 'heading')])).includes('copy-filler-verb'));
  assert.ok(!idsOf(lintCopy([block('Elevate your home today', 'body')])).includes('copy-filler-verb'));
  assert.ok(idsOf(lintCopy([block('Ready to get started?', 'heading')])).includes('copy-question-headline'));
  assert.ok(!idsOf(lintCopy([block('How long does a cleanup take?', 'heading', true)])).includes('copy-question-headline'), 'FAQ questions are allowed');
  assert.ok(idsOf(lintCopy([block('Learn more', 'cta')])).includes('copy-generic-cta'));
  assert.ok(!idsOf(lintCopy([block('Book a visit', 'cta')])).includes('copy-generic-cta'));
  assert.ok(idsOf(lintCopy([block('Simply the best', 'heading')])).includes('copy-adverb'));
});

test('warnings and notes do not block', () => {
  const f = lintCopy([block('A seamless experience from start to finish, ensuring a stress-free process for everyone.')]);
  assert.ok(f.every(x => x.level !== 'fail'), JSON.stringify(f));
  assert.ok(idsOf(f).includes('copy-ai-vocabulary'));
  assert.ok(idsOf(f).includes('copy-trailing-participle'));
});

test('plain, specific copy passes clean', () => {
  const clean = [
    block('Garden maintenance in Hudson Valley', 'heading'),
    block('Weekly mowing, hedge shaping and seasonal cleanups for homes in Wappinger and Fishkill.'),
    block('Lawn care runs on a weekly schedule from April to November. Hedge work is booked by the job.'),
    block('Send the request', 'cta'),
  ];
  const f = lintCopy(clean).filter(x => x.level !== 'note');
  assert.deepEqual(f, []);
});

test('lintText splits a draft into blocks', () => {
  const f = lintText('Elevate your garden\n\nWe understand that your lawn matters.');
  assert.ok(idsOf(f).includes('copy-filler-verb'));
  assert.ok(idsOf(f).includes('copy-banned-phrase'));
});
