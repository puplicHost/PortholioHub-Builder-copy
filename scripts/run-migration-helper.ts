import { migrateCardItemsToLinkedPage } from '../src/lib/actions/portfolio'

async function main() {
  console.log('Starting migration helper...')
  const result = await migrateCardItemsToLinkedPage()
  console.log('Migration complete:', JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
