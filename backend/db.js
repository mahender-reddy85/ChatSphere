// Mock database interface that works with our in-memory store
const store = require('./inMemoryStore');

// Mock pool object that provides the same interface as mysql2/promise
const pool = {
  async execute(query, params = []) {
    // This is a simplified mock implementation
    // In a real implementation, you would parse the query and route to the appropriate store methods
    console.log(`[Mock DB] Executing query: ${query}`, params);
    
    // For now, return an empty result set
    return [[]];
  },
  
  // Add other methods that might be used by the application
  query: async (query, params) => pool.execute(query, params),
  
  // Mock connection for transactions
  getConnection: async () => ({
    execute: pool.execute,
    query: pool.query,
    release: () => {},
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
  }),
  
  // Mock pool methods
  end: () => Promise.resolve(),
};

module.exports = {
  pool,
  // Export the store directly for models that need it
  store,
};
