from pathlib import Path

p = Path("src/modules/events/EventsModule.tsx")
text = p.read_text(encoding="utf-8")
marker_start = "  if (view === 'details' && selectedEvent) {"
marker_end = "  return (\n    <motion.div className=\"space-y-8 animate-in fade-in duration-700 text-left\">"
start = text.index(marker_start)
end = text.index(marker_end, start)
new_block = """  if (view === 'details' && selectedEvent) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => { setView('list'); setEventDetail(null); }} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openSetup} disabled={!eventDetail}>
              <Settings className="w-4 h-4 mr-2" /> Setup
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadAttendanceReport} disabled={!eventAttendees.length}>
              <Download className="w-4 h-4 mr-2" /> Attendance CSV
            </Button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h2>
          <p className="text-sm text-slate-500 font-medium">
            {selectedEvent.date} · {selectedEvent.type} · {selectedEvent.status}
          </p>
        </div>
        {detailError && <p className="text-sm text-rose-600 font-medium">{detailError}</p>}
        {detailLoading && <p className="text-sm text-slate-500 font-medium">Loading event workspace…</p>}
        {!detailLoading && eventDetail && (
          <EventWorkspace
            eventId={eventDetail.id}
            onModuleChange={onModuleChange}
            currency={settings.financial.currency}
          />
        )}
      </div>
    );
  }

"""
# fix motion.div typo in new_block
new_block = new_block.replace("motion.div", "div").replace("</motion.div>", "</motion.div>")
p.write_text(text[:start] + new_block + text[end:], encoding="utf-8")
print("ok", end - start)
