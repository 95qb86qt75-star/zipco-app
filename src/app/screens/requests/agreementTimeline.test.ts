import { describe, expect, it } from 'vitest';
import { buildTimeline, diffProposals } from './agreementTimeline';
import { normalizeProposals } from './proposalContract';
import { proposalsFixture } from './proposalFixtures';
import { agreementFixture } from './requestProcessFixtures';

const data = (sequence: number) => {
  const read = normalizeProposals(proposalsFixture(sequence), 7)!;
  const last = read.proposals[sequence];
  const accepted = { ...agreementFixture, acceptedProposalId: last.id, subjectSchemaVersion: last.subjectSchemaVersion,
    subjectSnapshot: last.subjectSnapshot, scheduledFor: last.scheduledFor, totalPriceClp: last.totalPriceClp };
  return { proposals: read.proposals, accepted };
};
describe('immutable agreement timeline', () => {
  it.each([0, 1, 2, 3])('identifies the accepted round and the real accepting actor (%s)', sequence => {
    const { proposals, accepted } = data(sequence);
    const result = buildTimeline(proposals, accepted)!;
    expect(result.rounds).toHaveLength(sequence + 1);
    expect(result.rounds.filter(round => round.accepted)).toHaveLength(1);
    expect(result.rounds.at(-1)?.accepted).toBe(true);
    expect(result.marker).toContain(sequence % 2 ? 'El cliente aceptó' : 'Tú aceptaste');
    expect(result.rounds[0].side).toBe('client');
    expect(result.count).toBe(sequence === 0 ? 'Sin cambios' : `${sequence + 1} propuestas`);
  });
  it('selects by acceptedProposalId and does not mark a later proposal as agreed', () => {
    const { proposals } = data(3); const { accepted } = data(1);
    expect(buildTimeline(proposals, accepted)?.rounds).toHaveLength(2);
  });
  it.each([0,1,2,3])('keeps the same accepted round while presenting the customer perspective (%s)', sequence => {
    const {proposals,accepted}=data(sequence);
    const result=buildTimeline(proposals,accepted,'customer')!;
    expect(result.rounds[0].label).toBe('Tú pediste');
    expect(result.rounds.at(-1)?.accepted).toBe(true);
    expect(result.marker).toContain(sequence%2?'Tú aceptaste':'El negocio aceptó');
    expect(result.who).not.toContain('El cliente');
    expect(result.final).toEqual(buildTimeline(proposals,accepted)!.final);
  });
  it('rejects a different accepted proposal or mismatched immutable values', () => {
    const { proposals, accepted } = data(2);
    expect(() => buildTimeline(proposals, { ...accepted, acceptedProposalId: 999 })).toThrow();
    expect(() => buildTimeline(proposals, { ...accepted, totalPriceClp: 1 })).toThrow();
    expect(() => buildTimeline(proposals, { ...accepted, subjectSnapshot: { ...accepted.subjectSnapshot, items: [] } })).toThrow();
  });
  it('keeps unknown unit prices distinct from zero and detects changes on every item', () => {
    const { proposals } = data(2); const a = proposals[1], b = proposals[2];
    expect(diffProposals(a, b).changes.find(c => c.label === 'Precio / unidad')?.to).toBe('Precio por línea');
    const pair = { ...a, subjectSnapshot: { ...a.subjectSnapshot, items: [a.subjectSnapshot.items[0], a.subjectSnapshot.items[0]] } };
    const changed = structuredClone(pair); changed.subjectSnapshot.items[1].quantity++;
    const diff = diffProposals(pair, changed);
    expect(diff.kept).not.toContain('Cantidad'); expect(diff.changes).toContainEqual({ label: 'Cantidad (2)', from: '2', to: '3' });
  });
});
