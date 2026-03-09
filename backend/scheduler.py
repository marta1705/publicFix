# backend/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from backend.services.twitter_sync import TwitterSyncService
from flask import current_app

def sync_twitter_reports():
    with current_app.app_context():
        service = TwitterSyncService()
        result = service.sync_reports()

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    scheduler.add_job(
        func=sync_twitter_reports,
        trigger="interval",
        hours=6,
        id='twitter_sync',
        name='Synchronizacja z Twitterem',
        replace_existing=True
    )
    
    scheduler.start()
    
    return scheduler