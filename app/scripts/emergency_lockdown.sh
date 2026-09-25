#!/bin/bash
# Kids Vatika HRMS - Emergency Lockdown Script
# Invalidate all sessions and force re-authentication

redis-cli -h redis.kidsvatika.com FLUSHDB
echo "All session tokens invalidated. Force logout triggered."
