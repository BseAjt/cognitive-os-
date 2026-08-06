import { cloudConfigured, supabase } from '../lib/supabase'

const LOCAL_KEY = 'memoryos.cloud.fallback'
const emptyState = { journeys: [], memories: [], decisions: [], reflections: [] }

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || emptyState }
  catch { return emptyState }
}

function writeLocal(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  return state
}

function localRepository() {
  return {
    mode: 'local',
    async load() { return readLocal() },
    async createJourney(name) {
      const state = readLocal()
      const journey = { id: crypto.randomUUID(), name, clarity: 10, created_at: new Date().toISOString() }
      state.journeys.unshift(journey)
      writeLocal(state)
      return journey
    },
    async createMemory(payload) {
      const state = readLocal()
      const memory = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload }
      state.memories.unshift(memory)
      writeLocal(state)
      return memory
    },
    async createDecision(payload) {
      const state = readLocal()
      const decision = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload }
      state.decisions.unshift(decision)
      writeLocal(state)
      return decision
    },
    async updateDecision(id, patch) {
      const state = readLocal()
      state.decisions = state.decisions.map(row => row.id === id ? { ...row, ...patch, updated_at: new Date().toISOString() } : row)
      writeLocal(state)
      return state.decisions.find(row => row.id === id)
    },
    async createReflection(payload) {
      const state = readLocal()
      const reflection = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload }
      state.reflections.unshift(reflection)
      writeLocal(state)
      return reflection
    }
  }
}

function cloudRepository() {
  return {
    mode: 'cloud',
    async load() {
      const [journeys, memories, decisions, reflections] = await Promise.all([
        supabase.from('journeys').select('*').order('created_at', { ascending: false }),
        supabase.from('memories').select('*, memory_items(*)').order('created_at', { ascending: false }),
        supabase.from('decisions').select('*').order('created_at', { ascending: false }),
        supabase.from('reflections').select('*').order('created_at', { ascending: false })
      ])
      for (const result of [journeys, memories, decisions, reflections]) if (result.error) throw result.error
      return { journeys: journeys.data, memories: memories.data, decisions: decisions.data, reflections: reflections.data }
    },
    async createJourney(name) {
      const { data, error } = await supabase.from('journeys').insert({ name, clarity: 10 }).select().single()
      if (error) throw error
      return data
    },
    async createMemory(payload) {
      const { items = [], ...memoryPayload } = payload
      const { data: memory, error } = await supabase.from('memories').insert(memoryPayload).select().single()
      if (error) throw error
      if (items.length) {
        const rows = items.map(item => ({ memory_id: memory.id, type: item.type, content: item.text, approved: item.approved !== false }))
        const { error: itemsError } = await supabase.from('memory_items').insert(rows)
        if (itemsError) throw itemsError
      }
      return { ...memory, memory_items: items }
    },
    async createDecision(payload) {
      const { data, error } = await supabase.from('decisions').insert(payload).select().single()
      if (error) throw error
      return data
    },
    async updateDecision(id, patch) {
      const { data, error } = await supabase.from('decisions').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    async createReflection(payload) {
      const { data, error } = await supabase.from('reflections').insert(payload).select().single()
      if (error) throw error
      return data
    }
  }
}

export function createMemoryRepository() {
  const requested = import.meta.env.VITE_MEMORYOS_MODE || 'auto'
  if (requested === 'local') return localRepository()
  if (requested === 'cloud' && !cloudConfigured) throw new Error('Le mode cloud est demandé mais Supabase n’est pas configuré.')
  return cloudConfigured ? cloudRepository() : localRepository()
}
