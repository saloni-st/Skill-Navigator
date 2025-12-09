# Admin Guide - SkillNavigator

**Comprehensive guide for system administrators and maintainers**

## 🎯 **Overview**

This guide covers administrative operations for the SkillNavigator learning recommendation system, including confidence analysis, rule management, LLM operations, and troubleshooting.

## 📊 **Understanding Confidence Breakdown**

### **What is Confidence Breakdown?**
The confidence breakdown provides detailed insight into how the system calculated its recommendation confidence score. It shows which rules contributed, their individual scores, and coverage metrics.

### **Confidence Breakdown Structure**
```json
{
  "confidence": 0.82,
  "confidenceBreakdown": {
    "totalPositive": 2.4,
    "maxPossible": 3.0,
    "coverage": 0.85,
    "algorithm": "weighted_rule_scoring_v2",
    "breakdown": [
      {
        "ruleId": "beginner_web_foundation",
        "ruleName": "Complete Beginner Web Foundation",
        "score": 1.2,
        "weight": 0.9,
        "matched": true,
        "priorityFactor": 1.5,
        "matchStrength": 1.0,
        "contribution": "primary"
      },
      {
        "ruleId": "frontend_specialist", 
        "ruleName": "Frontend Development Specialization",
        "score": 0.8,
        "weight": 0.7,
        "matched": true,
        "priorityFactor": 1.2,
        "matchStrength": 0.8,
        "contribution": "supplementary"
      }
    ]
  }
}
```

### **Key Metrics Interpretation**

#### **Overall Confidence (0.0 - 1.0)**
- **0.8-1.0**: 🟢 **Excellent** - Clear learning path, high user satisfaction expected
- **0.6-0.79**: 🟡 **Good** - Solid recommendation, minor adjustments may help
- **0.4-0.59**: 🟠 **Fair** - Decent match but review rule weights/conditions
- **0.0-0.39**: 🔴 **Poor** - Investigate rule gaps or profile normalization

#### **Total Positive Score**
- Sum of all positive rule contributions
- Higher = more rules matched with good strength
- **Target**: >70% of maxPossible for confidence >0.7

#### **Coverage (0.0 - 1.0)**
- Percentage of decisive facts provided by user
- Low coverage = user didn't provide enough info
- **Target**: >0.8 for reliable recommendations

#### **Individual Rule Scores**
- **Score**: Rule weight × priority factor × match strength
- **Match Strength**: How well user profile fits rule conditions (0.0-1.0)
- **Priority Factor**: Multiplier based on rule priority (1.0-2.0)

### **When to Adjust Rule Weights/Priority**

#### **Scenarios Requiring Adjustment**

1. **Low Confidence Despite Good Rule Matches**
   ```
   Problem: confidence = 0.55, but 3+ rules matched with strength >0.7
   Solution: Increase weights of well-matching rules
   Action: Update rule weight from 0.6 → 0.8
   ```

2. **High Confidence with Poor User Feedback**
   ```
   Problem: confidence = 0.85, but users report recommendations don't fit
   Solution: Review rule conditions and match strength calculation
   Action: Tighten rule conditions or reduce weight
   ```

3. **Unbalanced Rule Contributions**
   ```
   Problem: One rule dominates (score = 2.0), others minimal (score <0.3)
   Solution: Rebalance weights to distribute influence
   Action: Reduce dominant rule weight, increase others
   ```

#### **Weight Adjustment Guidelines**

| Rule Priority | Recommended Weight Range | Use Case |
|--------------|-------------------------|-----------|
| Critical (10) | 0.8 - 1.0 | Core foundational rules |
| High (8-9) | 0.6 - 0.8 | Important specialization rules |
| Medium (5-7) | 0.4 - 0.6 | Supporting/context rules |
| Low (1-4) | 0.2 - 0.4 | Edge cases/fallback rules |

#### **Priority Adjustment Guidelines**

- **Priority 10**: Essential rules that should always fire for specific profiles
- **Priority 8-9**: Important rules for major learning paths
- **Priority 5-7**: Supplementary rules that add value
- **Priority 1-4**: Fallback rules for edge cases

### **Making Rule Adjustments**

#### **1. Access Admin Panel**
```bash
# Login with admin credentials
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@skillnavigator.com",
    "password": "admin123"
  }'
```

#### **2. Get Current Rule Configuration**
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/rules
```

#### **3. Update Rule Weight/Priority**
```bash
curl -X PUT http://localhost:3001/api/admin/rules/RULE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 0.8,
    "priority": 9,
    "explanation": "Increased weight based on user feedback analysis"
  }'
```

#### **4. Test Changes**
```bash
curl -X POST http://localhost:3001/api/admin/test-rules \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testProfileId": "TEST_PROFILE_ID",
    "domainId": "DOMAIN_ID"
  }'
```

## 🔄 **LLM Refinement Management**

### **Force Re-run LLM Refinement**

#### **For Specific Session**
```bash
# Re-run LLM refinement for a session
curl -X POST http://localhost:3001/api/results/SESSION_ID/retry-llm \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json"

# Response
{
  "success": true,
  "data": {
    "sessionId": "session_123",
    "llmStatus": "success",
    "llmRecommendation": {...},
    "retryAttempt": 2,
    "processingTime": "1.2s"
  }
}
```

#### **Bulk LLM Re-processing**
```bash
# Get sessions needing LLM retry
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3001/api/admin/sessions?llmStatus=failed&limit=100"

# Batch retry script
for session_id in $(echo $FAILED_SESSIONS | jq -r '.data.sessions[].id'); do
  curl -X POST http://localhost:3001/api/results/$session_id/retry-llm \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  sleep 1  # Rate limiting
done
```

### **LLM Configuration Management**

#### **Check LLM Health**
```bash
curl http://localhost:3001/api/debug/llm-health

# Response
{
  "status": "healthy",
  "model": "deepseek-r1-distill-llama-70b",
  "lastSuccessful": "2025-09-29T12:00:00Z",
  "errorRate": 0.02,
  "averageLatency": "1.8s"
}
```

#### **Update LLM Settings**
```bash
# Temporarily disable LLM refinement
curl -X PUT http://localhost:3001/api/admin/settings \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableLLMRefinement": false,
    "reason": "High error rate detected"
  }'

# Re-enable with new configuration
curl -X PUT http://localhost:3001/api/admin/settings \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableLLMRefinement": true,
    "llmTimeout": 10000,
    "maxRetries": 3
  }'
```

## 🔍 **Session Analysis & Debugging**

### **Deep Session Analysis**
```bash
# Get comprehensive session debug info
curl http://localhost:3001/api/debug/session/SESSION_ID

# Response includes:
{
  "sessionDetails": {
    "id": "session_123",
    "userId": "user_456",
    "status": "completed",
    "createdAt": "2025-09-29T10:00:00Z",
    "completedAt": "2025-09-29T10:05:00Z"
  },
  "userAnswers": {...},
  "normalizedFacts": {...},
  "matchedRules": [...],
  "confidenceBreakdown": {...},
  "llmTrace": {
    "status": "success",
    "requestPayload": {...},
    "responseValidation": {...},
    "processingTime": "1.8s",
    "retryAttempts": 1
  }
}
```

### **Batch Session Analysis**
```bash
# Get sessions with specific criteria
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3001/api/admin/sessions?confidence=lt:0.6&limit=50"

# Analyze confidence distribution
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/analytics/confidence-distribution
```

## 📋 **User Profile Management**

### **Review User Profiles**
```bash
# Get users with low confidence sessions
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3001/api/admin/users?lowConfidence=true"

# Get specific user's session history
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/users/USER_ID/sessions
```

### **Profile Normalization Issues**
```bash
# Check fact normalization for specific answers
curl -X POST http://localhost:3001/api/admin/test-normalization \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "education_level": "some_college",
      "coding_experience": "2", 
      "weekly_hours": "15"
    }
  }'
```

## 🚨 **Monitoring & Alerts**

### **Key Metrics Dashboard**
Access real-time metrics:
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/metrics/dashboard
```

### **Critical Alerts Configuration**

#### **LLM Failure Rate Alert**
```javascript
// Alert when LLM failure rate > 10%
{
  "metric": "llm_failure_rate",
  "threshold": 0.10,
  "action": "disable_llm_refinement",
  "notification": "admin@skillnavigator.com"
}
```

#### **Low Confidence Rate Alert**
```javascript
// Alert when >30% of sessions have confidence <0.6
{
  "metric": "low_confidence_rate", 
  "threshold": 0.30,
  "action": "review_rule_weights",
  "notification": "admin@skillnavigator.com"
}
```

## 🛠️ **Troubleshooting Common Issues**

### **Low Confidence Scores**

#### **Diagnosis Steps**
1. **Check Coverage**: Is the user providing enough information?
2. **Rule Matching**: Are the right rules firing for the profile?
3. **Weight Distribution**: Are rule weights balanced appropriately?
4. **Fact Normalization**: Are user answers being normalized correctly?

#### **Solutions**
- **Low Coverage**: Update questionnaire to capture more decisive facts
- **Poor Rule Matching**: Adjust rule conditions or add new rules
- **Unbalanced Weights**: Redistribute rule weights based on user feedback
- **Normalization Issues**: Update fact normalization logic

### **LLM Integration Issues**

#### **Common Problems**
1. **High Timeout Rate**: Increase timeout settings or reduce context size
2. **Validation Failures**: Check prompt templates and response format
3. **Rate Limiting**: Implement proper backoff and queuing
4. **Poor Response Quality**: Refine prompts and add more context

#### **Emergency Procedures**
```bash
# Disable LLM refinement immediately
curl -X PUT http://localhost:3001/api/admin/emergency/disable-llm \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Switch to fallback-only mode
curl -X PUT http://localhost:3001/api/admin/emergency/fallback-mode \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 📈 **Performance Optimization**

### **Database Optimization**
```bash
# Check slow queries
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/database/slow-queries

# Analyze index usage
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/database/index-analysis
```

### **Rule Engine Optimization**
```bash
# Analyze rule evaluation performance
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/rules/performance-analysis

# Get rule usage statistics
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/rules/usage-stats
```

## 🔐 **Security & Access Control**

### **Admin Access Management**
```bash
# Create new admin user
curl -X POST http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@skillnavigator.com",
    "role": "admin",
    "permissions": ["rules", "sessions", "analytics"]
  }'
```

### **Audit Logging**
```bash
# Get admin activity logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/audit-logs

# Get specific admin's actions
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3001/api/admin/audit-logs?userId=ADMIN_ID"
```

## 📞 **Support & Escalation**

### **When to Escalate**
- LLM failure rate >15% for >30 minutes
- Confidence scores dropping significantly (>20% decrease)
- Database performance issues affecting response times
- Security incidents or suspicious activity

### **Escalation Contacts**
- **Technical Issues**: dev-team@skillnavigator.com
- **Security Issues**: security@skillnavigator.com  
- **Emergency**: emergency@skillnavigator.com

---

**Last Updated**: September 29, 2025  
**Version**: 1.0.0  
**Support**: admin-support@skillnavigator.com