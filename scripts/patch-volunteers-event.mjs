import fs from 'node:fs';

const path = 'src/modules/volunteers/VolunteersModule.tsx';
const text = fs.readFileSync(path, 'utf8');

const oldBlock = `          {(assignForm.entityType === 'Ministry' || assignForm.entityType === 'SmallGroup') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link to team</label>
              <select value={assignForm.entityId} onChange={e => setAssignForm(f => ({ ...f, entityId: e.target.value }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold">
                <option value="">General (not linked)</option>
                {(assignForm.entityType === 'Ministry' ? ministries : smallGroups).map((ent) => (
                  <option key={ent.id} value={ent.id}>{ent.name}</option>
                ))}
              </select>
            </div>
          )}`;

const newBlock = `          {(assignForm.entityType === 'Ministry' || assignForm.entityType === 'SmallGroup' || assignForm.entityType === 'Event') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {assignForm.entityType === 'Event' ? 'Link to event' : 'Link to team'}
              </label>
              <select value={assignForm.entityId} onChange={e => setAssignForm(f => ({ ...f, entityId: e.target.value }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold">
                <option value="">{assignForm.entityType === 'Event' ? 'Select event…' : 'General (not linked)'}</option>
                {(assignForm.entityType === 'Ministry'
                  ? ministries
                  : assignForm.entityType === 'SmallGroup'
                    ? smallGroups
                    : events
                ).map((ent) => (
                  <option key={ent.id} value={ent.id}>{ent.name}</option>
                ))}
              </select>
            </div>
          )}`;

if (!text.includes(oldBlock)) {
  console.error('old block not found');
  process.exit(1);
}
fs.writeFileSync(path, text.replace(oldBlock, newBlock));
console.log('ok');
