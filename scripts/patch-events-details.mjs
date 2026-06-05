import fs from 'node:fs';
const text = fs.readFileSync('src/modules/events/EventsModule.tsx', 'utf8');
const markerStart = "  if (view === 'details' && selectedEvent) {";
const markerEnd = '  return (\n    <div className="space-y-8 animate-in fade-in duration-700 text-left">';
const start = text.indexOf(markerStart);
const end = text.indexOf(markerEnd, start);
const newBlock = `  if (view === 'details' && selectedEvent) {
    return (
      <motion.div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <motion.div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => { setView('list'); setEventDetail(null); }} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
          <motion.div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openSetup} disabled={!eventDetail}>
              <Settings className="w-4 h-4 mr-2" /> Setup
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadAttendanceReport} disabled={!eventAttendees.length}>
              <Download className="w-4 h-4 mr-2" /> Attendance CSV
            </Button>
          </motion.div>
        </motion.div>
        <motion.div>
          <h2 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h2>
          <p className="text-sm text-slate-500 font-medium">
            {selectedEvent.date} · {selectedEvent.type} · {selectedEvent.status}
          </p>
        </motion.div>
        {detailError && <p className="text-sm text-rose-600 font-medium">{detailError}</p>}
        {detailLoading && <p className="text-sm text-slate-500 font-medium">Loading event workspace…</p>}
        {!detailLoading && eventDetail && (
          <EventWorkspace
            eventId={eventDetail.id}
            onModuleChange={onModuleChange}
            currency={settings.financial.currency}
          />
        )}
      </motion.div>
    );
  }

`.replaceAll('motion.div', 'div');
fs.writeFileSync('src/modules/events/EventsModule.tsx', text.slice(0, start) + newBlock + text.slice(end));
console.log('patched', end - start);
