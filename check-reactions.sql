-- Check reaction events in analytics
SELECT event_name, COUNT(*) as count
FROM analytics_events  
WHERE event_name IN ('reaction_awed', 'reaction_nawed')
GROUP BY event_name
ORDER BY event_name;
