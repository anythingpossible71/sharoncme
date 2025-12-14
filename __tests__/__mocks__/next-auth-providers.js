// Mock for next-auth/providers/* ESM modules
// This allows Jest to handle next-auth v5 provider imports

module.exports = function createProvider(config) {
  return {
    id: config.id || 'mock-provider',
    name: config.name || 'Mock Provider',
    type: config.type || 'oauth',
    options: config,
  };
};
