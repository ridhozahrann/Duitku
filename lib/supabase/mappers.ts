// ponytail: snake<->camel mapping for Supabase rows <-> Zustand types
export function rowToWallet(r: any) { return { id: r.id, name: r.name, description: r.description ?? undefined, balance: Number(r.balance), budgetLimit: r.budget_limit != null ? Number(r.budget_limit) : undefined, icon: r.icon, color: r.color, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) } }
export function walletToRow(w: any, userId: string) { return { id: w.id, user_id: userId, name: w.name, description: w.description ?? null, balance: w.balance, budget_limit: w.budgetLimit ?? null, icon: w.icon, color: w.color } }

export function rowToTx(r: any) { return { id: r.id, type: r.type, amount: Number(r.amount), categoryId: r.category_id, walletId: r.wallet_id ?? undefined, description: r.description, date: new Date(r.date), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) } }
export function txToRow(t: any, userId: string) { return { id: t.id, user_id: userId, type: t.type, amount: t.amount, category_id: t.categoryId, wallet_id: t.walletId ?? null, description: t.description, date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString() } }

export function rowToBill(r: any) { return { id: r.id, name: r.name, amount: Number(r.amount), category: r.category, dueDate: new Date(r.due_date), recurrence: r.recurrence ?? undefined, status: r.status, notes: r.notes ?? undefined, lastPaidAt: r.last_paid_at ? new Date(r.last_paid_at) : undefined, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) } }
export function billToRow(b: any, userId: string) { return { id: b.id, user_id: userId, name: b.name, amount: b.amount, category: b.category, due_date: b.dueDate instanceof Date ? b.dueDate.toISOString() : new Date(b.dueDate).toISOString(), recurrence: b.recurrence ?? null, status: b.status, notes: b.notes ?? null, last_paid_at: b.lastPaidAt ? (b.lastPaidAt instanceof Date ? b.lastPaidAt.toISOString() : new Date(b.lastPaidAt).toISOString()) : null } }

export function rowToHabit(r: any) { return { id: r.id, name: r.name, icon: r.icon, targetPerWeek: r.target_per_week, createdAt: new Date(r.created_at) } }
export function habitToRow(h: any, userId: string) { return { id: h.id, user_id: userId, name: h.name, icon: h.icon, target_per_week: h.targetPerWeek ?? h.target_per_week ?? 7 } }

export function rowToBudget(r: any) { return { id: r.id, categoryId: r.category_id, limit: Number(r.limit), period: r.period } }
export function budgetToRow(b: any, userId: string) { return { id: b.id, user_id: userId, category_id: b.categoryId, limit: b.limit, period: b.period } }

export function rowToGoal(r: any) { return { id: r.id, name: r.name, target: Number(r.target), current: Number(r.current), deadline: r.deadline ? new Date(r.deadline) : undefined, createdAt: new Date(r.created_at) } }
export function goalToRow(g: any, userId: string) { return { id: g.id, user_id: userId, name: g.name, target: g.target, current: g.current, deadline: g.deadline ? (g.deadline instanceof Date ? g.deadline.toISOString() : new Date(g.deadline).toISOString()) : null } }

export function rowToCategory(r: any) { return { id: r.id, name: r.name, type: r.type, icon: r.icon, color: r.color } }
export function categoryToRow(c: any, userId: string) { return { id: c.id, user_id: userId, name: c.name, type: c.type, icon: c.icon, color: c.color } }
