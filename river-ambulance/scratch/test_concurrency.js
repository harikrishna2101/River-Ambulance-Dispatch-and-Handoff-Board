import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testClaimConcurrency() {
  console.log('=== STARTING CONCURRENCY & DATA INTEGRITY AUDIT TEST ===')

  // 1. Create a test dispatch request
  const { data: request, error: reqErr } = await supabase
    .from('dispatch_requests')
    .insert([{
      pickup_location: 'Island A - Test Jetty',
      urgency: 'CRITICAL',
      patient_condition: 'CRITICAL',
      requested_by: 'Concurrency Audit Test Suite',
      status: 'OPEN'
    }])
    .select()
    .single()

  if (reqErr) {
    console.error('Failed to create test request:', reqErr)
    process.exit(1)
  }

  console.log(`Created test OPEN dispatch request: ${request.id}`)

  // 2. Fetch boats BA-01 and BA-02
  const { data: boats, error: boatsErr } = await supabase
    .from('boats')
    .select('id, boat_number, status')
    .in('boat_number', ['BA-01', 'BA-02'])

  if (boatsErr || !boats || boats.length < 2) {
    console.error('Failed to fetch test boats:', boatsErr)
    process.exit(1)
  }

  const boat1 = boats.find(b => b.boat_number === 'BA-01')
  const boat2 = boats.find(b => b.boat_number === 'BA-02')

  console.log(`Boat 1 (BA-01): ${boat1.id}, Status: ${boat1.status}`)
  console.log(`Boat 2 (BA-02): ${boat2.id}, Status: ${boat2.status}`)

  // Ensure both boats are AVAILABLE for clean test
  await supabase.from('boats').update({ status: 'AVAILABLE' }).in('id', [boat1.id, boat2.id])

  console.log('Simulating race condition: Captain 1 (BA-01) and Captain 2 (BA-02) claiming request simultaneously...')

  // 3. Execute simultaneous RPC claims
  const [res1, res2] = await Promise.all([
    supabase.rpc('claim_dispatch_request', {
      p_request_id: request.id,
      p_boat_id: boat1.id,
      p_captain_name: 'Captain 1'
    }),
    supabase.rpc('claim_dispatch_request', {
      p_request_id: request.id,
      p_boat_id: boat2.id,
      p_captain_name: 'Captain 2'
    })
  ])

  console.log('=== CONCURRENCY RPC RESPONSES ===')
  console.log('Captain 1 Claim Result:', res1.data)
  console.log('Captain 2 Claim Result:', res2.data)

  // 4. Evaluate responses
  const results = [res1.data, res2.data]
  const successCount = results.filter(r => r && r.success === true).length
  const conflictCount = results.filter(r => r && r.success === false && r.error === 'Request is no longer OPEN').length

  console.log(`Successful Claims: ${successCount}`)
  console.log(`Controlled Conflicts: ${conflictCount}`)

  // 5. Check database integrity
  const { data: updatedReq } = await supabase
    .from('dispatch_requests')
    .select('*')
    .eq('id', request.id)
    .single()

  const { data: updatedBoats } = await supabase
    .from('boats')
    .select('boat_number, status')
    .in('id', [boat1.id, boat2.id])

  const { data: events } = await supabase
    .from('dispatch_events')
    .select('*')
    .eq('request_id', request.id)
    .eq('event_type', 'JOB_CLAIMED')

  console.log('=== DATABASE INTEGRITY AUDIT ===')
  console.log(`Request Status: ${updatedReq.status}`)
  console.log(`Assigned Boat ID: ${updatedReq.assigned_boat_id}`)
  console.log('Boats Status:', updatedBoats)
  console.log(`JOB_CLAIMED Audit Events Created: ${events.length}`)

  // 6. Assertions
  if (successCount === 1 && conflictCount === 1 && events.length === 1 && updatedReq.status === 'ASSIGNED') {
    console.log('✅ AUDIT PROOF VERIFIED: Scenario A achieved! One successful claim and one controlled conflict. ZERO duplicate assignments.')
  } else {
    console.error('❌ AUDIT FAILURE: Concurrency compromise detected!')
    process.exit(1)
  }
}

testClaimConcurrency().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
