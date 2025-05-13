// config-overrides.js
module.exports = function override(config, env) {
    // Add fallbacks for Node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": false,
      "stream": false,
      "util": false,
      "url": false,
      "buffer": false,
      "fs": false,
      "net": false,
      "tls": false,
      "zlib": false,
      "http": false,
      "https": false,
      "timers": false,
      "os": false,
      "path": false,
      "dns": false,
      "process": false
    };
    
    return config;
  };