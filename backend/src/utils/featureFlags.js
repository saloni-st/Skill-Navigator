// Feature flags and configuration for testing modes
class FeatureFlags {
  constructor() {
    this.flags = {
      // Debug & Logging
      enableDebugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true',
      enableSessionEndpoint: process.env.DEBUG_SESSION_ENDPOINT === 'true',
      
      // Testing Modes
      forceRuleOnlyMode: process.env.ENABLE_RULE_ONLY_MODE === 'true',
      forceLLMOnlyMode: process.env.ENABLE_LLM_ONLY_MODE === 'true',
      enableLLMValidation: process.env.ENABLE_LLM_VALIDATION !== 'false', // Default true
      
      // Environment
      isStaging: process.env.NODE_ENV === 'staging',
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development',
      
      // LLM Configuration (Groq)
      llmMaxTokens: parseInt(process.env.GROQ_MAX_TOKENS) || 8000,
      llmModel: process.env.GROQ_MODEL || 'deepseek-r1-distill-llama-70b',
      llmTimeout: parseInt(process.env.LLM_TIMEOUT_MS) || 30000,
      llmRetries: parseInt(process.env.LLM_MAX_RETRIES) || 1,
      
      // Confidence Score Configuration
      confidenceMaxPriorityFactor: parseFloat(process.env.CONFIDENCE_MAX_PRIORITY_FACTOR) || 1.2,
      confidenceCoverageWeight: parseFloat(process.env.CONFIDENCE_COVERAGE_WEIGHT) || 0.5
    };
  }
  
  // Get flag value
  get(flagName) {
    return this.flags[flagName];
  }
  
  // Check if we're in any test mode
  isTestMode() {
    return this.flags.forceRuleOnlyMode || this.flags.forceLLMOnlyMode;
  }
  
  // Determine inference mode based on flags
  getInferenceMode() {
    if (this.flags.forceRuleOnlyMode) return 'rule_only';
    if (this.flags.forceLLMOnlyMode) return 'llm_only'; 
    return 'hybrid'; // Default mode
  }
  
  // Get LLM configuration
  getLLMConfig() {
    return {
      model: this.flags.llmModel,
      maxTokens: this.flags.llmMaxTokens,
      timeout: this.flags.llmTimeout,
      maxRetries: this.flags.llmRetries,
      enableValidation: this.flags.enableLLMValidation
    };
  }
  
  // Get confidence calculation config
  getConfidenceConfig() {
    return {
      maxPriorityFactor: this.flags.confidenceMaxPriorityFactor,
      coverageWeight: this.flags.confidenceCoverageWeight
    };
  }
  
  // Log current configuration (for debugging)
  logConfiguration(logger) {
    if (this.flags.enableDebugLogging) {
      logger.info('null', 'Feature flags configuration loaded', {
        component: 'CONFIG',
        mode: this.getInferenceMode(),
        testMode: this.isTestMode(),
        environment: process.env.NODE_ENV,
        flags: {
          debugLogging: this.flags.enableDebugLogging,
          sessionEndpoint: this.flags.enableSessionEndpoint,
          ruleOnly: this.flags.forceRuleOnlyMode,
          llmOnly: this.flags.forceLLMOnlyMode,
          llmValidation: this.flags.enableLLMValidation
        }
      });
    }
  }
}

// Export singleton instance
const featureFlags = new FeatureFlags();

module.exports = featureFlags;