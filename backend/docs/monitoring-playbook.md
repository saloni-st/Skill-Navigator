# Monitoring Playbook - SkillNavigator

**Operations guide for monitoring, alerting, and incident response**

## 🎯 **Overview**

This playbook provides comprehensive monitoring guidance for the SkillNavigator learning recommendation system, including key metrics, alert thresholds, and response procedures for production operations.

## 📊 **Key Metrics to Monitor**

### **1. LLM Performance Metrics**

#### **LLM Failure Rate**
- **Metric**: `llm_failure_rate`
- **Definition**: Percentage of LLM requests that fail (timeout, API error, validation failure)
- **Normal Range**: 0-5%
- **Warning Threshold**: >10%
- **Critical Threshold**: >15%
- **Collection Method**:
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:3001/api/admin/metrics/llm-failure-rate
  ```

#### **Average LLM Latency**
- **Metric**: `llm_avg_latency`
- **Definition**: Average time to complete LLM requests (successful only)
- **Normal Range**: 1.5-3.0 seconds
- **Warning Threshold**: >5 seconds
- **Critical Threshold**: >8 seconds
- **Collection Method**:
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:3001/api/admin/metrics/llm-latency
  ```

#### **LLM Request Volume**
- **Metric**: `llm_requests_per_minute`
- **Definition**: Number of LLM requests processed per minute
- **Normal Range**: 10-100 RPM (depends on traffic)
- **Monitor For**: Sudden spikes or drops indicating issues

### **2. Confidence Scoring Metrics**

#### **Average Confidence Score**
- **Metric**: `avg_confidence_score`
- **Definition**: Average confidence score across all completed sessions
- **Normal Range**: 0.65-0.85
- **Warning Threshold**: <0.60 or >0.90
- **Critical Threshold**: <0.50 or >0.95
- **Collection Method**:
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:3001/api/admin/metrics/confidence-average
  ```

#### **Low Confidence Rate**
- **Metric**: `low_confidence_rate`
- **Definition**: Percentage of sessions with confidence <0.6
- **Normal Range**: 5-15%
- **Warning Threshold**: >25%
- **Critical Threshold**: >40%
- **Indicates**: Rule matching issues, poor normalization, or profile gaps

#### **Confidence Distribution**
- **Metric**: `confidence_distribution`
- **Definition**: Histogram of confidence scores
- **Monitor For**: Unusual distribution patterns
- **Collection Method**:
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:3001/api/admin/metrics/confidence-distribution
  ```

### **3. System Performance Metrics**

#### **Sessions Processed Per Minute**
- **Metric**: `sessions_per_minute`
- **Definition**: Number of completed recommendation sessions per minute
- **Normal Range**: 5-50 SPM (traffic dependent)
- **Monitor For**: Sudden drops indicating system issues
- **Collection Method**:
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:3001/api/admin/metrics/session-throughput
  ```

#### **API Response Time**
- **Metric**: `api_response_time_95th`
- **Definition**: 95th percentile API response time
- **Normal Range**: <500ms
- **Warning Threshold**: >1000ms
- **Critical Threshold**: >2000ms

#### **Database Performance**
- **Metric**: `db_query_time_avg`
- **Definition**: Average database query execution time
- **Normal Range**: <100ms
- **Warning Threshold**: >250ms
- **Critical Threshold**: >500ms

### **4. Rule Engine Metrics**

#### **Rule Match Distribution**
- **Metric**: `rule_match_distribution`
- **Definition**: Frequency of each rule being matched
- **Purpose**: Identify unused rules or over-dominant rules
- **Collection Method**:
  ```bash
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
    http://localhost:3001/api/admin/metrics/rule-matches
  ```

#### **Average Rules Matched Per Session**
- **Metric**: `avg_rules_matched`
- **Definition**: Average number of rules matched per session
- **Normal Range**: 2-5 rules
- **Warning**: <1.5 or >8 (indicates rule configuration issues)

### **5. User Experience Metrics**

#### **Session Completion Rate**
- **Metric**: `session_completion_rate`
- **Definition**: Percentage of started sessions that complete successfully
- **Normal Range**: >85%
- **Warning Threshold**: <80%
- **Critical Threshold**: <70%

#### **User Retry Rate**
- **Metric**: `user_retry_rate`
- **Definition**: Percentage of users who retry LLM refinement
- **Normal Range**: 5-15%
- **Monitor For**: Spikes indicating LLM quality issues

## 🚨 **Alert Configuration**

### **Critical Alerts (Immediate Response)**

#### **LLM Failure Rate Critical**
```yaml
alert: llm_failure_rate_critical
condition: llm_failure_rate > 15%
duration: 5 minutes
severity: critical
action: disable_llm_refinement
notification:
  - pagerduty: on-call-team
  - slack: #alerts-critical
  - email: engineering-oncall@skillnavigator.com
```

#### **API Response Time Critical**
```yaml
alert: api_response_time_critical
condition: api_response_time_95th > 2000ms
duration: 3 minutes
severity: critical
action: auto_scale_infrastructure
notification:
  - pagerduty: on-call-team
  - slack: #alerts-critical
```

#### **Database Connectivity**
```yaml
alert: database_connectivity_lost
condition: db_connection_failed == true
duration: 30 seconds
severity: critical
action: restart_application
notification:
  - pagerduty: on-call-team
  - slack: #alerts-critical
```

### **Warning Alerts (Monitor & Investigate)**

#### **LLM Failure Rate Warning**
```yaml
alert: llm_failure_rate_warning
condition: llm_failure_rate > 10%
duration: 10 minutes
severity: warning
action: increase_monitoring
notification:
  - slack: #alerts-warning
  - email: devops-team@skillnavigator.com
```

#### **Low Confidence Rate Warning**
```yaml
alert: low_confidence_rate_warning
condition: low_confidence_rate > 25%
duration: 15 minutes
severity: warning
action: review_rule_configuration
notification:
  - slack: #alerts-warning
  - email: ml-team@skillnavigator.com
```

#### **Session Throughput Drop**
```yaml
alert: session_throughput_drop
condition: sessions_per_minute < 50% of 7-day average
duration: 10 minutes
severity: warning
action: investigate_user_flow
notification:
  - slack: #alerts-warning
```

### **Info Alerts (Awareness)**

#### **High LLM Latency**
```yaml
alert: llm_latency_high
condition: llm_avg_latency > 5000ms
duration: 20 minutes
severity: info
notification:
  - slack: #monitoring
```

## 🛠️ **Incident Response Procedures**

### **LLM Failure Rate Exceeds Threshold**

#### **When LLM Failure Rate > 15%**

**Immediate Actions (0-5 minutes):**
1. **Disable LLM Refinement**
   ```bash
   curl -X PUT http://localhost:3001/api/admin/emergency/disable-llm \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "High failure rate detected", "disabledBy": "automation"}'
   ```

2. **Verify System Stability**
   ```bash
   # Check if base recommendations still working
   curl -f http://localhost:3001/health
   
   # Verify sessions can complete without LLM
   curl -H "Authorization: Bearer $TEST_TOKEN" \
     http://localhost:3001/api/sessions/test-fallback-mode
   ```

3. **Alert Engineering Team**
   - Send immediate notification
   - Create incident ticket
   - Start incident response call if critical

**Investigation Actions (5-15 minutes):**
1. **Check LLM Service Status**
   ```bash
   # Check Groq API status
   curl -H "Authorization: Bearer $GROQ_API_KEY" \
     https://api.groq.com/openai/v1/models
   
   # Check our LLM health endpoint
   curl http://localhost:3001/api/debug/llm-health
   ```

2. **Analyze Recent Failures**
   ```bash
   # Get recent LLM error logs
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3001/api/admin/logs/llm-errors?hours=1"
   
   # Check error patterns
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/analytics/llm-error-patterns
   ```

3. **Review Resource Usage**
   ```bash
   # Check system resources
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/system/resources
   ```

**Resolution Actions (15+ minutes):**
1. **If Groq API Issues**: Wait for service recovery, monitor status page
2. **If Timeout Issues**: 
   - Increase timeout settings temporarily
   - Reduce context size in prompts
3. **If Validation Issues**: 
   - Review recent prompt changes
   - Check for malformed responses
4. **If Rate Limiting**: 
   - Implement exponential backoff
   - Reduce request frequency

**Re-enable Process:**
```bash
# Test LLM with single request
curl -X POST http://localhost:3001/api/admin/test/llm-request \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# If successful, re-enable gradually
curl -X PUT http://localhost:3001/api/admin/llm/enable \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"throttleRate": 0.5}'  # Start at 50% traffic

# Monitor for 10 minutes, then increase to full traffic
curl -X PUT http://localhost:3001/api/admin/llm/enable \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"throttleRate": 1.0}'
```

### **Low Confidence Rate Spike**

#### **When Low Confidence Rate > 25%**

**Investigation Steps:**
1. **Analyze Confidence Distribution**
   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/analytics/confidence-breakdown
   ```

2. **Check Rule Performance**
   ```bash
   # Get rule match statistics
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/rules/match-statistics
   
   # Identify rules with low match rates
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3001/api/admin/rules/underperforming?threshold=0.1"
   ```

3. **Review Recent Sessions**
   ```bash
   # Get recent low confidence sessions
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "http://localhost:3001/api/admin/sessions?confidence=lt:0.6&limit=20"
   ```

**Common Causes & Solutions:**
- **New User Profiles**: Add new rules for emerging patterns
- **Rule Weight Imbalance**: Adjust weights based on performance data
- **Fact Normalization Issues**: Update normalization logic
- **Questionnaire Changes**: Review impact of new questions

### **API Performance Degradation**

#### **When API Response Time > 1000ms**

**Immediate Actions:**
1. **Check System Resources**
   ```bash
   # CPU and memory usage
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/system/health
   
   # Database performance
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3001/api/admin/database/performance
   ```

2. **Enable Request Throttling**
   ```bash
   curl -X PUT http://localhost:3001/api/admin/rate-limit \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"requestsPerMinute": 60, "reason": "Performance degradation"}'
   ```

3. **Scale Infrastructure** (if auto-scaling not triggered)
   ```bash
   # Trigger manual scaling
   curl -X POST http://localhost:3001/api/admin/scale/increase \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

## 📈 **Dashboard Configuration**

### **Primary Operations Dashboard**

#### **Key Metrics Panel**
```json
{
  "dashboard": "SkillNavigator Operations",
  "panels": [
    {
      "title": "LLM Health",
      "metrics": [
        "llm_failure_rate",
        "llm_avg_latency", 
        "llm_requests_per_minute"
      ],
      "timeRange": "1h"
    },
    {
      "title": "Confidence Metrics", 
      "metrics": [
        "avg_confidence_score",
        "low_confidence_rate",
        "confidence_distribution"
      ],
      "timeRange": "24h"
    },
    {
      "title": "System Performance",
      "metrics": [
        "sessions_per_minute",
        "api_response_time_95th",
        "db_query_time_avg"
      ],
      "timeRange": "1h"
    },
    {
      "title": "Rule Engine",
      "metrics": [
        "avg_rules_matched",
        "rule_match_distribution"
      ],
      "timeRange": "24h"
    }
  ]
}
```

### **Custom Queries for Analysis**

#### **LLM Performance Analysis**
```sql
-- Average LLM latency by hour
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  AVG(llm_processing_time) as avg_latency,
  COUNT(*) as requests,
  SUM(CASE WHEN llm_status = 'failed' THEN 1 ELSE 0 END) as failures
FROM sessions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

#### **Confidence Score Trends**
```sql
-- Confidence distribution over time
SELECT 
  DATE_TRUNC('day', completed_at) as day,
  AVG(confidence) as avg_confidence,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY confidence) as median_confidence,
  COUNT(CASE WHEN confidence < 0.6 THEN 1 END) as low_confidence_count
FROM sessions
WHERE status = 'completed'
  AND completed_at >= NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day;
```

## 🔧 **Automated Response Scripts**

### **LLM Failure Response**
```bash
#!/bin/bash
# llm-failure-response.sh

FAILURE_RATE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/admin/metrics/llm-failure-rate | jq -r '.data.rate')

if (( $(echo "$FAILURE_RATE > 0.15" | bc -l) )); then
  echo "Critical LLM failure rate detected: $FAILURE_RATE"
  
  # Disable LLM refinement
  curl -X PUT http://localhost:3001/api/admin/emergency/disable-llm \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  
  # Send alert
  curl -X POST $SLACK_WEBHOOK \
    -d "{\"text\": \"🚨 LLM refinement disabled due to high failure rate: $FAILURE_RATE\"}"
  
  echo "LLM refinement disabled, engineering team notified"
fi
```

### **Health Check Script**
```bash
#!/bin/bash
# health-check.sh

# API Health
API_HEALTH=$(curl -s -f http://localhost:3001/health && echo "OK" || echo "FAIL")

# Database Health  
DB_HEALTH=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/admin/database/ping && echo "OK" || echo "FAIL")

# LLM Health
LLM_HEALTH=$(curl -s http://localhost:3001/api/debug/llm-health | jq -r '.status')

echo "System Health Check Results:"
echo "API: $API_HEALTH"
echo "Database: $DB_HEALTH" 
echo "LLM: $LLM_HEALTH"

# Alert if any component is unhealthy
if [[ "$API_HEALTH" != "OK" ]] || [[ "$DB_HEALTH" != "OK" ]] || [[ "$LLM_HEALTH" != "healthy" ]]; then
  curl -X POST $SLACK_WEBHOOK \
    -d "{\"text\": \"⚠️ Health check failed - API: $API_HEALTH, DB: $DB_HEALTH, LLM: $LLM_HEALTH\"}"
fi
```

## 📞 **Escalation Procedures**

### **Severity Levels**

#### **Critical (P0) - Immediate Response**
- **Definition**: Service completely unavailable or major feature broken
- **Response Time**: 15 minutes
- **Examples**: API down, database unavailable, authentication broken
- **Escalation**: Page on-call engineer immediately

#### **High (P1) - Urgent Response** 
- **Definition**: Major feature degraded, high user impact
- **Response Time**: 1 hour
- **Examples**: LLM failure rate >15%, API response time >2s
- **Escalation**: Slack alert to team, email to managers

#### **Medium (P2) - Standard Response**
- **Definition**: Minor feature issues, low user impact
- **Response Time**: 4 hours
- **Examples**: Low confidence rate spike, single component warning
- **Escalation**: Slack alert to team

#### **Low (P3) - Planned Response**
- **Definition**: Minor issues, cosmetic problems
- **Response Time**: 24 hours
- **Examples**: Info alerts, performance optimizations needed
- **Escalation**: Ticket creation, weekly review

### **Contact Information**

#### **Primary Escalation**
- **On-Call Engineer**: +1-555-0123 (PagerDuty)
- **Engineering Manager**: engineering-manager@skillnavigator.com
- **DevOps Lead**: devops-lead@skillnavigator.com

#### **Secondary Escalation**
- **CTO**: cto@skillnavigator.com
- **VP Engineering**: vp-engineering@skillnavigator.com

#### **Communication Channels**
- **Critical Alerts**: #alerts-critical (Slack)
- **Warning Alerts**: #alerts-warning (Slack)
- **Status Updates**: #incident-response (Slack)
- **External Communication**: status.skillnavigator.com

## 📋 **Runbook Templates**

### **Incident Response Checklist**

#### **Initial Response (0-15 minutes)**
- [ ] Assess severity and impact
- [ ] Create incident ticket
- [ ] Notify appropriate teams
- [ ] Implement immediate mitigation
- [ ] Begin status page updates

#### **Investigation (15-60 minutes)**
- [ ] Gather logs and metrics
- [ ] Identify root cause
- [ ] Implement temporary fixes
- [ ] Update stakeholders
- [ ] Document findings

#### **Resolution (1+ hours)**
- [ ] Deploy permanent fix
- [ ] Monitor system stability
- [ ] Update documentation  
- [ ] Conduct post-incident review
- [ ] Update runbooks

### **Weekly Monitoring Review**

#### **Metrics Review Checklist**
- [ ] Review LLM performance trends
- [ ] Analyze confidence score patterns
- [ ] Check rule match distribution
- [ ] Review user experience metrics
- [ ] Identify optimization opportunities
- [ ] Update alert thresholds if needed

---

**Last Updated**: September 29, 2025  
**Version**: 1.0.0  
**Maintained By**: DevOps Team  
**Next Review**: October 6, 2025