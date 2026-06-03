import useEntries from './hooks/useEntries'
import NavHeader from './components/NavHeader'
import EntryCard from './components/EntryCard'
import NewEntryForm from './components/NewEntryForm'

export default function App() {
  const { entries, saveEntry, deleteEntry, updateEntry } = useEntries()

  return (
    <>
      <NavHeader />
      <div className="app">
        <NewEntryForm
          entryCount={entries.length}
          onSave={saveEntry}
        />

        <main id="entries" className="entry-feed">
          {[...entries].reverse().map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onDelete={deleteEntry}
              onUpdate={updateEntry}
            />
          ))}
        </main>
      </div>
    </>
  )
}
