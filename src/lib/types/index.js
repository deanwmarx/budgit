/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string[]} householdIds
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {Object} Household
 * @property {string} id
 * @property {string} name
 * @property {number} budgetCycleStartDay
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {'admin' | 'member'} Role
 */

/**
 * @typedef {Object} HouseholdMember
 * @property {string} householdId
 * @property {string} userId
 * @property {Role} role
 * @property {string} color
 * @property {number} joinedAt
 * @property {number} updatedAt
 */

/**
 * @typedef {Object} DeviceInfo
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {string} userId
 * @property {number} lastActive
 * @property {number} createdAt
 */

/**
 * @typedef {Object} Month
 * @property {string} id - Format: "{householdId}-{YYYY-MM}" (composite key for global uniqueness)
 * @property {string} householdId
 * @property {string} startDate - ISO date string
 * @property {string} endDate - ISO date string
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {Object} Budget
 * @property {string} id
 * @property {string} monthId
 * @property {string} groupName
 * @property {number} amount - Stored as cents
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {'salary' | 'one_time'} IncomeType
 */

/**
 * @typedef {Object} Income
 * @property {string} id
 * @property {string} monthId
 * @property {string} userId
 * @property {string} name
 * @property {number} amount - Stored as cents
 * @property {IncomeType} type
 * @property {string} date - ISO date string
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} createdBy
 * @property {number | null} deletedAt
 */

/**
 * @typedef {'fixed' | 'variable' | 'incidental'} ExpenseCategory
 */

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} monthId
 * @property {string[]} userIds
 * @property {string} name
 * @property {ExpenseCategory} category
 * @property {string | null} budgetGroup
 * @property {number} amount - Stored as cents
 * @property {string} date - ISO date string
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} createdBy
 * @property {number | null} deletedAt
 */

/**
 * @typedef {'income' | 'expense'} TransactionType
 */

/**
 * @typedef {'salary' | 'one_time' | 'fixed' | 'variable' | 'incidental'} TransactionCategory
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} monthId
 * @property {TransactionType} type
 * @property {string} userIds - JSON array string
 * @property {string} name
 * @property {number} amount - Stored as cents
 * @property {TransactionCategory} category
 * @property {string | null} budgetGroup
 * @property {string} date - ISO date string
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {string} createdBy
 * @property {number | null} deletedAt
 */

/**
 * @typedef {'create' | 'update' | 'delete'} SyncOperation
 */

/**
 * @typedef {'income' | 'expense' | 'budget'} EntityType
 */

/**
 * @typedef {Object} SyncLogEntry
 * @property {string} id
 * @property {EntityType} entityType
 * @property {string} entityId
 * @property {SyncOperation} operation
 * @property {string | null} fieldName
 * @property {string | null} oldValue - JSON serialized
 * @property {string | null} newValue - JSON serialized
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {number} timestamp
 * @property {0 | 1} synced - 0=pending, 1=synced
 */

/**
 * @typedef {Object} RTDBOperation
 * @property {string} id
 * @property {EntityType} entityType
 * @property {string} entityId
 * @property {SyncOperation} operation
 * @property {string | null} fieldName
 * @property {string | null} oldValue - JSON serialized
 * @property {string} newValue - JSON serialized
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {number} timestamp
 */

/**
 * @typedef {'pending' | 'completed'} BatchStatus
 */

/**
 * @typedef {Object} RTDBBatch
 * @property {string} deviceId
 * @property {string} deviceName
 * @property {RTDBOperation[]} operations
 * @property {number} timestamp
 * @property {BatchStatus} status
 * @property {Record<string, number>} acks
 * @property {number} expiresAt
 * @property {string[]} expectedDevices
 */

/**
 * @typedef {'synced' | 'syncing' | 'offline' | 'pending'} SyncStatus
 */

/**
 * @typedef {Object} SyncStatusState
 * @property {SyncStatus} status
 * @property {number} pendingCount
 */

export {};
